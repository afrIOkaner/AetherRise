import axios from "axios";
import { pushToAetherStorage } from "../services/github-storage";
import { sanitizeAIContent } from "./sanitizer";
import { AETHER_CONFIG } from "./business-config";

export interface EngineParams {
  prompt: string;
  userId: string;
  userRole: "student" | "teacher" | "business" | "general" | "guest";
  sessionID?: string;
  university?: string;
  department?: string;
  preferredLanguage?: "Bengali" | "English";
  syncToGithub?: boolean;
  isPro?: boolean; 
  image?: string | null;        
  studentLevel?: string; 
}

export interface AIResult {
  content: string;
  provider: string;
  githubUrl?: string;
}

const HEALTH_STATUS = {
  blacklistedKeys: new Set<number>(),
  isGroqDown: false,
  isHFDown: false,
  lastHealCycle: Date.now(),
};

let currentKeyIndex = 0;

/**
 * Select keys based on user tier
 */
function getGeminiKeys(isPro: boolean) {
  if (isPro) {
    return [
      process.env.GEMINI_KEY_4 || "",
      process.env.GEMINI_KEY_5 || "",
    ].filter(Boolean);
  }

  return [
    process.env.GEMINI_KEY_1 || "",
    process.env.GEMINI_KEY_2 || "",
    process.env.GEMINI_KEY_3 || "",
  ].filter(Boolean);
}

export async function runAetherEngine(params: EngineParams): Promise<AIResult> {
  const {
    prompt,
    university,
    department,
    preferredLanguage = "Bengali",
    isPro = false,
  } = params;

  const GEMINI_KEYS = getGeminiKeys(isPro);

  // 🔄 self-healing reset
  if (Date.now() - HEALTH_STATUS.lastHealCycle > 600000) {
    HEALTH_STATUS.blacklistedKeys.clear();
    HEALTH_STATUS.isGroqDown = false;
    HEALTH_STATUS.isHFDown = false;
    HEALTH_STATUS.lastHealCycle = Date.now();
  }

  const instName = university || AETHER_CONFIG.BRAND.INSTITUTION;
  const deptName = department || "Research";

  const SYSTEM_CONTEXT = `[ROLE]: Expert at ${instName}, ${deptName}. Use LaTeX ($ inline, $$ block). Language: ${preferredLanguage}.`;

  // 🔹 TIER 1 — GEMINI ROTATION
  for (let i = 0; i < GEMINI_KEYS.length; i++) {
    const slotIndex = (currentKeyIndex + i) % GEMINI_KEYS.length;

    if (HEALTH_STATUS.blacklistedKeys.has(slotIndex)) continue;

    try {
      const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEYS[slotIndex]}`,
        {
          contents: [
            {
              parts: [{ text: `${SYSTEM_CONTEXT}\n\n${prompt}` }],
            },
          ],
        },
        { timeout: 15000 }
      );

      currentKeyIndex = (slotIndex + 1) % GEMINI_KEYS.length;

      const text =
        res?.data?.candidates?.[0]?.content?.parts
          .map((p: { text?: string }) => p.text || "")
          .join("") || "";

      if (!text) throw new Error("Empty Gemini response");

      return await finalize(text, `Gemini (${slotIndex + 1})`, params);
    } catch {
      HEALTH_STATUS.blacklistedKeys.add(slotIndex);
    }
  }

  // 🔹 TIER 2 — GROQ FALLBACK
  if (!HEALTH_STATUS.isGroqDown && process.env.GROQ_API_KEY) {
    try {
      const groqRes = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama3-8b-8192",
          messages: [{ role: "user", content: prompt }],
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          },
          timeout: 10000,
        }
      );

      return await finalize(
        groqRes.data.choices[0].message.content,
        "Groq",
        params
      );
    } catch {
      HEALTH_STATUS.isGroqDown = true;
    }
  }

  // 🔹 TIER 3 — HUGGING FACE FALLBACK
  if (!HEALTH_STATUS.isHFDown && process.env.HF_TOKEN) {
    try {
      const hfRes = await axios.post(
        "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
        { inputs: prompt },
        {
          headers: {
            Authorization: `Bearer ${process.env.HF_TOKEN}`,
          },
          timeout: 15000,
        }
      );

      const text =
        Array.isArray(hfRes.data) && hfRes.data[0]?.generated_text
          ? hfRes.data[0].generated_text
          : hfRes.data?.generated_text || "";

      if (!text) throw new Error("Empty HF response");

      return await finalize(text, "HuggingFace", params);
    } catch {
      HEALTH_STATUS.isHFDown = true;
    }
  }

  return {
    content: "System busy. Try again shortly.",
    provider: "fallback",
  };
}

/**
 * Final output processing
 */
async function finalize(
  content: string,
  provider: string,
  p: EngineParams
): Promise<AIResult> {
  const sanitized = sanitizeAIContent(content);

  let githubUrl: string | undefined;

  if (p.syncToGithub && p.userId !== "anonymous") {
    try {
      const res = await pushToAetherStorage({
        fileName: `Aether-${Date.now()}.md`,
        content: sanitized,
        userRole: p.userRole,
        userId: p.userId,
        sessionID: p.sessionID || "default",
        folder: "notes",
      });

      githubUrl = res.url;
    } catch {}
  }

  return {
    content: sanitized,
    provider,
    githubUrl,
  };
}