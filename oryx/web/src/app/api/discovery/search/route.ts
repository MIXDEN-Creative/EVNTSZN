import { NextResponse } from "next/server";
import { getDiscoveryNativeEvents, groupDiscoveryEventsBySource } from "@/lib/discovery";
import { searchTicketmasterEvents } from "@/lib/ticketmaster";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() || "";
  const city = url.searchParams.get("city")?.trim() || "";

  const [{ events: nativeEvents, storageReady }, externalEvents] = await Promise.all([
    getDiscoveryNativeEvents({
      query,
      city,
      limit: query || city ? 12 : 10,
    }),
    searchTicketmasterEvents({
      query,
      city,
      size: query || city ? 8 : 6,
    }).catch(() => []),
  ]);

  return NextResponse.json({
    ok: true,
    storageReady,
    native: nativeEvents,
    nativeSections: groupDiscoveryEventsBySource(nativeEvents),
    external: externalEvents.map((event) => ({
      ...event,
      isPrimary: false,
    })),
  });
}
