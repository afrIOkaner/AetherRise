import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const BASIC_KEYS = [
  process.env.GEMINI_KEY_1,
  process.env.GEMINI_KEY_2,
  process.env.GEMINI_KEY_3,
].filter(Boolean) as string[];

const PRO_KEYS = [
  process.env.GEMINI_KEY_4,
  process.env.GEMINI_KEY_5,
].filter(Boolean) as string[];

const AETHER_SYSTEM_PROMPT = `
You are Aether AI, an academic assistant.
Respond in the same language as the user's question.
Be clear, structured, and helpful.
Use short headings and bullet points where useful.
`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query = body?.query;
    const context = body?.context || "";
    const isPro = Boolean(body?.isPro);

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    const activeKeySet = isPro ? [...PRO_KEYS, ...BASIC_KEYS] : BASIC_KEYS;

    if (!activeKeySet.length) {
      return NextResponse.json(
        { error: "No AI API keys configured" },
        { status: 500 }
      );
    }

    let lastErrorMessage = "All AI nodes failed.";

    for (const key of activeKeySet) {
      try {
        const genAI = new GoogleGenerativeAI(key);

        const model = genAI.getGenerativeModel({
          model: isPro ? "gemini-1.5-pro" : "gemini-1.5-flash",
          systemInstruction: AETHER_SYSTEM_PROMPT,
        });

        const finalPrompt = context
          ? `Context:\n${context}\n\nUser question:\n${query}`
          : query;

        const result = await model.generateContent(finalPrompt);
        const response = await result.response;
       const text = response.text() || "No response generated.";

        return NextResponse.json({ text });
      } catch (error: unknown) {
        if (error instanceof Error) {
          lastErrorMessage = error.message;
        }
        continue;
      }
    }

    return NextResponse.json(
      { error: lastErrorMessage },
      { status: 503 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}