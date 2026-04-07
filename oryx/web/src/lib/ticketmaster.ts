export type TicketmasterEvent = {
  id: string;
  title: string;
  url: string | null;
  startAt: string | null;
  venueName: string | null;
  city: string | null;
  state: string | null;
  imageUrl: string | null;
  source: "ticketmaster";
};

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
    .sort((a, b) => (b.width || 0) - (a.width || 0))[0]?.url || null;
}

export async function searchTicketmasterEvents(input: {
  query?: string;
  city?: string;
  size?: number;
}) {
  const apiKey = process.env.TM_API_KEY;

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

  const response = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?${params.toString()}`, {
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`Ticketmaster Discovery API failed: ${response.status}`);
  }

  const payload = (await response.json()) as TicketmasterDiscoveryResponse;
  const events = payload._embedded?.events || [];

  return events.map((event) => {
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
      source: "ticketmaster" as const,
    };
  });
}
