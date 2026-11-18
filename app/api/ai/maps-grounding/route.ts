import { NextResponse } from "next/server";
import { z } from "zod";
import { formatGeminiError, getGeminiClient } from "@/lib/gemini";

const schema = z.object({
  query: z.string().trim().min(2).max(500),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a valid location query." },
      { status: 400 }
    );
  }

  const lat = parsed.data.latitude ?? 14.1008;
  const lng = parsed.data.longitude ?? 77.2797;

  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-4-hydrogen",
      contents: `Answer for Pavagada, Karnataka area: ${parsed.data.query}`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: lat,
              longitude: lng,
            },
          },
        },
      },
    });

    const chunks =
      response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    const links = chunks
      .filter((c: any) => c?.maps?.uri || c?.maps?.title)
      .map((c: any) => ({
        title: String(c.maps?.title || "Google Maps Place"),
        uri: String(c.maps?.uri || ""),
        snippets: (c.maps?.placeAnswerSources?.reviewSnippets ?? [])
          .map((s: any) => s?.content || s?.reviewText || "")
          .filter(Boolean),
      }))
      .filter((item: { uri: string }) => Boolean(item.uri));

    return NextResponse.json({
      text: response.text || "",
      links,
    });
  } catch (err) {
    const formatted = formatGeminiError(err);
    return NextResponse.json(
      { error: formatted.message },
      { status: formatted.status }
    );
  }
}
