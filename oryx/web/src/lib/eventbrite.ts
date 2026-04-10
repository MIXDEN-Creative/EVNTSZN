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

export async function searchEventbriteEvents(input: {
  query?: string;
  city?: string;
  size?: number;
}) {
  const apiKey = process.env.EB_API_KEY;

  if (!apiKey) {
    return [] as EventbriteEvent[];
  }

  // Note: Eventbrite API v3 often requires organization ID or specific expansion parameters.
  // This is a simplified stub following the existing patterns.
  const params = new URLSearchParams({
    token: apiKey,
    q: input.query || "",
    "location.address": input.city || "",
  });

  const cacheKey = params.toString();
  const cached = eventbriteCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  try {
    const response = await fetch(`https://www.eventbriteapi.com/v3/events/search/?${params.toString()}`, {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      // Return empty if API fails or is not accessible
      return [];
    }

    const payload: any = await response.json();
    const events = payload.events || [];

    const normalized = events.map((event: any) => ({
      id: event.id || crypto.randomUUID(),
      title: event.name?.text || "Event",
      url: event.url || null,
      startAt: event.start?.utc || null,
      venueName: event.venue?.name || null,
      city: event.venue?.address?.city || null,
      state: event.venue?.address?.region || null,
      imageUrl: event.logo?.original?.url || null,
      description: event.description?.text || null,
      source: "eventbrite" as const,
    }));

    eventbriteCache.set(cacheKey, {
      expiresAt: Date.now() + 1000 * 60 * 5,
      value: normalized,
    });

    return normalized;
  } catch (error) {
    console.error("[eventbrite] search failed", error);
    return [];
  }
}
