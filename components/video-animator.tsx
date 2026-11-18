"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { Film, Upload } from "lucide-react";

export function VideoAnimator() {
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [mimeType, setMimeType] = useState("image/jpeg");
  const [prompt, setPrompt] = useState(
    "Slow cinematic camera pan showcasing fresh market produce in warm morning sunlight."
  );
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16">("16:9");
  const [videoUrl, setVideoUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMimeType(file.type || "image/jpeg");
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImageDataUrl(reader.result);
        setVideoUrl("");
        setError("");
      }
    };
    reader.readAsDataURL(file);
  }

  async function generate(e: FormEvent) {
    e.preventDefault();
    if (!imageDataUrl) {
      setError("Upload a product or shop photo first.");
      return;
    }
    setBusy(true);
    setError("");
    setVideoUrl("");
    try {
      const res = await fetch("/api/ai/video", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          imageBase64: imageDataUrl,
          mimeType,
          prompt,
          aspectRatio,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || "Unable to generate video.");
      }
      setVideoUrl(body.videoUrl || "");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Video generation failed."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 space-y-4 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-stone-900">
            Animate Product Photo into Promo Video
          </h3>
          <p className="mt-0.5 text-xs text-stone-500">
            Upload a product photo and generate a 16:9 landscape or 9:16 portrait clip for your shop storefront.
          </p>
        </div>
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#FFF3EE] text-[#FF5A1F] shrink-0">
          <Film className="h-4 w-4" />
        </span>
      </div>

      <form onSubmit={(e) => void generate(e)} className="space-y-4">
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-[#FAFAFA] p-5 text-center hover:border-[#FF5A1F]">
          <Upload className="h-5 w-5 text-[#FF5A1F]" />
          <span className="mt-2 text-xs font-semibold text-stone-800">
            {imageDataUrl ? "Change uploaded photo" : "Upload product photo (PNG or JPG)"}
          </span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={onFile}
            className="hidden"
          />
        </label>

        {imageDataUrl && (
          <img
            src={imageDataUrl}
            alt="Uploaded product frame"
            referrerPolicy="no-referrer"
            className="h-44 w-full rounded-xl object-cover border border-stone-200"
          />
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Aspect Ratio
            </label>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value as "16:9" | "9:16")}
              className="w-full rounded-xl border border-stone-200 bg-[#FAFAFA] px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-[#FF5A1F]"
            >
              <option value="16:9">16:9 (Landscape)</option>
              <option value="9:16">9:16 (Portrait)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Motion Direction
            </label>
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe camera motion…"
              required
              className="w-full rounded-xl border border-stone-200 bg-[#FAFAFA] px-3.5 py-2.5 text-xs outline-none focus:border-[#FF5A1F]"
            />
          </div>
        </div>

        {error && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-800">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || !imageDataUrl}
          className="min-h-[44px] w-full rounded-xl bg-[#FF5A1F] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#E54910] disabled:opacity-50"
        >
          {busy ? "Generating video…" : "Generate Video"}
        </button>
      </form>

      {videoUrl && (
        <div className="pt-2 space-y-2">
          <p className="text-xs font-bold text-[#15803D]">
            Generated Promo Video ({aspectRatio})
          </p>
          <video
            src={videoUrl}
            controls
            playsInline
            className="w-full rounded-xl border border-stone-200 bg-black"
          />
        </div>
      )}
    </section>
  );
}
