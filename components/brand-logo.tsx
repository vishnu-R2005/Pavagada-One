"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";

export function BrandPinMark({ size = "md" }: { size?: "sm" | "md" | "lg" | "xl" }) {
  const dimensions =
    size === "sm"
      ? "h-8 w-8"
      : size === "lg"
        ? "h-12 w-12"
        : size === "xl"
          ? "h-16 w-16"
          : "h-9 w-9";
  const iconDim =
    size === "sm"
      ? "h-4 w-4"
      : size === "lg"
        ? "h-6 w-6"
        : size === "xl"
          ? "h-7 w-7"
          : "h-4 w-4";

  return (
    <span
      className={`relative inline-grid place-items-center ${dimensions} shrink-0`}
      aria-hidden="true"
    >
      <span className="absolute inset-0 rounded-full rounded-br-[3px] rotate-45 bg-[#FF5A1F] shadow-md shadow-[#FF5A1F]/25" />
      <span className="relative z-10 grid place-items-center rounded-full bg-white/15 p-1">
        <ShoppingCart className={`${iconDim} text-white`} strokeWidth={2.3} />
      </span>
    </span>
  );
}

export function BrandLogo({
  href = "/",
  variant = "dark",
  size = "md",
}: {
  href?: string;
  variant?: "dark" | "light";
  size?: "sm" | "md" | "lg";
}) {
  const pinSize = size === "sm" ? "sm" : size === "lg" ? "lg" : "md";
  const textSize =
    size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-lg";

  const content = (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0">
      <BrandPinMark size={pinSize} />
      <span className={`font-bold tracking-tight ${textSize}`}>
        <span className={variant === "light" ? "text-white" : "text-[#FF5A1F]"}>
          Pavagada
        </span>{" "}
        <span className={variant === "light" ? "text-emerald-300" : "text-[#15803D]"}>
          One
        </span>
      </span>
    </span>
  );

  if (!href) return content;
  return (
    <Link
      href={href}
      className="inline-flex items-center whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A1F] rounded-xl"
    >
      {content}
    </Link>
  );
}
