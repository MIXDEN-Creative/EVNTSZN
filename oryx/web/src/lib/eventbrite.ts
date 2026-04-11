export type EventbriteEvent = {
  id: string;
  title: string;
  url: string | null;
  startAt: string | null;
  venueName: string | null;
  city: string | null;
  state: string | null;
  imageUrl: string | null;
  description: string | null;
  source: "eventbrite";
};

const eventbriteCache = new Map<string, { expiresAt: number; value: EventbriteEvent[] }>();

type EventbriteSearchResponse = {
  events?: Array<{
    id?: string;
    url?: string;
    name?: { text?: string | null } | null;
    summary?: string | null;
    description?: { text?: string | null } | null;
    start?: { utc?: string | null } | null;
    logo?: {
      original?: {
        url?: string | null;
      } | null;
    } | null;
    primary_venue?: {
      name?: string | null;
      address?: {
        city?: string | null;
        region?: string | null;
      } | null;
    } | null;
  }>;
};

export async function searchEventbriteEvents(input: {
  query?: string;
  city?: string;
  size?: number;
}) {
  const apiKey = process.env.EVENTBRITE_API_KEY || process.env.EB_API_KEY;

  if (!apiKey) {
    return [] as EventbriteEvent[];
  }

  const params = new URLSearchParams({
    q: input.query?.trim() || "",
    expand: "primary_venue",
    page_size: String(input.size || 8),
    sort_by: "date",
  });

  if (input.city?.trim()) {
    params.set("location.address", input.city.trim());
  }

  const cacheKey = params.toString();
  const cached = eventbriteCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  try {
    const response = await fetch(`https://www.eventbriteapi.com/v3/events/search/?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return cached?.value || [];
    }

    const payload = (await response.json()) as EventbriteSearchResponse;
    const events = payload.events || [];

    const normalized = events.map((event) => ({
      id: event.id || crypto.randomUUID(),
      title: event.name?.text || "Event",
      url: event.url || null,
      startAt: event.start?.utc || null,
      venueName: event.primary_venue?.name || null,
      city: event.primary_venue?.address?.city || input.city?.trim() || null,
      state: event.primary_venue?.address?.region || null,
      imageUrl: event.logo?.original?.url || null,
      description: event.summary || event.description?.text || null,
      source: "eventbrite" as const,
    }));

    eventbriteCache.set(cacheKey, {
      expiresAt: Date.now() + 1000 * 60 * 5,
      value: normalized,
    });

    return normalized;
  } catch (error) {
    console.error("[eventbrite] search failed", error);
    return cached?.value || [];
  }
}

export async function getEventbriteShowcase(cities: string[] = ["Baltimore", "Atlanta", "New York", "Miami", "Washington"]) {
  const groups = await Promise.all(
    cities.map((city) =>
      searchEventbriteEvents({
        city,
        size: 2,
      }).catch(() => [] as EventbriteEvent[]),
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
    .slice(0, 8);
}
