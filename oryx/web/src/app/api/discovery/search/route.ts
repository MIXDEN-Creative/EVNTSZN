import { NextRequest } from "next/server";
import { getDiscoveryNativeEvents, getDiscoveryFallbackImage, type DiscoveryNativeEvent } from "@/lib/discovery";
import { searchEventbriteEvents, type EventbriteEvent } from "@/lib/eventbrite";
import { normalizeCitySearchInput } from "@/lib/external-integrations";
import { searchTicketmasterEvents, type TicketmasterEvent } from "@/lib/ticketmaster";
import { getDiscoveryWeather } from "@/lib/weather";

type DiscoveryListing = {
  id: string;
  title: string;
  href: string;
  imageUrl: string;
  venue: string;
  city: string;
  state: string;
  startAt: string | null;
  source: "evntszn" | "host" | "independent_organizer" | "ticketmaster" | "eventbrite";
  badgeLabel: string;
  summary: string;
  isPrimary: boolean;
  featured?: boolean;
};

function getTimeRange(when: string | null) {
  const now = new Date();

  if (when === "tonight") {
    const start = new Date(now);
    start.setHours(16, 0, 0, 0);
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
    const day = start.getDay();
    const daysUntilFriday = (5 - day + 7) % 7;
    start.setDate(start.getDate() + daysUntilFriday);
    start.setHours(16, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 2);
    end.setHours(23, 59, 59, 999);
    return { startAt: start.toISOString(), endAt: end.toISOString() };
  }

  return { startAt: undefined, endAt: undefined };
}

function normalizeNativeEvent(event: DiscoveryNativeEvent): DiscoveryListing {
  return {
    id: event.id,
    title: event.title,
    href: event.href,
    imageUrl: event.imageUrl || getDiscoveryFallbackImage(event.city, event.source),
    venue: event.subtitle || event.heroNote || "EVNTSZN event",
    city: event.city,
    state: event.state,
    startAt: event.startAt,
    source: event.source,
    badgeLabel: event.badgeLabel,
    summary: event.description || event.heroNote || `${event.sourceLabel} worth planning around.`,
    isPrimary: true,
    featured: event.featured,
  };
}

function normalizeExternalEvent(event: TicketmasterEvent | EventbriteEvent): DiscoveryListing {
  return {
    id: `${event.source}-${event.id}`,
    title: event.title,
    href: event.url || "/events",
    imageUrl:
      event.imageUrl ||
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1800&q=80",
    venue: event.venueName || "Venue to be announced",
    city: event.city || "",
    state: event.state || "",
    startAt: event.startAt,
    source: event.source,
    badgeLabel: event.source === "ticketmaster" ? "Ticketmaster" : "Eventbrite",
    summary: event.description || `${event.venueName || "Live event"}${event.city ? ` · ${event.city}` : ""}`,
    isPrimary: false,
  };
}

function dedupeListings(items: DiscoveryListing[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = [item.title, item.city, item.state, item.startAt?.slice(0, 10) || "unknown", item.source]
      .join("|")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";
    const rawCity = searchParams.get("city")?.trim() || "";
    const when = searchParams.get("when");
    const latParam = searchParams.get("lat");
    const lngParam = searchParams.get("lng");
    const lat = latParam ? Number(latParam) : Number.NaN;
    const lng = lngParam ? Number(lngParam) : Number.NaN;
    const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

    const normalizedCity = rawCity ? await normalizeCitySearchInput(rawCity) : null;
    const resolvedCity = normalizedCity?.city || rawCity;
    const { startAt, endAt } = getTimeRange(when);

    const [nativeResult, ticketmasterEvents, eventbriteEvents, weather] = await Promise.all([
      getDiscoveryNativeEvents({
        query,
        city: resolvedCity,
        limit: 12,
        startAt,
        endAt,
      }),
      searchTicketmasterEvents({
        query,
        city: resolvedCity,
        size: 8,
        startAt,
        endAt,
        latitude: hasCoords ? lat : normalizedCity?.lat || undefined,
        longitude: hasCoords ? lng : normalizedCity?.lng || undefined,
      }).catch(() => []),
      searchEventbriteEvents({
        query,
        city: resolvedCity,
        size: 8,
      }).catch(() => []),
      getDiscoveryWeather({
        city: resolvedCity,
        latitude: hasCoords ? lat : normalizedCity?.lat || null,
        longitude: hasCoords ? lng : normalizedCity?.lng || null,
      }),
    ]);

    const results = dedupeListings([
      ...nativeResult.events.map(normalizeNativeEvent),
      ...ticketmasterEvents.map(normalizeExternalEvent),
      ...eventbriteEvents.map(normalizeExternalEvent),
    ]).slice(0, 12);

    return new Response(
      JSON.stringify({
        ok: true,
        query,
        native: nativeResult.events,
        external: ticketmasterEvents,
        results,
        normalizedCity: normalizedCity
          ? {
              city: normalizedCity.city,
              state: normalizedCity.state,
              label: normalizedCity.label,
            }
          : null,
        weather,
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("[discovery-search] search failed", err);
    return new Response(
      JSON.stringify({
        ok: false,
        query: "",
        native: [],
        external: [],
        results: [],
        normalizedCity: null,
        weather: null,
        error: "Search failed",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
