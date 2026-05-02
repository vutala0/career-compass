import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import {
  AGENT_1_SYSTEM_INSTRUCTION,
  AGENT_1_RESPONSE_SCHEMA,
  Agent1Response,
  Agent1Recommendation,
  buildAgent1UserMessage,
} from "@/lib/agent-1-prompt";
import { UserProfile } from "@/lib/profile-storage";
import rolesData from "@/data/roles.json";

const apiKey = process.env.GEMINI_API_KEY;
const MODEL = "gemini-2.5-flash";

// Build a Set of valid role IDs once at module load (not per request)
// This is our "ground truth" for hallucination detection
const VALID_ROLE_IDS = new Set(rolesData.map((r) => r.id));

interface SuccessResponse {
  recommendations: Agent1Recommendation[];
  summary_message: string;
  partial: boolean; // true if we returned fewer than 5 roles
  meta: {
    requested: number;
    returned_by_gemini: number;
    valid_after_filter: number;
    latency_ms: number;
    model: string;
  };
}

interface ErrorResponse {
  error: string;
  debugMessage?: string;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  const startTime = Date.now();

  // === Validation: API key configured ===
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set in environment");
    return NextResponse.json(
      { error: "Server misconfigured. AI is not available right now." },
      { status: 500 }
    );
  }

  // === Validation: request body has a profile ===
  let profile: UserProfile;
  try {
    const body = await request.json();
    profile = body.profile;

    if (
      !profile ||
      typeof profile.currentRole !== "string" ||
      profile.currentRole.trim().length === 0 ||
      !Array.isArray(profile.skills) ||
      profile.skills.length === 0 ||
      typeof profile.yearsOfExperience !== "number"
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid profile. Required: currentRole (string), skills (non-empty array), yearsOfExperience (number).",
        },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json(
      {
        error:
          "Invalid request body. Expected JSON with a 'profile' field matching UserProfile.",
      },
      { status: 400 }
    );
  }

  // === Build the prompt ===
  const userMessage = buildAgent1UserMessage(profile);

  // === Call Gemini ===
  let geminiText: string;
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: MODEL,
      config: {
        systemInstruction: AGENT_1_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: AGENT_1_RESPONSE_SCHEMA,
      },
      contents: userMessage,
    });

    geminiText = response.text ?? "";
    if (geminiText.length === 0) {
      console.error("Agent 1: Gemini returned an empty response");
      return NextResponse.json(
        {
          error:
            "We couldn't generate recommendations right now. Please try again in a moment.",
        },
        { status: 502 }
      );
    }
  } catch (err) {
    console.error("Agent 1: Gemini API call failed:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";

    return NextResponse.json(
      {
        error:
          "Sorry, we couldn't generate recommendations right now. Please try again in a moment.",
        debugMessage: errorMessage,
      },
      { status: 500 }
    );
  }

  // === Parse Gemini's response ===
  let parsed: Agent1Response;
  try {
    parsed = JSON.parse(geminiText);
  } catch (err) {
    console.error(
      "Agent 1: Failed to parse Gemini response as JSON:",
      geminiText
    );
    return NextResponse.json(
      {
        error:
          "We received an unexpected response from the AI. Please try again.",
        debugMessage: err instanceof Error ? err.message : "JSON parse error",
      },
      { status: 502 }
    );
  }

  if (
    !parsed ||
    !Array.isArray(parsed.recommendations) ||
    typeof parsed.summary_message !== "string"
  ) {
    console.error(
      "Agent 1: Gemini response shape was invalid:",
      JSON.stringify(parsed).slice(0, 500)
    );
    return NextResponse.json(
      { error: "We received an unexpected response shape from the AI." },
      { status: 502 }
    );
  }

  const requestedCount = parsed.recommendations.length;

  // === HALLUCINATION GATE (Decision #47, Approach 3) ===
  // Drop any recommendation whose role_id is not in our verified database
  const validRecommendations = parsed.recommendations.filter((rec) => {
    const isValid = VALID_ROLE_IDS.has(rec.role_id);
    if (!isValid) {
      console.warn(
        `Agent 1: Dropped hallucinated role_id "${rec.role_id}" — not in database`
      );
    }
    return isValid;
  });

  // === Insufficient valid roles ===
  if (validRecommendations.length === 0) {
    return NextResponse.json(
      {
        error:
          "We couldn't find strong matches yet. Try adding more skills or describing your day-to-day work.",
      },
      { status: 200 } // Not a server error — a product state
    );
  }

  // === Build the success response ===
  const latencyMs = Date.now() - startTime;
  const successResponse: SuccessResponse = {
    recommendations: validRecommendations,
    summary_message: parsed.summary_message,
    partial: validRecommendations.length < 5,
    meta: {
      requested: 5,
      returned_by_gemini: requestedCount,
      valid_after_filter: validRecommendations.length,
      latency_ms: latencyMs,
      model: MODEL,
    },
  };

  return NextResponse.json(successResponse);
}

// GET handler for sanity checking
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "POST a JSON body with a 'profile' field (UserProfile shape).",
    model: MODEL,
    apiKeyConfigured: !!apiKey,
    databaseSize: rolesData.length,
    validRoleIdsCount: VALID_ROLE_IDS.size,
  });
}