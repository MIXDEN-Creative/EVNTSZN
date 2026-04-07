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

function scoreExternalResult(
  event: {
    title: string | null;
    city: string | null;
    venueName: string | null;
    startAt: string | null;
  },
  query: string,
  city: string,
) {
  let score = 0;
  const normalizedQuery = query.toLowerCase();
  const normalizedCity = city.toLowerCase();
  const haystack = [event.title, event.venueName, event.city].filter(Boolean).join(" ").toLowerCase();

  if (normalizedQuery) {
    if (haystack.includes(normalizedQuery)) score += 24;
    if (event.title?.toLowerCase().includes(normalizedQuery)) score += 12;
  }

  if (normalizedCity) {
    if (event.city?.toLowerCase() === normalizedCity) score += 30;
    else if (event.city?.toLowerCase().includes(normalizedCity)) score += 16;
  }

  if (event.startAt) {
    const delta = new Date(event.startAt).getTime() - Date.now();
    if (delta > 0) {
      score += Math.max(0, 18 - Math.floor(delta / (1000 * 60 * 60 * 24)));
    }
  }

  return score;
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

  const rankedExternal = [...externalEvents].sort(
    (a, b) => scoreExternalResult(b, query, city) - scoreExternalResult(a, query, city),
  );
  const mergedResults = [
    ...nativeResult.events.map((event) => ({
      id: event.id,
      title: event.title,
      href: event.href,
      imageUrl:
        event.imageUrl ||
        "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1800&q=80",
      venue: event.subtitle || event.heroNote || "EVNTSZN listing",
      city: event.city,
      state: event.state,
      startAt: event.startAt,
      source: event.source,
      badgeLabel: event.badgeLabel,
      summary:
        event.description ||
        event.heroNote ||
        `${event.sourceLabel} shaping the city calendar.`,
      isPrimary: true,
      featured: event.featured,
    })),
    ...rankedExternal.map((event) => ({
      id: event.id,
      title: event.title,
      href: event.url || "/events",
      imageUrl:
        event.imageUrl ||
        "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1800&q=80",
      venue: event.venueName || "Venue to be announced",
      city: event.city || "",
      state: event.state || "",
      startAt: event.startAt,
      source: "ticketmaster" as const,
      badgeLabel: "External listing",
      summary:
        "Broader city demand pulled into EVNTSZN discovery without crowding out EVNTSZN-led inventory.",
      isPrimary: false,
    })),
  ];

  return NextResponse.json({
    ok: true,
    storageReady: nativeResult.storageReady,
    native: nativeResult.events,
    nativeSections: groupDiscoveryEventsBySource(nativeResult.events),
    external: rankedExternal.map((event) => ({
      ...event,
      isPrimary: false,
    })),
    results: mergedResults,
  });
}
