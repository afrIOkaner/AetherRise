import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';

/**
 * Categorizing API Keys based on User Tier
 * Keys 1-3 for Basic users, Keys 4-5 for Pro users
 */
const BASIC_KEYS = [process.env.GEMINI_KEY_1, process.env.GEMINI_KEY_2, process.env.GEMINI_KEY_3].filter(Boolean) as string[];
const PRO_KEYS = [process.env.GEMINI_KEY_4, process.env.GEMINI_KEY_5].filter(Boolean) as string[];

export async function POST(req: Request) {
  try {
    const { query, context, isPro } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    /**
     * Auto-healing logic chooses the key set based on user tier.
     * Pro users get priority access to nodes 4 and 5.
     */
    const activeKeySet = isPro ? [...PRO_KEYS, ...BASIC_KEYS] : BASIC_KEYS;
    
    let lastErrorMessage = "All designated nodes exhausted.";

    for (const key of activeKeySet) {
      try {
        const genAI = new GoogleGenerativeAI(key);
        // Pro users get the stronger 1.5-pro model for complex reasoning
        const model = genAI.getGenerativeModel({ model: isPro ? "gemini-1.5-pro" : "gemini-1.5-flash" });

        const systemPrompt = `
          You are Aether Tutor, an expert academic assistant. 
          Context: ${context || 'No context'}
          Question: ${query}
          Instruction: Use LaTeX for math and provide a precise academic response.
        `;

        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        
        return NextResponse.json({ text: response.text() });

      } catch (error: unknown) {
        /**
         * Safely extract error message without using 'any'
         */
        if (error instanceof Error) {
          console.warn(`Node failure: ${error.message}. Retrying...`);
          lastErrorMessage = error.message;
        }
        continue;
      }
    }

    throw new Error(lastErrorMessage);

  } catch (error: unknown) {
    const finalMessage = error instanceof Error ? error.message : "Unknown critical failure";
    console.error("Aether Engine Critical Failure:", finalMessage);
    
    return NextResponse.json(
      { error: `Auto-healing engine failed: ${finalMessage}` }, 
      { status: 500 }
    );
  }
}