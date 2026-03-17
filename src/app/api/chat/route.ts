import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

type Tier = "free" | "pro";

function getGeminiKeysByTier(tier: Tier): string[] {
  if (tier === "pro") {
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

async function generateWithGemini(apiKey: string, query: string) {
  const genAI = new GoogleGenerativeAI(apiKey);

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
  });

  const result = await model.generateContent(query);
  const response = await result.response;
  const text = response.text();

  if (!text?.trim()) {
    throw new Error("Empty response from Gemini.");
  }

  return text;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const query = body?.query?.trim();
    const isPro = Boolean(body?.isPro);

    if (!query) {
      return NextResponse.json(
        { error: "Query is required." },
        { status: 400 }
      );
    }

    const tier: Tier = isPro ? "pro" : "free";
    const geminiKeys = getGeminiKeysByTier(tier);

    if (geminiKeys.length === 0) {
      return NextResponse.json(
        { error: `No Gemini keys configured for ${tier} tier.` },
        { status: 500 }
      );
    }

    const errors: string[] = [];

    for (let index = 0; index < geminiKeys.length; index++) {
      const apiKey = geminiKeys[index];

      try {
        const text = await generateWithGemini(apiKey, query);

        return NextResponse.json({
          text,
          provider: "gemini",
          model: "gemini-2.5-flash",
          tier,
          keyIndex: index + 1,
        });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Gemini request failed.";
        errors.push(`Gemini key ${index + 1}: ${message}`);
      }
    }

    return NextResponse.json(
      {
        error: `All Gemini keys failed for ${tier} tier.`,
        details: errors,
      },
      { status: 500 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to generate response.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}