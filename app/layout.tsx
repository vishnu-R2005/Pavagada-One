import type { Metadata } from "next";
import "./globals.css";
import { MapsQuotaBanner } from "@/components/maps-quota-banner";
import { GeminiAssistant } from "@/components/gemini-assistant";
import { SessionBridge } from "@/components/session-bridge";

export const metadata: Metadata = {
  title: "Pavagada One — Local Commerce & Delivery",
  description:
    "Order fresh groceries, dairy, and daily essentials from trusted Pavagada shops with live local delivery tracking.",
  openGraph: {
    title: "Pavagada One — Local Commerce & Delivery",
    description:
      "Order fresh groceries, dairy, and daily essentials from trusted Pavagada shops with live local delivery tracking.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#FAFAFA] font-sans text-stone-900 selection:bg-[#FF5A1F]/15 selection:text-[#FF5A1F]">
        <SessionBridge />
        <MapsQuotaBanner />
        {children}
        <GeminiAssistant />
      </body>
    </html>
  );
}