import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function isValidGoogleMapsKey(key: string): boolean {
  return /^AIza[0-9A-Za-z_-]{20,}$/.test(key.trim());
}

export async function GET() {
  const candidates = [
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    process.env.GOOGLE_MAPS_API_KEY || "",
  ];
  const validKey = candidates.find((k) => isValidGoogleMapsKey(k))?.trim() || "";
  return NextResponse.json({ apiKey: validKey });
}
