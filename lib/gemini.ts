import { GoogleGenAI } from "@google/genai";

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Check your API key in Settings > Secrets."
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

export function formatGeminiError(err: unknown): {
  status: number;
  message: string;
} {
  const raw = err instanceof Error ? err.message : String(err ?? "Gemini request failed");
  const lower = raw.toLowerCase();

  if (lower.includes("not configured") || lower.includes("api_key_invalid") || lower.includes("api key")) {
    return {
      status: 400,
      message:
        "Gemini API key is missing or invalid. Please check GEMINI_API_KEY in Settings > Secrets.",
    };
  }
  if (lower.includes("permission_denied") || lower.includes("403")) {
    return {
      status: 403,
      message:
        "Permission denied by Gemini API. Verify your key permissions or paid billing tier in Settings > Secrets.",
    };
  }
  if (lower.includes("resource_exhausted") || lower.includes("429") || lower.includes("quota")) {
    return {
      status: 429,
      message:
        "Gemini quota limit or paid-tier requirement reached. Check your API key tier in Settings > Secrets.",
    };
  }
  if (lower.includes("not_found") || lower.includes("404")) {
    return {
      status: 404,
      message: `Requested Gemini model or resource was not found: ${raw}`,
    };
  }
  return { status: 500, message: raw };
}
