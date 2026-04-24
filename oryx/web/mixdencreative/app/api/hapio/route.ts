import { NextResponse } from "next/server";

import { fetchHapioAvailability, getHapioStatus } from "@/lib/hapio";

export async function GET() {
  const status = getHapioStatus();
  const availability = await fetchHapioAvailability();

  return NextResponse.json({
    configured: status.hasToken,
    bookingUrl: status.bookingUrl,
    hasServerIntegration: status.hasApiBaseUrl,
    availability,
  });
}
