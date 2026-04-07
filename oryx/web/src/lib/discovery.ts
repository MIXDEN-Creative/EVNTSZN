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
  banner_image_url: string | null;
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
  imageUrl: string | null;
  source: Exclude<DiscoverySourceType, "ticketmaster">;
  sourceLabel: string;
  badgeLabel: string;
  featured: boolean;
  listingPriority: number;
  promoCollection: string | null;
  isPrimary: true;
};

const DISCOVERY_FALLBACK_IMAGES = {
  evntszn: {
    default:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=80",
    baltimore:
      "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1600&q=80",
    newyork:
      "https://images.unsplash.com/photo-1499092346589-b9b6be3e94b2?auto=format&fit=crop&w=1600&q=80",
    atlanta:
      "https://images.unsplash.com/photo-1577648188599-291bb8b831c3?auto=format&fit=crop&w=1600&q=80",
    miami:
      "https://images.unsplash.com/photo-1535498730771-e735b998cd64?auto=format&fit=crop&w=1600&q=80",
  },
  host: {
    default:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&q=80",
    baltimore:
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1600&q=80",
    newyork:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1600&q=80",
    atlanta:
      "https://images.unsplash.com/photo-1507874457470-272b3c8d8ee2?auto=format&fit=crop&w=1600&q=80",
    miami:
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1600&q=80",
  },
  independent_organizer: {
    default:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80",
    baltimore:
      "https://images.unsplash.com/photo-1521334884684-d80222895322?auto=format&fit=crop&w=1600&q=80",
    newyork:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&q=80",
    atlanta:
      "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1600&q=80",
    miami:
      "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1600&q=80",
  },
} satisfies Record<Exclude<DiscoverySourceType, "ticketmaster">, Record<string, string>>;

type DiscoveryFallbackImageKey = "default" | "baltimore" | "newyork" | "atlanta" | "miami";

const SOURCE_PRIORITY: Record<Exclude<DiscoverySourceType, "ticketmaster">, number> = {
  evntszn: 0,
  host: 1,
  independent_organizer: 2,
};

function isMissingDiscoveryControlsError(error: unknown) {
  const code = typeof error === "object" && error !== null && "code" in error ? String((error as { code?: unknown }).code) : "";
  const status = typeof error === "object" && error !== null && "status" in error ? String((error as { status?: unknown }).status) : "";
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message?: unknown }).message)
      : "";

  return (
    code === "42P01" ||
    code === "PGRST205" ||
    status === "404" ||
    /discovery_listing_controls/i.test(message) ||
    /relation .*discovery_listing_controls/i.test(message) ||
    /schema cache/i.test(message)
  );
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
  startAt?: string;
  endAt?: string;
}) {
  const query = input.query?.trim() || "";
  const city = input.city?.trim() || "";
  const limit = input.limit || 12;

  const nativeQuery = supabaseAdmin
    .from("evntszn_events")
    .select("id, title, slug, subtitle, description, city, state, start_at, hero_note, banner_image_url, organizer_user_id")
    .eq("visibility", "published")
    .order("start_at", { ascending: true })
    .limit(limit);

  if (query) {
    nativeQuery.or(`title.ilike.%${query}%,subtitle.ilike.%${query}%,description.ilike.%${query}%`);
  }

  if (city) {
    nativeQuery.ilike("city", `%${city}%`);
  }

  if (input.startAt) {
    nativeQuery.gte("start_at", input.startAt);
  }

  if (input.endAt) {
    nativeQuery.lte("start_at", input.endAt);
  }

  try {
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
      .map<DiscoveryNativeEvent | null>((event) => {
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
          imageUrl: event.banner_image_url,
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
  } catch (error) {
    if (isMissingDiscoveryControlsError(error)) {
      console.warn("[discovery] listing controls unavailable, using inferred native discovery ordering");

      const { data: rawEvents } = await supabaseAdmin
        .from("evntszn_events")
        .select("id, title, slug, subtitle, description, city, state, start_at, hero_note, banner_image_url, organizer_user_id")
        .eq("visibility", "published")
        .order("start_at", { ascending: true })
        .limit(limit);

      const events = ((rawEvents || []) as NativeEventRow[])
        .map<DiscoveryNativeEvent>((event) => {
          const source = inferSourceType(event, null);

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
            imageUrl: event.banner_image_url,
            source,
            sourceLabel: getSourceLabel(source),
            badgeLabel: getDefaultBadgeLabel(source),
            featured: false,
            listingPriority: 0,
            promoCollection: null,
            isPrimary: true as const,
          };
        })
        .sort(sortDiscoveryEvents);

      return {
        events,
        storageReady: false,
      };
    }

    console.error("[discovery] native discovery load failed", error);
    return {
      events: [] as DiscoveryNativeEvent[],
      storageReady: false,
    };
  }
}

export function groupDiscoveryEventsBySource(events: DiscoveryNativeEvent[]) {
  return {
    evntszn: events.filter((event) => event.source === "evntszn"),
    host: events.filter((event) => event.source === "host"),
    independent_organizer: events.filter((event) => event.source === "independent_organizer"),
  };
}

export function getDiscoveryFallbackImage(
  city: string | null | undefined,
  source: Exclude<DiscoverySourceType, "ticketmaster">,
) {
  const rawKey = city?.toLowerCase().replace(/\s+/g, "") || "default";
  const key: DiscoveryFallbackImageKey =
    rawKey === "baltimore" ||
    rawKey === "newyork" ||
    rawKey === "atlanta" ||
    rawKey === "miami"
      ? rawKey
      : "default";
  const sourceImages = DISCOVERY_FALLBACK_IMAGES[source];
  return sourceImages[key] || sourceImages.default;
}
