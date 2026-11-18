"use client";

import { useEffect, useRef, useState } from "react";
import {
  APIProvider,
  AdvancedMarker,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import { MapPin } from "lucide-react";

export type MapMarkerItem = {
  id: string;
  label: string;
  subtitle?: string;
  lat: number;
  lng: number;
  tone?: "shop" | "customer" | "zone";
};

export const PAVAGADA_COORDS: Record<string, { lat: number; lng: number }> = {
  "Pavagada Town": { lat: 14.1008, lng: 77.2797 },
  Hirehalli: { lat: 14.1325, lng: 77.2465 },
  "Kudligi Road": { lat: 14.1112, lng: 77.2692 },
  Nellikayannahatti: { lat: 14.0875, lng: 77.2912 },
  "Temple Street": { lat: 14.1021, lng: 77.2814 },
};

export function resolveAreaCoordinates(areaText?: string | null): {
  lat: number;
  lng: number;
} {
  const text = (areaText || "").toLowerCase();
  for (const [name, coords] of Object.entries(PAVAGADA_COORDS)) {
    if (text.includes(name.toLowerCase())) return coords;
  }
  return PAVAGADA_COORDS["Pavagada Town"];
}

function InteractivePin({
  item,
  selected,
  onSelect,
}: {
  item: MapMarkerItem;
  selected?: boolean;
  onSelect?: (item: MapMarkerItem) => void;
}) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [infoOpen, setInfoOpen] = useState(false);

  const colors =
    item.tone === "shop"
      ? { background: "#15803D", borderColor: "#166534", glyphColor: "#FFFFFF" }
      : item.tone === "customer"
        ? {
            background: "#FF5A1F",
            borderColor: "#E54910",
            glyphColor: "#FFFFFF",
          }
        : selected
          ? {
              background: "#FF5A1F",
              borderColor: "#E54910",
              glyphColor: "#FFFFFF",
            }
          : {
              background: "#FFFFFF",
              borderColor: "#FF5A1F",
              glyphColor: "#FF5A1F",
            };

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: item.lat, lng: item.lng }}
        title={item.label}
        onClick={() => {
          setInfoOpen(true);
          onSelect?.(item);
        }}
      >
        <Pin
          background={colors.background}
          borderColor={colors.borderColor}
          glyphColor={colors.glyphColor}
          scale={selected ? 1.25 : 1.05}
        />
      </AdvancedMarker>
      {infoOpen && marker && (
        <InfoWindow
          anchor={marker}
          maxWidth={220}
          onCloseClick={() => setInfoOpen(false)}
        >
          <div className="p-1 text-[#14221B]">
            <p className="text-xs font-semibold">{item.label}</p>
            {item.subtitle && (
              <p className="mt-0.5 text-[11px] text-[#14221B]/70">
                {item.subtitle}
              </p>
            )}
          </div>
        </InfoWindow>
      )}
    </>
  );
}

function RoutePolyline({
  origin,
  destination,
  onRouteInfo,
}: {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  onRouteInfo?: (info: { distanceText: string; durationText: string }) => void;
}) {
  const map = useMap();
  const routesLib = useMapsLibrary("routes");
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const onRouteInfoRef = useRef(onRouteInfo);
  onRouteInfoRef.current = onRouteInfo;

  useEffect(() => {
    if (!routesLib || !map) return;

    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];
    let cancelled = false;

    const request: google.maps.routes.ComputeRoutesRequest = {
      origin,
      destination,
      travelMode: "DRIVING",
      fields: ["path", "distanceMeters", "durationMillis", "viewport"],
    };

    routesLib.Route.computeRoutes(request)
      .then((response) => {
        if (cancelled) return;
        const primaryRoute = response.routes?.[0];
        if (!primaryRoute) return;

        const newPolylines = primaryRoute.createPolylines();
        newPolylines.forEach((polyline) => {
          polyline.setOptions({
            strokeColor: "#0F5132",
            strokeOpacity: 0.9,
            strokeWeight: 5,
          });
          polyline.setMap(map);
        });
        polylinesRef.current = newPolylines;

        if (primaryRoute.viewport) {
          map.fitBounds(primaryRoute.viewport);
        }
        const meters = primaryRoute.distanceMeters;
        const millis = primaryRoute.durationMillis;
        if (meters && millis) {
          onRouteInfoRef.current?.({
            distanceText: `${(meters / 1000).toFixed(1)} km`,
            durationText: `${Math.max(1, Math.round(millis / 60000))} min`,
          });
        }
      })
      .catch((err: unknown) => {
        const msg = String(err ?? "");
        if (
          msg.includes("OVER_QUERY_LIMIT") ||
          msg.includes("RESOURCE_EXHAUSTED") ||
          msg.includes("Quota")
        ) {
          window.dispatchEvent(new CustomEvent("gmp-quota-exceeded"));
        }
      });

    return () => {
      cancelled = true;
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
    };
  }, [routesLib, map, origin.lat, origin.lng, destination.lat, destination.lng]);

  return null;
}

export function PavagadaMap({
  markers,
  center = PAVAGADA_COORDS["Pavagada Town"],
  zoom = 13,
  selectedId,
  onSelectMarker,
  routeOrigin,
  routeDestination,
  heightClass = "h-[300px]",
}: {
  markers: MapMarkerItem[];
  center?: { lat: number; lng: number };
  zoom?: number;
  selectedId?: string;
  onSelectMarker?: (marker: MapMarkerItem) => void;
  routeOrigin?: { lat: number; lng: number };
  routeDestination?: { lat: number; lng: number };
  heightClass?: string;
}) {
  const [apiKey, setApiKey] = useState<string>(
    (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string) || ""
  );
  const [loaded, setLoaded] = useState(
    Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)
  );
  const [mapError, setMapError] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [routeSummary, setRouteSummary] = useState<{
    distanceText: string;
    durationText: string;
  } | null>(null);

  useEffect(() => {
    if (apiKey) return;
    fetch("/api/maps/config")
      .then((r) => r.json())
      .then((d) => {
        if (d.apiKey) setApiKey(d.apiKey);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [apiKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onQuota = () => setMapError(true);
    window.addEventListener("gmp-quota-exceeded", onQuota);

    const prevAuthFailure = (window as { gm_authFailure?: () => void }).gm_authFailure;
    (window as { gm_authFailure?: () => void }).gm_authFailure = () => {
      setMapError(true);
      prevAuthFailure?.();
    };
    const el = wrapperRef.current;
    if (!el) {
      return () => {
        window.removeEventListener("gmp-quota-exceeded", onQuota);
        (window as { gm_authFailure?: () => void }).gm_authFailure = prevAuthFailure;
      };
    }
    const observer = new MutationObserver(() => {
      const text = (el.textContent || "").toLowerCase();
      if (
        el.querySelector(".gm-err-container") ||
        text.includes("quota reached") ||
        text.includes("for development purposes only")
      ) {
        setMapError(true);
      }
    });
    observer.observe(el, { childList: true, subtree: true, characterData: true });
    return () => {
      window.removeEventListener("gmp-quota-exceeded", onQuota);
      observer.disconnect();
      (window as { gm_authFailure?: () => void }).gm_authFailure = prevAuthFailure;
    };
  }, [apiKey]);

  if (!loaded && !apiKey) {
    return (
      <div
        className={`${heightClass} w-full rounded-2xl border border-stone-200 bg-[#F3F0EA] grid place-items-center text-xs text-stone-500`}
      >
        Loading Pavagada Map…
      </div>
    );
  }

  if (!apiKey || mapError) {
    return (
      <div
        className={`${heightClass} relative w-full overflow-hidden rounded-2xl border border-stone-200 bg-[#F2EFE8]`}
      >
        {/* Subtle stylized road & green zone grid */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.85) 2px, transparent 2px), linear-gradient(to bottom, rgba(255,255,255,0.85) 2px, transparent 2px)",
            backgroundSize: "52px 44px",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-6 top-6 h-14 w-24 rounded-2xl bg-[#DCE9D5]/70"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-8 bottom-8 h-16 w-28 rounded-2xl bg-[#DCE9D5]/70"
        />

        {/* Interactive Route & Pins */}
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-5 py-6 text-center">
          {routeOrigin && routeDestination && markers.length >= 2 ? (
            <div className="flex w-full max-w-sm items-center justify-between gap-2 rounded-2xl border border-stone-200/80 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-xs">
              <div className="flex min-w-0 items-center gap-2 text-left">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[#FF5A1F] text-white shrink-0">
                  <MapPin className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-stone-900">
                    {markers[0].label}
                  </p>
                  <p className="text-[10px] text-stone-500">Pickup</p>
                </div>
              </div>

              <span className="h-0.5 flex-1 border-t-2 border-dashed border-[#2563EB]" />

              <div className="flex min-w-0 items-center gap-2 text-right">
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-stone-900">
                    {markers[1].label}
                  </p>
                  <p className="text-[10px] text-stone-500">Drop-off</p>
                </div>
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[#15803D] text-white shrink-0">
                  <MapPin className="h-4 w-4" />
                </span>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-2.5 grid h-10 w-10 place-items-center rounded-full bg-[#FF5A1F] text-white shadow-md shadow-[#FF5A1F]/30">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="flex flex-wrap justify-center gap-1.5">
                {markers.slice(0, 4).map((m) => {
                  const active = selectedId === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => onSelectMarker?.(m)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold shadow-xs transition ${
                        active
                          ? "bg-[#FF5A1F] text-white"
                          : "bg-white/95 text-stone-700 hover:bg-white"
                      }`}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        ref={wrapperRef}
        className={`${heightClass} w-full overflow-hidden rounded-2xl border border-stone-200 bg-[#EDE8DF]`}
      >
        <APIProvider
          apiKey={apiKey}
          libraries={["marker", "routes"]}
          language="en"
          region="IN"
        >
          <GoogleMap
            mapId="DEMO_MAP_ID"
            defaultCenter={center}
            defaultZoom={zoom}
            gestureHandling="greedy"
            disableDefaultUI={false}
            internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
            style={{ width: "100%", height: "100%" }}
          >
            {markers.map((item) => (
              <InteractivePin
                key={item.id}
                item={item}
                selected={selectedId === item.id}
                onSelect={onSelectMarker}
              />
            ))}
            {routeOrigin && routeDestination && (
              <RoutePolyline
                origin={routeOrigin}
                destination={routeDestination}
                onRouteInfo={setRouteSummary}
              />
            )}
          </GoogleMap>
        </APIProvider>
      </div>
      {routeSummary && (
        <p className="text-xs font-medium text-[#15803D]">
          Estimated route: {routeSummary.distanceText} · {routeSummary.durationText}
        </p>
      )}
    </div>
  );
}
