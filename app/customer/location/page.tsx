"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import Markdown from "react-markdown";
import {
  ChevronRight,
  ExternalLink,
  LocateFixed,
  MapPin,
  Search,
  Sparkles,
} from "lucide-react";
import { CustomerHeader } from "@/components/customer-nav";
import {
  PAVAGADA_COORDS,
  PavagadaMap,
  type MapMarkerItem,
} from "@/components/pavagada-map";
import { apiFetch } from "@/lib/client-session";

const AREAS = [
  ...Object.keys(PAVAGADA_COORDS).filter((k) => k !== "Temple Street"),
  "Other Area",
];

export default function ChooseLocation() {
  const router = useRouter();
  const [selected, setSelected] = useState("Pavagada Town");
  const [filter, setFilter] = useState("");
  const [landmarkQuery, setLandmarkQuery] = useState(
    "grocery stores, markets and landmarks near Temple Street Pavagada"
  );
  const [groundingLoading, setGroundingLoading] = useState(false);
  const [groundingError, setGroundingError] = useState("");
  const [groundingResult, setGroundingResult] = useState<{
    text: string;
    links: Array<{ title: string; uri: string; snippets?: string[] }>;
  } | null>(null);

  function confirm() {
    window.localStorage.setItem("pavagada_delivery_area", selected);
    router.replace("/customer");
  }

  const filtered = AREAS.filter((a) =>
    a.toLowerCase().includes(filter.toLowerCase())
  );

  const markers: MapMarkerItem[] = Object.keys(PAVAGADA_COORDS).map((name) => ({
    id: name,
    label: name,
    subtitle: "Pavagada One active delivery zone",
    lat: PAVAGADA_COORDS[name].lat,
    lng: PAVAGADA_COORDS[name].lng,
    tone: "zone",
  }));

  const centerCoords =
    PAVAGADA_COORDS[selected] ?? PAVAGADA_COORDS["Pavagada Town"];

  async function exploreNearby(e: FormEvent) {
    e.preventDefault();
    if (!landmarkQuery.trim()) return;
    setGroundingLoading(true);
    setGroundingError("");
    try {
      const res = await apiFetch("/api/ai/maps-grounding", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          query: landmarkQuery.trim(),
          latitude: centerCoords.lat,
          longitude: centerCoords.lng,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || "Unable to fetch Google Maps data.");
      }
      setGroundingResult({
        text: body.text || "",
        links: body.links ?? [],
      });
    } catch (err) {
      setGroundingError(
        err instanceof Error ? err.message : "Maps lookup failed."
      );
    } finally {
      setGroundingLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-stone-900 pb-28 md:pb-14">
      <CustomerHeader
        locationName={selected}
        title="Choose Location"
        backHref="/customer"
        rightSlot={<span className="w-9" aria-hidden="true" />}
      />

      <main className="mx-auto max-w-4xl px-4 pt-4 md:px-8 md:pt-6 space-y-5">
        {/* Search area or pincode */}
        <label className="flex items-center gap-2.5 rounded-2xl border border-stone-200/80 bg-[#F4F4F5] px-4 py-3 focus-within:border-[#FF5A1F] focus-within:bg-white transition-colors">
          <Search className="h-4 w-4 text-stone-400 shrink-0" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search your area or pincode"
            className="w-full bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-400"
          />
        </label>

        <div className="grid gap-5 md:grid-cols-12">
          <div className="space-y-4 md:col-span-7">
            {/* Map Frame with Floating Area Badge */}
            <div className="relative">
              <PavagadaMap
                markers={markers}
                center={centerCoords}
                zoom={13}
                selectedId={selected}
                onSelectMarker={(m) => setSelected(m.id)}
                heightClass="h-[220px] sm:h-[260px]"
              />
              <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-xl bg-white/95 px-3.5 py-2 text-center shadow-md ring-1 ring-black/5">
                <p className="text-xs font-bold text-stone-900 whitespace-nowrap">
                  {selected}
                </p>
                <p className="text-[11px] text-stone-500 whitespace-nowrap">
                  Tumakuru, Karnataka
                </p>
              </div>
            </div>

            {/* Use current GPS location */}
            <button
              type="button"
              onClick={() =>
                navigator.geolocation?.getCurrentPosition(() =>
                  setSelected("Pavagada Town")
                )
              }
              className="flex min-h-[48px] w-full items-center gap-3 rounded-2xl border border-stone-200/80 bg-white px-4 py-3 text-left text-sm font-semibold text-stone-800 hover:border-[#FF5A1F]/40 transition-colors"
            >
              <LocateFixed className="h-5 w-5 text-[#FF5A1F] shrink-0" />
              <span>Use my current location</span>
            </button>

            {/* Nearby Areas List */}
            <div>
              <p className="mb-2.5 text-xs font-medium text-stone-500">
                Or select from nearby areas
              </p>
              <div className="space-y-2.5">
                {filtered.map((area) => {
                  const active = selected === area;
                  return (
                    <button
                      type="button"
                      onClick={() => setSelected(area)}
                      key={area}
                      className={`flex min-h-[54px] w-full items-center gap-3 rounded-2xl border bg-white px-4 py-3 text-left transition ${
                        active
                          ? "border-[#FF5A1F] bg-[#FFF6F2] ring-1 ring-[#FF5A1F]/25"
                          : "border-stone-200/80 hover:border-stone-300"
                      }`}
                    >
                      <span
                        className={`grid h-8 w-8 place-items-center rounded-xl shrink-0 ${
                          active
                            ? "bg-[#FF5A1F] text-white"
                            : "bg-stone-100 text-stone-600"
                        }`}
                      >
                        <MapPin className="h-4 w-4" />
                      </span>
                      <span className="flex-1 text-sm font-semibold text-stone-900">
                        {area}
                      </span>
                      <ChevronRight
                        className={`h-4 w-4 shrink-0 ${
                          active ? "text-[#FF5A1F]" : "text-stone-400"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="hidden md:block pt-2">
              <button
                type="button"
                onClick={confirm}
                className="min-h-[50px] w-full rounded-2xl bg-[#FF5A1F] py-3.5 text-sm font-bold text-white shadow-md shadow-[#FF5A1F]/20 hover:bg-[#E54910] transition-colors"
              >
                Confirm Location
              </button>
            </div>
          </div>

          {/* Live Google Maps Grounding Discovery */}
          <section className="rounded-2xl border border-stone-200/80 bg-white p-5 space-y-3 md:col-span-5 md:self-start">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#FF5A1F]" />
              <h2 className="text-sm font-bold text-stone-900">
                Explore Nearby Landmarks
              </h2>
            </div>
            <p className="text-xs text-stone-500">
              Search live stores, streets, and landmarks in Pavagada powered by Google Maps.
            </p>
            <form onSubmit={(e) => void exploreNearby(e)} className="flex gap-2">
              <input
                value={landmarkQuery}
                onChange={(e) => setLandmarkQuery(e.target.value)}
                placeholder="Ask about places nearby…"
                className="flex-1 rounded-xl border border-stone-200 bg-[#FAFAFA] px-3 py-2 text-xs outline-none focus:border-[#FF5A1F]"
              />
              <button
                type="submit"
                disabled={groundingLoading}
                className="min-h-[38px] rounded-xl bg-[#FF5A1F] px-3.5 py-2 text-xs font-bold text-white disabled:opacity-50"
              >
                {groundingLoading ? "Finding…" : "Explore"}
              </button>
            </form>

            {groundingError && (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
                {groundingError}
              </p>
            )}

            {groundingResult && (
              <div className="space-y-3 border-t border-stone-200/80 pt-3">
                <div className="prose prose-xs max-w-none text-xs text-stone-700 [&_ul]:list-disc [&_ul]:pl-4">
                  <Markdown>{groundingResult.text}</Markdown>
                </div>
                {groundingResult.links.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <p className="text-[11px] font-bold text-[#15803D]">
                      Google Maps Place Links
                    </p>
                    {groundingResult.links.map((link, idx) => (
                      <div key={`${link.uri}-${idx}`}>
                        <a
                          href={link.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#FF5A1F] hover:underline"
                        >
                          <span>{link.title}</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        {link.snippets?.[0] && (
                          <p className="text-[11px] text-stone-500">
                            {link.snippets[0]}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Mobile Fixed Bottom CTA (Screen 2) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-stone-200/80 bg-white/95 p-4 backdrop-blur-md md:hidden">
        <button
          type="button"
          onClick={confirm}
          className="min-h-[50px] w-full rounded-2xl bg-[#FF5A1F] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#FF5A1F]/25 active:scale-[0.99] transition"
        >
          Confirm Location
        </button>
      </div>
    </div>
  );
}
