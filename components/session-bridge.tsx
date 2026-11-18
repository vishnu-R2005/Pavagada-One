"use client";

import { useEffect } from "react";
import { apiFetch, getNativeFetch } from "@/lib/client-session";

const PATCHED_KEY = "__pavagadaFetchPatched";

function installFetchBridge() {
  if (typeof window === "undefined") return;
  const w = window as unknown as Record<string, unknown>;
  if (w[PATCHED_KEY]) return;

  // Capture the original browser fetch before attempting any override
  getNativeFetch();

  const wrappedFetch: typeof window.fetch = (input, init) =>
    apiFetch(input, init);

  try {
    const ownDesc = Object.getOwnPropertyDescriptor(window, "fetch");
    if (!ownDesc || ownDesc.configurable) {
      Object.defineProperty(window, "fetch", {
        value: wrappedFetch,
        configurable: true,
        writable: true,
        enumerable: ownDesc ? ownDesc.enumerable : true,
      });
    }
  } catch {
    // Some preview/sandbox hosts expose window.fetch as a non-configurable getter;
    // apiFetch() still handles Bearer token sync directly without crashing.
  }

  try {
    w[PATCHED_KEY] = true;
  } catch {
    // Ignore if window is non-extensible
  }
}

installFetchBridge();

export function SessionBridge() {
  useEffect(() => {
    installFetchBridge();
  }, []);
  return null;
}
