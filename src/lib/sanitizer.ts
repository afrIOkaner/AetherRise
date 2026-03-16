/**
 * @file sanitizer.ts
 * @description Utility to clean AI-generated content and handle LaTeX escaping.
 * Fixes: Point 10 (LaTeX rendering) & Point 11 (Clean JSON).
 */

/**
 * Sanitizes the AI output without breaking Markdown/Code blocks.
 * @param content - The raw string output from Gemini API.
 * @returns A cleaned string safe for React hydration.
 */
export const sanitizeAIContent = (content: string): string => {
  if (!content) return "";

  return content
    // Remove Zero Width Characters that Gemini sometimes sends
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    // Normalize line endings
    .replace(/\r\n/g, "\n")
    .trim();
};

/**
 * Formats LaTeX strings to ensure they are properly escaped for rendering.
 */
export const formatLatexOutput = (text: string): string => {
  if (!text) return "";
  
  // Logic: Normalize \( ... \) to $...$ and \[ ... \] to $$...$$
  let formatted = text
    .replace(/\\\[/g, '$$$$') // Convert \[ to $$
    .replace(/\\\]/g, '$$$$') // Convert \] to $$
    .replace(/\\\(/g, '$')     // Convert \( to $
    .replace(/\\\)/g, '$');    // Convert \) to $

  return formatted; 
};

/**
 * Master function to be called by the API Route.
 * This fixes the "Module has no exported member 'sanitizeResponse'" error.
 */
export const sanitizeResponse = (text: string): string => {
  if (!text) return "";
  const sanitized = sanitizeAIContent(text);
  return formatLatexOutput(sanitized);
};

/**
 * Extracts clean JSON if the AI wraps it in markdown code blocks.
 */
export const extractJSON = (raw: string): any => {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch (e) {
    console.error("JSON Parse Error in Sanitizer", e);
    return null;
  }
};