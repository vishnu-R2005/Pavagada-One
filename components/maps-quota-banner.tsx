"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

let listenerInstalled = false;

export function MapsQuotaBanner() {
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!listenerInstalled) {
      listenerInstalled = true;
      (window as unknown as { gm_authFailure?: () => void }).gm_authFailure =
        () => {
          window.dispatchEvent(new CustomEvent("gmp-quota-exceeded"));
        };
      const origError = console.error;
      console.error = (...args: unknown[]) => {
        origError.apply(console, args);
        const msg = args.map((a) => String(a)).join(" ");
        if (
          msg.includes("OverQuotaMapError") ||
          msg.includes("QuotaExceededError")
        ) {
          window.dispatchEvent(new CustomEvent("gmp-quota-exceeded"));
        }
      };
    }

    const onQuota = () => {
      setQuotaExceeded(true);
      setDismissed(false);
    };
    window.addEventListener("gmp-quota-exceeded", onQuota);
    return () => window.removeEventListener("gmp-quota-exceeded", onQuota);
  }, []);

  if (!quotaExceeded || dismissed) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm sticky top-0 z-50 shadow-sm flex items-center justify-center gap-3">
      <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
      <span>
        Google Maps Platform quota reached. If you are the app owner, visit{" "}
        <a
          href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-semibold text-amber-950 hover:text-amber-800"
        >
          maps developer site
        </a>{" "}
        for instructions to update your account.
      </span>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss quota notice"
        className="ml-2 rounded p-1 hover:bg-amber-200/50"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
