import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY;
const MODEL = "gemini-2.5-flash";

export async function POST(request: NextRequest) {
  // Validate API key is configured
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set in environment");
    return NextResponse.json(
      { error: "Server misconfigured. AI is not available right now." },
      { status: 500 }
    );
  }

  // Parse the request body
  let prompt: string;
  try {
    const body = await request.json();
    prompt = body.prompt;
    if (typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Prompt is required and must be a non-empty string." },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Invalid request body. Expected JSON with a 'prompt' field." },
      { status: 400 }
    );
  }

  // Call Gemini
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
    });

    const text = response.text;
    if (!text) {
      console.error("Gemini returned an empty response");
      return NextResponse.json(
        { error: "AI returned an empty response. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      text,
      model: MODEL,
    });
  } catch (err) {
    // Detailed log for us, friendly message for users (Decision #40)
    console.error("Gemini API call failed:", err);
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error";

    return NextResponse.json(
      {
        error:
          "Sorry, we couldn't generate a response right now. Please try again in a moment.",
        debugMessage: errorMessage, // visible in browser network tab during development; harmless
      },
      { status: 500 }
    );
  }
}

// Optional: a GET handler for sanity checking the route works at all
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "POST a JSON body with a 'prompt' field to test Gemini.",
    model: MODEL,
    apiKeyConfigured: !!apiKey,
  });
}