/**
 * @file ai-engine.ts
 * @description High-availability AI Orchestrator with Multi-key Failover and Chapter logic.
 * Updated for AetherRise Goal 1-13: Multi-tier failover and Multi-key Gemini rotation.
 */

import axios from 'axios';
import { pushToAetherStorage, AetherPushParams } from '../services/github-storage';
import { sanitizeAIContent } from './sanitizer'; // Imported as per our goal

export interface AIResult {
  content: string;
  provider: string;
  githubUrl?: string;
}

interface GeminiPayload {
  contents: Array<{
    parts: Array<{
      text?: string;
      inlineData?: {
        mimeType: string;
        data: string;
      };
    }>;
  }>;
}

interface EngineParams {
  prompt: string;
  image?: string; 
  userRole: AetherPushParams["userRole"];
  studentLevel?: AetherPushParams["studentLevel"];
  userId: string;
  sessionID: string;
  syncToGithub?: boolean;
  preferredLanguage?: "Bengali" | "English";
  isChapterMode?: boolean; // New: To trigger chapter notes
}

// --- Multi-key Setup for Gemini (Goal: Quota Resilience) ---
const GEMINI_KEYS = [
  process.env.NEXT_PUBLIC_GEMINI_KEY_1 || "",
  process.env.NEXT_PUBLIC_GEMINI_KEY_2 || "",
  process.env.NEXT_PUBLIC_GEMINI_KEY_3 || "",
  process.env.NEXT_PUBLIC_GEMINI_KEY_4 || "",
  process.env.NEXT_PUBLIC_GEMINI_KEY_5 || ""
].filter(Boolean);

let currentKeyIndex = 0;

export async function runAetherEngine(params: EngineParams): Promise<AIResult> {
  const { prompt, image, userRole, studentLevel, preferredLanguage = "Bengali", isChapterMode } = params;

  const roleContext = userRole.toUpperCase();
  const levelContext = studentLevel ? `(Academic Level: ${studentLevel})` : "";
  
  const languageInstruction = preferredLanguage === "Bengali" 
    ? "Explanations in Bengali, but all technical terms and math MUST remain in English."
    : "Respond strictly in Professional English.";

  // Goal: Persona & Mode Detection
  const modeInstruction = isChapterMode 
    ? "MODE: CHAPTER NOTE. Provide deep, structured academic explanations with multiple sections."
    : "MODE: QUICK CHAT. Provide concise yet accurate information.";

  const SYSTEM_CONTEXT = `[SYSTEM_ROLE]: Senior ${roleContext} Expert ${levelContext}.
  [BRAND]: AetherRise.
  [FORMATTING]: Use Markdown headers. Use LaTeX for math ($$ for block, $ for inline).
  [LANGUAGE]: ${languageInstruction}
  [INSTRUCTION]: ${modeInstruction}
  [SAFEGUARD]: No backticks in plain text.`;

  const fullPrompt = `${SYSTEM_CONTEXT}\n\n[USER_REQUEST]: ${prompt}`;

  // --- Tier 1: Gemini (Multi-key Rotation) ---
  try {
    const activeKey = GEMINI_KEYS[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % GEMINI_KEYS.length; // Rotate for next call

    const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${activeKey}`;
    
    const geminiPayload: GeminiPayload = {
      contents: [{ parts: [{ text: fullPrompt }] }]
    };

    if (image) {
      geminiPayload.contents[0].parts.push({
        inlineData: { mimeType: "image/jpeg", data: image }
      });
    }

    const res = await axios.post(geminiUrl, geminiPayload, { timeout: 15000 });
    let content = res.data.candidates[0].content.parts[0].text;
    
    // Sanitize output for build safety
    content = sanitizeAIContent(content);
    
    return await finalize(content, `Gemini (Key Slot ${currentKeyIndex + 1})`, params);

  } catch (error: any) {
    console.warn("[TIER_1_FAILED]: Gemini rotation failed, trying Tier 2 (Groq).");

    // --- Tier 2: Groq (Secondary Fallback) ---
    try {
      const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', 
        { 
          model: "llama-3.3-70b-versatile", 
          messages: [
            { role: "system", content: SYSTEM_CONTEXT },
            { role: "user", content: prompt }
          ],
          temperature: 0.5 
        },
        { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` }, timeout: 10000 }
      );
      return await finalize(sanitizeAIContent(res.data.choices[0].message.content), "Groq (Fallback)", params);

    } catch (groqError: any) {
      // --- Final Resilience: Error Message ---
      return { 
        content: "AetherRise Engine is currently optimizing. Please retry in a few seconds.", 
        provider: "Resilience Guard" 
      };
    }
  }
}

async function finalize(content: string, provider: string, p: EngineParams): Promise<AIResult> {
  let githubUrl: string | undefined;

  if (p.syncToGithub) {
    try {
      const syncResult = await pushToAetherStorage({
        fileName: `AetherNote-${Date.now()}.md`,
        content,
        userRole: p.userRole,
        studentLevel: p.studentLevel,
        userId: p.userId,
        sessionID: p.sessionID,
        folder: "notes"
      });
      githubUrl = syncResult.url;
    } catch (error) {
      console.error("[GITHUB_SYNC_ERROR]:", error);
    }
  }

  return { content, provider, githubUrl };
}