import { NextResponse } from "next/server";
import { z } from "zod";
import { formatGeminiError, getGeminiClient } from "@/lib/gemini";

const ALLOWED_MODELS = [
  "gemini-4-hydrogen",
  "gemini-3.1-flash-lite",
  "gemini-4-carbon",
  "gemini-4-argon",
] as const;

const requestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "model"]),
        text: z.string().trim().min(1).max(6000),
      })
    )
    .min(1)
    .max(40),
  model: z.enum(ALLOWED_MODELS).default("gemini-4-hydrogen"),
  roleContext: z
    .enum(["customer", "merchant", "rider", "admin"])
    .default("customer"),
  useMapsGrounding: z.boolean().optional().default(false),
  latLng: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
    })
    .optional(),
});

const ROLE_INSTRUCTIONS: Record<string, string> = {
  customer:
    "You are the Pavagada One Storefront Concierge for Pavagada, Karnataka. Help customers pick groceries, understand delivery timing (20-30 min local dispatch, free delivery on orders Rs 500+, coupon PAVAGADA50), manage orders, and answer questions clearly and concisely.",
  merchant:
    "You are the Pavagada One Merchant Operations Advisor. Help local shop owners optimize inventory pricing, pack incoming orders efficiently, manage catalog items, and reduce cancellations.",
  rider:
    "You are the Pavagada One Rider Dispatch Copilot. Help delivery partners navigate Pavagada town neighborhoods cleanly, verify pickup checklists, handle Cash-on-Delivery collection, and prioritize multi-stop routes.",
  admin:
    "You are the Pavagada One Operations Control Tower Analyst. Help administrators analyze order fulfillment bottlenecks, dispatch riders, review shop applications, resolve refunds, and monitor platform SLAs.",
};

export async function POST(req: Request) {
  const parsed = requestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid chat message payload." },
      { status: 400 }
    );
  }

  const { messages, model, roleContext, useMapsGrounding, latLng } = parsed.data;
  const systemInstruction =
    ROLE_INSTRUCTIONS[roleContext] ?? ROLE_INSTRUCTIONS.customer;

  try {
    const ai = getGeminiClient();

    if (useMapsGrounding) {
      const contents = messages.map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));
      const coords = latLng ?? { latitude: 14.1008, longitude: 77.2797 };
      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents,
        config: {
          systemInstruction,
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: coords,
            },
          },
        },
      });

      const chunks =
        response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
      const groundingLinks = chunks
        .filter((c: any) => c?.maps?.uri || c?.maps?.title)
        .map((c: any) => ({
          title: String(c.maps?.title || "View on Google Maps"),
          uri: String(c.maps?.uri || ""),
          snippets: (c.maps?.placeAnswerSources?.reviewSnippets ?? [])
            .map((s: any) => s?.content || s?.reviewText || "")
            .filter(Boolean),
        }))
        .filter((item: { uri: string }) => Boolean(item.uri));

      return NextResponse.json({
        text: response.text || "I could not generate a Maps-grounded reply.",
        model: "gemini-4-hydrogen",
        groundingLinks,
      });
    }

    const history = messages.slice(0, -1).map((m) => ({
      role: m.role,
      parts: [{ text: m.text }],
    }));
    const latest = messages[messages.length - 1];

    const chat = ai.chats.create({
      model,
      config: {
        systemInstruction,
      },
      history,
    });

    const response = await chat.sendMessage({
      message: latest.text,
    });

    return NextResponse.json({
      text: response.text || "No response generated.",
      model,
      groundingLinks: [],
    });
  } catch (err) {
    const formatted = formatGeminiError(err);
    return NextResponse.json(
      { error: formatted.message },
      { status: formatted.status }
    );
  }
}
