import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';

const BASIC_KEYS = [
  process.env.GEMINI_KEY_1, 
  process.env.GEMINI_KEY_2, 
  process.env.GEMINI_KEY_3
].filter(Boolean) as string[];

const PRO_KEYS = [
  process.env.GEMINI_KEY_4, 
  process.env.GEMINI_KEY_5
].filter(Boolean) as string[];

export async function POST(req: Request) {
  try {
    const { query, context, isPro } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Pro users get their specific keys first, then fallback to basic keys
    const activeKeySet = isPro ? [...PRO_KEYS, ...BASIC_KEYS] : BASIC_KEYS;
    
    let lastErrorMessage = "All API nodes are currently exhausted.";

    for (const key of activeKeySet) {
      try {
        const genAI = new GoogleGenerativeAI(key);
        
        // BETTER: Define the persona here as a System Instruction
        const model = genAI.getGenerativeModel({ 
          model:   "gemini-2.5-flash",
          systemInstruction: "You are Aether Tutor, an expert academic assistant. Use LaTeX for math equations. Provide precise, structured, and helpful responses. If context is provided, prioritize it."
        });

        // Separate context from the user query for clarity
        const finalPrompt = `Context: ${context || 'General Knowledge'}\n\nQuestion: ${query}`;

        const result = await model.generateContent(finalPrompt);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ text });

      } catch (error: unknown) {
        if (error instanceof Error) {
          // If a key is rate-limited (429) or invalid, we catch it and 'continue' the loop
          console.warn(`Node failure detected: ${error.message}. Moving to next node...`);
          lastErrorMessage = error.message;
        }
        continue; // Try the next key in the array
      }
    }

    // If the loop finishes without returning, it means all keys failed
    return NextResponse.json(
      { error: `Aether Engine Node Failure: ${lastErrorMessage}` }, 
      { status: 503 }
    );

  } catch (error: unknown) {
    const finalMessage = error instanceof Error ? error.message : "Unknown critical failure";
    console.error("Critical System Error:", finalMessage);
    
    return NextResponse.json(
      { error: `Internal Engine Error: ${finalMessage}` }, 
      { status: 500 }
    );
  }
}