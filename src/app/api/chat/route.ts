import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';

/**
 * [SECTION: API KEY CONFIGURATION]
 * tiered API key management for improved reliability and performance. Basic keys are used for standard queries, while Pro keys are reserved for high-priority or complex research tasks. This setup allows for better load distribution and ensures that critical queries have access to more powerful resources when needed.
 */
const BASIC_KEYS = [
  process.env.GEMINI_KEY_1, 
  process.env.GEMINI_KEY_2, 
  process.env.GEMINI_KEY_3
].filter(Boolean) as string[];

const PRO_KEYS = [
  process.env.GEMINI_KEY_4, 
  process.env.GEMINI_KEY_5
].filter(Boolean) as string[];

/**
 * [SECTION: IMPROVED SYSTEM PROMPT]
 *Output quality enhancement through a more detailed and structured system prompt. This prompt guides the AI to produce more precise, well-organized, and academically rigorous responses, which is crucial for research-related queries. By specifying formatting rules, tone, and content structure, we can ensure that the generated output meets higher standards of clarity and professionalism.
 */
const AETHER_ACADEMIC_PROMPT = `
You are the "Aether AI Research Engine" (Version 3.0). Your mission is to assist researchers and students with high-precision academic content.
Follow these formatting rules strictly:
1. **Language**: Respond in the language of the user's query (Bengali/English).
2. **Structure**: 
   - Start with a clear # Title.
   - Provide a brief ## Abstract/Overview.
   - Use ## Key Analysis for the main body with bullet points.
   - Include a ## Methodology or Technical Insight section if applicable.
   - End with a ## Conclusion.
3. **Math & Science**: Use LaTeX for ALL equations and scientific notations. Inline: $E=mc^2$, Block: $$...$$.
4. **Tone**: Maintain a professional, objective, and scholarly tone. No conversational filler.
5. **Citations**: If the user provides context, cite specific parts of it.
`;

export async function POST(req: Request) {
  try {
    const { query, context, isPro } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Research query is required" }, { status: 400 });
    }

    // [SECTION: AUTO-HEALING NODE SELECTION]
    const activeKeySet = isPro ? [...PRO_KEYS, ...BASIC_KEYS] : BASIC_KEYS;
    let lastErrorMessage = "All research nodes are currently saturated.";

    for (const key of activeKeySet) {
      try {
        const genAI = new GoogleGenerativeAI(key);
        
        // [SECTION: MODEL INITIALIZATION]
        const model = genAI.getGenerativeModel({ 
          model: isPro ? "gemini-1.5-pro" : "gemini-1.5-flash",
          systemInstruction: AETHER_ACADEMIC_PROMPT, // Enhanced quality instruction
        });

        // Prompt formatting for better context injection
        const finalPrompt = context 
          ? `[ACADEMIC CONTEXT PROVIDED]:\n${context}\n\n[USER QUERY]:\n${query}`
          : query;

        const result = await model.generateContent(finalPrompt);
        const response = await result.response;
        const text = response.text();
        
        // [SECTION: RESPONSE VALIDATION]
        return NextResponse.json({ text });

      } catch (error: unknown) {
        if (error instanceof Error) {
          console.warn(`Node failure: ${error.message}. Switching node...`);
          lastErrorMessage = error.message;
        }
        continue; // Try the next key/node in case of failure
      }
    }

    return NextResponse.json(
      { error: `Aether Engine Node Failure: ${lastErrorMessage}` }, 
      { status: 503 }
    );

  } catch (error: unknown) {
    const finalMessage = error instanceof Error ? error.message : "Critical system failure";
    console.error("System Error:", finalMessage);
    
    return NextResponse.json(
      { error: `Internal Engine Error: ${finalMessage}` }, 
      { status: 500 }
    );
  }
}