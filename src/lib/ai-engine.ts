/**
 * @file ai-engine.ts
 * @description Core orchestration engine for Aether AI with self-healing capabilities and multi-tier failover.
 */

import axios from 'axios';
import { pushToAetherStorage } from '../services/github-storage';
import { sanitizeAIContent } from './sanitizer'; 
import { AETHER_CONFIG } from './business-config';

/**
 * @interface EngineParams
 * Configuration for the AI generation request.
 */
export interface EngineParams {
  prompt: string;
  userId: string;
  userRole: "student" | "teacher" | "business" | "general" | "guest"; 
  sessionID?: string;
  university?: string;
  department?: string;
  preferredLanguage?: "Bengali" | "English";
  syncToGithub?: boolean;
}

export interface AIResult {
  content: string;
  provider: string;
  githubUrl?: string;
}

/**
 * @constant HEALTH_STATUS
 * Tracks API health and blacklists failed keys to ensure high availability.
 */
const HEALTH_STATUS = {
  blacklistedKeys: new Set<number>(),
  isGroqDown: false,
  isHFDown: false,
  lastHealCycle: Date.now()
};

/**
 * @constant GEMINI_KEYS
 * Array of rotated API keys for load balancing and rate-limit mitigation.
 */
const GEMINI_KEYS = [
  process.env.NEXT_PUBLIC_GEMINI_KEY_1 || "",
  process.env.NEXT_PUBLIC_GEMINI_KEY_2 || "",
  process.env.NEXT_PUBLIC_GEMINI_KEY_3 || "",
  process.env.NEXT_PUBLIC_GEMINI_KEY_4 || "",
  process.env.NEXT_PUBLIC_GEMINI_KEY_5 || ""
].filter(Boolean);

let currentKeyIndex = 0;

/**
 * Main entry point for the AI engine. Executes primary model and falls back to secondary if necessary.
 */
export async function runAetherEngine(params: EngineParams): Promise<AIResult> {
  const { prompt, university, department, preferredLanguage = "Bengali" } = params;

  // Self-healing: Reset health nodes every 10 minutes
  if (Date.now() - HEALTH_STATUS.lastHealCycle > 600000) {
    HEALTH_STATUS.blacklistedKeys.clear();
    HEALTH_STATUS.isGroqDown = false;
    HEALTH_STATUS.lastHealCycle = Date.now();
  }

  // Constructing System Instructions for Institutional Branding
  const instName = university || AETHER_CONFIG.BRAND.INSTITUTION;
  const deptName = department || AETHER_CONFIG.BRAND.DEPARTMENT;
  const SYSTEM_CONTEXT = `[ROLE]: Expert at ${instName}, ${deptName}. Use LaTeX ($ for inline, $$ for block). Language: ${preferredLanguage}.`;

  // Tier 1: Gemini Key Rotation Strategy
  for (let i = 0; i < GEMINI_KEYS.length; i++) {
    const slotIndex = (currentKeyIndex + i) % GEMINI_KEYS.length;
    
    // Skip if the current key is blacklisted due to recent failure
    if (HEALTH_STATUS.blacklistedKeys.has(slotIndex)) continue;

    try {
      const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEYS[slotIndex]}`,
        { contents: [{ parts: [{ text: `${SYSTEM_CONTEXT}\n\n${prompt}` }] }] },
        { timeout: 15000 }
      );
      
      // Update key index for the next request cycle
      currentKeyIndex = (slotIndex + 1) % GEMINI_KEYS.length;
      
      // Sanitize and Finalize Output
      return await finalize(res.data.candidates[0].content.parts[0].text, `Gemini (Slot ${slotIndex + 1})`, params);
    } catch (err) {
      // Blacklist key and proceed to next available slot
      HEALTH_STATUS.blacklistedKeys.add(slotIndex);
    }
  }

  // Tier 2: Groq Fallback Protocol
  if (!HEALTH_STATUS.isGroqDown && process.env.GROQ_API_KEY) {
    try {
      const groqRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', 
        { model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: prompt }] },
        { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` }, timeout: 10000 }
      );
      return await finalize(groqRes.data.choices[0].message.content, "Groq (Resilience)", params);
    } catch (e) {
      HEALTH_STATUS.isGroqDown = true;
    }
  }

  return { content: "Neural Grid Busy. Please synchronize again in 30 seconds.", provider: "Core Guard" };
}

/**
 * Finalizes content by sanitizing and pushing to storage if required.
 * Targets the 'aether_notes' database structure.
 */
async function finalize(content: string, provider: string, p: EngineParams): Promise<AIResult> {
  let githubUrl: string | undefined;
  
  // Sanitize AI content to remove markdown debris and formatting errors
  const sanitized = sanitizeAIContent(content);

  // Persistence Logic: Push to GitHub if sync is enabled and user is authenticated
  if (p.syncToGithub && p.userId && p.userId !== "anonymous") {
    try {
      const syncResult = await pushToAetherStorage({
        fileName: `Aether-${Date.now()}.md`,
        content: sanitized,
        userRole: p.userRole, 
        userId: p.userId,
        sessionID: p.sessionID || "default-session",
        folder: "notes" // Aligned with 'aether_notes' database logic
      });
      githubUrl = syncResult.url;
    } catch (e) { 
      console.error("[VAULT_ERROR]: GitHub synchronization failed."); 
    }
  }
  
  return { 
    content: sanitized, 
    provider, 
    githubUrl // This URL will be persisted in the 'aether_notes' table
  };
}