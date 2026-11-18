"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Markdown from "react-markdown";
import {
  ExternalLink,
  MapPin,
  MessageSquare,
  RotateCcw,
  Send,
  Sparkles,
  X,
} from "lucide-react";

type ChatMessage = {
  id: string;
  role: "user" | "model";
  text: string;
  model?: string;
  groundingLinks?: Array<{
    title: string;
    uri: string;
    snippets?: string[];
  }>;
};

type ModelId =
  | "gemini-4-hydrogen"
  | "gemini-3.1-flash-lite"
  | "gemini-4-carbon"
  | "gemini-4-argon";

const MODEL_OPTIONS: Array<{ id: ModelId; label: string; hint: string }> = [
  { id: "gemini-4-hydrogen", label: "Gemini 4 Hydrogen", hint: "General & Maps" },
  { id: "gemini-3.1-flash-lite", label: "Flash Lite", hint: "Fast replies" },
  { id: "gemini-4-argon", label: "Gemini 4 Argon", hint: "Complex tasks" },
  { id: "gemini-4-carbon", label: "Gemini 4 Carbon", hint: "Deep reasoning" },
];

export function GeminiAssistant() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [model, setModel] = useState<ModelId>("gemini-4-hydrogen");
  const [useMaps, setUseMaps] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const roleContext = pathname.startsWith("/merchant")
    ? "merchant"
    : pathname.startsWith("/rider")
      ? "rider"
      : pathname.startsWith("/admin")
        ? "admin"
        : "customer";

  const roleLabel =
    roleContext === "merchant"
      ? "Merchant Advisor"
      : roleContext === "rider"
        ? "Rider Copilot"
        : roleContext === "admin"
          ? "Operations Analyst"
          : "Storefront Concierge";

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const prompt = input.trim();
    if (!prompt || loading) return;

    const userMsg: ChatMessage = {
      id: `${Date.now()}-u`,
      role: "user",
      text: prompt,
    };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput("");
    setError("");
    setLoading(true);

    let coords: { latitude: number; longitude: number } | undefined;
    if (useMaps && typeof navigator !== "undefined" && navigator.geolocation) {
      coords = await new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) =>
            resolve({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            }),
          () => resolve(undefined),
          { timeout: 2500 }
        );
      });
    }

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: nextHistory.map((m) => ({ role: m.role, text: m.text })),
          model: useMaps ? "gemini-4-hydrogen" : model,
          roleContext,
          useMapsGrounding: useMaps,
          latLng: coords,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || "Unable to reach assistant.");
      }
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-m`,
          role: "model",
          text: body.text || "",
          model: body.model,
          groundingLinks: body.groundingLinks ?? [],
        },
      ]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate reply."
      );
    } finally {
      setLoading(false);
    }
  }

  const hasBottomActionOnMobile =
    pathname === "/" ||
    pathname.startsWith("/customer/cart") ||
    pathname.startsWith("/customer/location") ||
    pathname.startsWith("/customer/products/");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open Pavagada One Assistant"
        className={`fixed z-40 inline-flex items-center gap-2 rounded-2xl bg-stone-900 text-xs font-semibold text-white shadow-xl transition hover:bg-[#FF5A1F] ${
          hasBottomActionOnMobile
            ? "bottom-20 right-4 h-11 w-11 justify-center md:h-auto md:w-auto md:px-4 md:py-3 md:bottom-6 md:right-6"
            : "bottom-[72px] right-4 h-11 w-11 justify-center md:h-auto md:w-auto md:px-4 md:py-3 md:bottom-6 md:right-6"
        }`}
      >
        <MessageSquare className="h-4 w-4 text-[#FF8A5B] shrink-0" />
        <span className="hidden md:inline">Pavagada Assistant</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-[#14221B]/35 backdrop-blur-xs">
          <aside className="flex h-full w-full max-w-md flex-col border-l border-[#14221B]/12 bg-[#FAF8F5] shadow-2xl">
            <header className="flex items-center justify-between border-b border-[#14221B]/10 bg-white px-5 py-4">
              <div>
                <p className="text-[11px] font-semibold text-[#0F5132]">
                  {roleLabel}
                </p>
                <h2 className="font-display text-lg font-semibold text-[#14221B]">
                  Pavagada One Chat
                </h2>
              </div>
              <div className="flex items-center gap-1.5">
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setMessages([]);
                      setError("");
                    }}
                    title="Clear conversation"
                    className="grid h-9 w-9 place-items-center rounded-xl border border-[#14221B]/12 text-[#14221B]/70 hover:text-[#14221B]"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close chat"
                  className="grid h-9 w-9 place-items-center rounded-xl border border-[#14221B]/12 text-[#14221B]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </header>

            <div className="border-b border-[#14221B]/10 bg-white px-5 py-3 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="assistant-model"
                  className="text-xs font-medium text-[#14221B]/65"
                >
                  Model
                </label>
                <select
                  id="assistant-model"
                  value={useMaps ? "gemini-4-hydrogen" : model}
                  disabled={useMaps}
                  onChange={(e) => setModel(e.target.value as ModelId)}
                  className="rounded-xl border border-[#14221B]/15 bg-[#FAF8F5] px-3 py-1.5 text-xs font-semibold outline-none focus:border-[#0F5132] disabled:opacity-60"
                >
                  {MODEL_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label} ({opt.hint})
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center justify-between text-xs font-medium text-[#14221B]/75 cursor-pointer">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-[#0F5132]" />
                  <span>Ground replies with Google Maps</span>
                </span>
                <input
                  type="checkbox"
                  checked={useMaps}
                  onChange={(e) => setUseMaps(e.target.checked)}
                  className="h-4 w-4 accent-[#0F5132]"
                />
              </label>
            </div>

            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-5 py-4 space-y-4"
            >
              {!messages.length && (
                <div className="rounded-2xl border border-[#14221B]/10 bg-white p-5 text-xs text-[#14221B]/70 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-[#0F5132]">
                    <Sparkles className="h-4 w-4" />
                    <span>Ask anything about {roleLabel.toLowerCase()} tasks</span>
                  </div>
                  <p>
                    Switch models for fast lookup or deep operational planning, or enable Google Maps grounding to find real landmarks, roads, and stores around Pavagada.
                  </p>
                </div>
              )}

              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${
                    m.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                      m.role === "user"
                        ? "bg-[#0F5132] text-white"
                        : "border border-[#14221B]/10 bg-white text-[#14221B]"
                    }`}
                  >
                    <div className="prose prose-xs max-w-none [&_a]:underline [&_ul]:list-disc [&_ul]:pl-4">
                      <Markdown>{m.text}</Markdown>
                    </div>

                    {m.groundingLinks && m.groundingLinks.length > 0 && (
                      <div className="mt-3 border-t border-[#14221B]/10 pt-2.5 space-y-1.5">
                        <p className="text-[11px] font-semibold text-[#0F5132]">
                          Google Maps Sources
                        </p>
                        {m.groundingLinks.map((link, idx) => (
                          <div key={`${link.uri}-${idx}`}>
                            <a
                              href={link.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0F5132] hover:underline"
                            >
                              <span>{link.title}</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                            {link.snippets && link.snippets.length > 0 && (
                              <p className="text-[11px] text-[#14221B]/60">
                                {link.snippets[0]}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex items-start">
                  <div className="rounded-2xl border border-[#14221B]/10 bg-white px-4 py-3 text-xs text-[#14221B]/60">
                    Thinking…
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="mx-5 mb-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-800">
                {error}
              </div>
            )}

            <form
              onSubmit={(e) => void send(e)}
              className="border-t border-[#14221B]/10 bg-white p-4"
            >
              <div className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Pavagada One Assistant…"
                  className="flex-1 rounded-xl border border-[#14221B]/15 bg-[#FAF8F5] px-3.5 py-2.5 text-xs outline-none focus:border-[#0F5132]"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="grid h-10 w-10 place-items-center rounded-xl bg-[#0F5132] text-white disabled:opacity-50"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}
    </>
  );
}
