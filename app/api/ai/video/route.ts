import { NextResponse } from "next/server";
import { z } from "zod";
import { formatGeminiError, getGeminiClient } from "@/lib/gemini";

const schema = z.object({
  imageBase64: z.string().min(16),
  mimeType: z
    .string()
    .regex(/^image\/(png|jpeg|jpg|webp)$/i)
    .default("image/jpeg"),
  prompt: z.string().trim().min(3).max(800),
  aspectRatio: z.enum(["16:9", "9:16"]).default("16:9"),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Upload a valid image, motion prompt, and 16:9 or 9:16 aspect ratio." },
      { status: 400 }
    );
  }

  const { imageBase64, mimeType, prompt, aspectRatio } = parsed.data;
  const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

  try {
    const ai = getGeminiClient();
    const interaction = await ai.interactions.create(
      {
        model: "gemini-omni-1.2-flash",
        input: [
          {
            type: "image",
            mime_type: mimeType,
            data: cleanBase64,
          },
          {
            type: "text",
            text: prompt,
          },
        ],
        background: false,
        store: false,
        stream: false,
        response_format: {
          type: "video",
          aspect_ratio: aspectRatio,
        },
      },
      { timeout: 300000 }
    );

    const videoPart = interaction.output_video;
    if (!videoPart || (!videoPart.data && !videoPart.uri)) {
      return NextResponse.json(
        { error: "Video generation did not return a video output." },
        { status: 502 }
      );
    }

    const outMime = videoPart.mime_type || "video/mp4";
    const videoUrl = videoPart.data
      ? `data:${outMime};base64,${videoPart.data}`
      : videoPart.uri;

    return NextResponse.json({
      videoUrl,
      mimeType: outMime,
      aspectRatio,
    });
  } catch (err) {
    const formatted = formatGeminiError(err);
    return NextResponse.json(
      { error: formatted.message },
      { status: formatted.status }
    );
  }
}
