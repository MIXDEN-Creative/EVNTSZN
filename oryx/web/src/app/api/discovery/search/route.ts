import { NextRequest, NextResponse } from "next/server";
import { getDiscoveryNativeEvents, groupDiscoveryEventsBySource } from "@/lib/discovery";
import { searchTicketmasterEvents } from "@/lib/ticketmaster";

function getWindowRange(when: string) {
  const now = new Date();

  if (when === "tonight") {
    const start = new Date(now);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { startAt: start.toISOString(), endAt: end.toISOString() };
  }

  if (when === "week") {
    const end = new Date(now);
    end.setDate(end.getDate() + 7);
    return { startAt: now.toISOString(), endAt: end.toISOString() };
  }

  if (when === "weekend") {
    const start = new Date(now);
    const currentDay = start.getDay();
    const daysUntilFriday = (5 - currentDay + 7) % 7;
    start.setDate(start.getDate() + daysUntilFriday);
    start.setHours(17, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 2);
    end.setHours(23, 59, 59, 999);
    return { startAt: start.toISOString(), endAt: end.toISOString() };
  }

  return { startAt: undefined, endAt: undefined };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const query = searchParams.get("q")?.trim() || "";
  const city = searchParams.get("city")?.trim() || "";
  const when = searchParams.get("when")?.trim() || "";
  const latitude = Number(searchParams.get("lat") || "");
  const longitude = Number(searchParams.get("lng") || "");
  const { startAt, endAt } = getWindowRange(when);
  const [nativeResult, externalEvents] = await Promise.all([
    getDiscoveryNativeEvents({
      query,
      city,
      startAt,
      endAt,
      limit: query || city ? 12 : 10,
    }),
    searchTicketmasterEvents({
      query,
      city,
      startAt,
      endAt,
      latitude: Number.isFinite(latitude) ? latitude : undefined,
      longitude: Number.isFinite(longitude) ? longitude : undefined,
      size: query || city ? 8 : 6,
    }).catch(() => []),
  ]);

  return NextResponse.json({
    ok: true,
    storageReady: nativeResult.storageReady,
    native: nativeResult.events,
    nativeSections: groupDiscoveryEventsBySource(nativeResult.events),
    external: externalEvents.map((event) => ({
      ...event,
      isPrimary: false,
    })),
  });
}
