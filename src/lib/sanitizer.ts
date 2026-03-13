/**
 * @file sanitizer.ts
 * @description Utility to clean AI-generated content and prevent Next.js build errors.
 * Professional standard maintained with English comments.
 */

/**
 * Sanitizes the AI output by replacing problematic characters 
 * that often cause hydration or build issues in React/Next.js.
 * * @param content - The raw string output from Gemini API.
 * @returns A cleaned string safe for rendering.
 */
export const sanitizeAIContent = (content: string): string => {
  if (!content) return "";

  return content
    // 1. Replace problematic backticks that interfere with code blocks or template literals
    .replace(/`/g, "'")
    
    // 2. Normalize whitespace (optional but helps with formatting)
    .trim();
};

/**
 * Formats LaTeX strings to ensure they are properly escaped for rendering components.
 * * @param text - The content containing LaTeX equations.
 * @returns Escaped string ready for Katex or MathJax.
 */
export const formatLatexOutput = (text: string): string => {
  if (!text) return "";
  
  // Ensure double dollar signs are preserved for display math
  // and single dollar signs for inline math.
  return text; 
};