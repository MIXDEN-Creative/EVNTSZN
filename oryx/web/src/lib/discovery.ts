import { supabaseAdmin } from "@/lib/supabase-admin";

export type DiscoverySourceType =
  | "evntszn"
  | "host"
  | "independent_organizer"
  | "ticketmaster";

type DiscoveryControlRow = {
  event_id: string;
  source_type: Exclude<DiscoverySourceType, "ticketmaster">;
  badge_label: string | null;
  featured: boolean;
  listing_priority: number;
  promo_collection: string | null;
  is_discoverable: boolean;
};

type NativeEventRow = {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  description: string | null;
  city: string;
  state: string;
  start_at: string;
  hero_note: string | null;
  organizer_user_id: string | null;
};

export type DiscoveryNativeEvent = {
  id: string;
  title: string;
  slug: string;
  href: string;
  subtitle: string | null;
  description: string | null;
  city: string;
  state: string;
  startAt: string;
  heroNote: string | null;
  source: Exclude<DiscoverySourceType, "ticketmaster">;
  sourceLabel: string;
  badgeLabel: string;
  featured: boolean;
  listingPriority: number;
  promoCollection: string | null;
  isPrimary: true;
};

const SOURCE_PRIORITY: Record<Exclude<DiscoverySourceType, "ticketmaster">, number> = {
  evntszn: 0,
  host: 1,
  independent_organizer: 2,
};

function isMissingDiscoveryControlsError(error: unknown) {
  const code = typeof error === "object" && error !== null && "code" in error ? String((error as { code?: unknown }).code) : "";
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message?: unknown }).message)
      : "";

  return code === "42P01" || code === "PGRST205" || /discovery_listing_controls/i.test(message);
}

function inferSourceType(row: NativeEventRow, control?: DiscoveryControlRow | null): Exclude<DiscoverySourceType, "ticketmaster"> {
  if (control?.source_type) {
    return control.source_type;
  }

  if (!row.organizer_user_id) {
    return "evntszn";
  }

  return "independent_organizer";
}

function getSourceLabel(source: Exclude<DiscoverySourceType, "ticketmaster">) {
  switch (source) {
    case "evntszn":
      return "EVNTSZN Event";
    case "host":
      return "EVNTSZN Host";
    case "independent_organizer":
      return "Independent Organizer";
  }
}

function getDefaultBadgeLabel(source: Exclude<DiscoverySourceType, "ticketmaster">) {
  switch (source) {
    case "evntszn":
      return "Official EVNTSZN";
    case "host":
      return "EVNTSZN Host";
    case "independent_organizer":
      return "Independent Organizer";
  }
}

function sortDiscoveryEvents(a: DiscoveryNativeEvent, b: DiscoveryNativeEvent) {
  if (a.featured !== b.featured) {
    return Number(b.featured) - Number(a.featured);
  }

  const sourceDelta = SOURCE_PRIORITY[a.source] - SOURCE_PRIORITY[b.source];
  if (sourceDelta !== 0) {
    return sourceDelta;
  }

  if (a.listingPriority !== b.listingPriority) {
    return b.listingPriority - a.listingPriority;
  }

  return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
}

export async function getDiscoveryNativeEvents(input: {
  query?: string;
  city?: string;
  limit?: number;
}) {
  const query = input.query?.trim() || "";
  const city = input.city?.trim() || "";
  const limit = input.limit || 12;

  const nativeQuery = supabaseAdmin
    .from("evntszn_events")
    .select("id, title, slug, subtitle, description, city, state, start_at, hero_note, organizer_user_id")
    .eq("visibility", "published")
    .order("start_at", { ascending: true })
    .limit(limit);

  if (query) {
    nativeQuery.or(`title.ilike.%${query}%,subtitle.ilike.%${query}%,description.ilike.%${query}%`);
  }

  if (city) {
    nativeQuery.ilike("city", `%${city}%`);
  }

  const { data: rawEvents, error: rawEventsError } = await nativeQuery;

  if (rawEventsError) {
    throw new Error(rawEventsError.message);
  }

  const events = (rawEvents || []) as NativeEventRow[];
  if (!events.length) {
    return {
      events: [] as DiscoveryNativeEvent[],
      storageReady: true,
    };
  }

  const eventIds = events.map((event) => event.id);
  const { data: rawControls, error: rawControlsError } = await supabaseAdmin
    .from("discovery_listing_controls")
    .select("event_id, source_type, badge_label, featured, listing_priority, promo_collection, is_discoverable")
    .in("event_id", eventIds);

  const storageReady = !rawControlsError || !isMissingDiscoveryControlsError(rawControlsError);

  if (rawControlsError && !isMissingDiscoveryControlsError(rawControlsError)) {
    throw new Error(rawControlsError.message);
  }

  const controlsByEventId = new Map<string, DiscoveryControlRow>(
    ((rawControls || []) as DiscoveryControlRow[]).map((control) => [control.event_id, control]),
  );

  const mapped = events
    .map((event) => {
      const control = controlsByEventId.get(event.id);
      if (control && !control.is_discoverable) {
        return null;
      }

      const source = inferSourceType(event, control);

      return {
        id: event.id,
        title: event.title,
        slug: event.slug,
        href: `/events/${event.slug}`,
        subtitle: event.subtitle,
        description: event.description,
        city: event.city,
        state: event.state,
        startAt: event.start_at,
        heroNote: event.hero_note,
        source,
        sourceLabel: getSourceLabel(source),
        badgeLabel: control?.badge_label || getDefaultBadgeLabel(source),
        featured: control?.featured || false,
        listingPriority: control?.listing_priority || 0,
        promoCollection: control?.promo_collection || null,
        isPrimary: true as const,
      };
    })
    .filter((event): event is DiscoveryNativeEvent => Boolean(event))
    .sort(sortDiscoveryEvents);

  return {
    events: mapped,
    storageReady,
  };
}

export function groupDiscoveryEventsBySource(events: DiscoveryNativeEvent[]) {
  return {
    evntszn: events.filter((event) => event.source === "evntszn"),
    host: events.filter((event) => event.source === "host"),
    independent_organizer: events.filter((event) => event.source === "independent_organizer"),
  };
}
