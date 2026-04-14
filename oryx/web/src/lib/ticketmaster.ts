export type TicketmasterEvent = {
  id: string;
  title: string;
  url: string | null;
  startAt: string | null;
  venueName: string | null;
  city: string | null;
  state: string | null;
  imageUrl: string | null;
  description: string | null;
  source: "ticketmaster";
};

const ticketmasterCache = new Map<string, { expiresAt: number; value: TicketmasterEvent[] }>();

type TicketmasterDiscoveryResponse = {
  _embedded?: {
    events?: Array<{
      id?: string;
      name?: string;
      url?: string;
      dates?: {
        start?: {
          dateTime?: string;
          localDate?: string;
        };
      };
      info?: string;
      pleaseNote?: string;
      images?: Array<{
        url?: string;
        width?: number;
      }>;
      _embedded?: {
        venues?: Array<{
          name?: string;
          city?: { name?: string };
          state?: { stateCode?: string };
        }>;
      };
    }>;
  };
};

function pickEventImage(
  images: Array<{ url?: string; width?: number }> | undefined,
) {
  return (images || [])
    .filter((image) => image.url)
    .sort((a, b) => {
      const distanceA = Math.abs((a.width || 0) - 1200);
      const distanceB = Math.abs((b.width || 0) - 1200);
      return distanceA - distanceB;
    })[0]?.url || null;
}

export async function searchTicketmasterEvents(input: {
  query?: string;
  city?: string;
  size?: number;
  startAt?: string;
  endAt?: string;
  latitude?: number;
  longitude?: number;
}) {
  const apiKey = process.env.TICKETMASTER_API_KEY || process.env.TM_API_KEY;

  if (!apiKey) {
    return [] as TicketmasterEvent[];
  }

  const params = new URLSearchParams({
    apikey: apiKey,
    size: String(input.size || 8),
    sort: "date,asc",
  });

  if (input.query?.trim()) {
    params.set("keyword", input.query.trim());
  }

  if (input.city?.trim()) {
    params.set("city", input.city.trim());
  }

  if (typeof input.latitude === "number" && typeof input.longitude === "number") {
    params.set("latlong", `${input.latitude},${input.longitude}`);
    params.set("radius", "25");
    params.set("unit", "miles");
  }

  if (input.startAt) {
    params.set("startDateTime", input.startAt);
  }

  if (input.endAt) {
    params.set("endDateTime", input.endAt);
  }

  const cacheKey = params.toString();
  const cached = ticketmasterCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const response = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?${params.toString()}`, {
    next: { revalidate: 300 },
  });

  if (response.status === 429) {
    return cached?.value || [];
  }

  if (!response.ok) {
    throw new Error(`Ticketmaster Discovery API failed: ${response.status}`);
  }

  const payload = (await response.json()) as TicketmasterDiscoveryResponse;
  const events = payload._embedded?.events || [];

  const normalized = events.map((event) => {
    const venue = event._embedded?.venues?.[0];
    return {
      id: event.id || crypto.randomUUID(),
      title: event.name || "Event",
      url: event.url || null,
      startAt: event.dates?.start?.dateTime || event.dates?.start?.localDate || null,
      venueName: venue?.name || null,
      city: venue?.city?.name || null,
      state: venue?.state?.stateCode || null,
      imageUrl: pickEventImage(event.images),
      description: event.info || event.pleaseNote || null,
      source: "ticketmaster" as const,
    };
  });

  ticketmasterCache.set(cacheKey, {
    expiresAt: Date.now() + 1000 * 60 * 5,
    value: normalized,
  });

  return normalized;
}

export async function getTicketmasterShowcase(cities: string[] = ["Baltimore", "Washington", "Rehoboth Beach", "Ocean City", "Bethany Beach"]) {
  const groups = await Promise.all(
    cities.map((city) =>
      searchTicketmasterEvents({
        city,
        size: 3,
      }).catch(() => [] as TicketmasterEvent[]),
    ),
  );

  const seen = new Set<string>();
  return groups
    .flat()
    .filter((event) => {
      if (seen.has(event.id)) return false;
      seen.add(event.id);
      return true;
    })
    .slice(0, 12);
}
