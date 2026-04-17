import { isMidnightRunEvent } from "@/lib/events-runtime";
import { supabaseAdmin } from "@/lib/supabase-admin";

export type DiscoverySourceType = "evntszn" | "host" | "independent_organizer";

export type DiscoveryNativeEvent = {
  id: string;
  source: DiscoverySourceType;
  title: string;
  description: string;
  href: string;
  imageUrl: string | null;
  subtitle: string | null;
  startAt: string | null;
  heroNote: string | null;
  sourceLabel: string;
  badgeLabel: string;
  featured: boolean;
  listingPriority: number;
  promoCollection: string | null;
  city: string;
  state: string;
  isPrimary: true;
};

type DiscoveryEventRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  subtitle: string | null;
  hero_note: string | null;
  banner_image_url: string | null;
  start_at: string | null;
  city: string | null;
  state: string | null;
  event_class: string | null;
  visibility: string | null;
  status: string | null;
};

type DiscoveryEventRecord = DiscoveryNativeEvent | null;

const DISCOVERY_FALLBACK_IMAGES = {
  evntszn: {
    default:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=80",
    baltimore:
      "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1600&q=80",
    washington:
      "https://images.unsplash.com/photo-1617581629397-a72507c3de9e?auto=format&fit=crop&w=1600&q=80",
    rehobothbeach:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
    oceancity:
      "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1600&q=80",
    bethanybeach:
      "https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?auto=format&fit=crop&w=1600&q=80",
  },
  host: {
    default:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&q=80",
    baltimore:
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1600&q=80",
    washington:
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1600&q=80",
    rehobothbeach:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=80",
    oceancity:
      "https://images.unsplash.com/photo-1518972559570-7cc1309f3229?auto=format&fit=crop&w=1600&q=80",
    bethanybeach:
      "https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=1600&q=80",
  },
  independent_organizer: {
    default:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80",
    baltimore:
      "https://images.unsplash.com/photo-1521334884684-d80222895322?auto=format&fit=crop&w=1600&q=80",
    washington:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1600&q=80",
    rehobothbeach:
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1600&q=80",
    oceancity:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80",
    bethanybeach:
      "https://images.unsplash.com/photo-1493558103817-58b2924bce98?auto=format&fit=crop&w=1600&q=80",
  },
} satisfies Record<DiscoverySourceType, Record<string, string>>;

const SOURCE_PRIORITY: Record<DiscoverySourceType, number> = {
  evntszn: 0,
  host: 1,
  independent_organizer: 2,
};

function normalizeCityKey(city: string | null | undefined) {
  return String(city || "").toLowerCase().replace(/[^a-z]/g, "") || "default";
}

function normalizeSource(eventClass: string | null | undefined): DiscoverySourceType {
  if (eventClass === "independent_organizer") return "independent_organizer";
  if (eventClass === "host") return "host";
  return "evntszn";
}

function getSourceLabel(source: DiscoverySourceType) {
  switch (source) {
    case "host":
      return "EVNTSZN Curator";
    case "independent_organizer":
      return "Partner";
    default:
      return "Official EVNTSZN";
  }
}

function getBadgeLabel(source: DiscoverySourceType) {
  switch (source) {
    case "host":
      return "Curator";
    case "independent_organizer":
      return "Partner";
    default:
      return "EVNTSZN";
  }
}

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
    /discovery_listing_controls/i.test(message)
  );
}

export function groupDiscoveryEventsBySource(events: DiscoveryNativeEvent[]) {
  return {
    evntszn: events.filter((event) => event.source === "evntszn"),
    host: events.filter((event) => event.source === "host"),
    independent_organizer: events.filter((event) => event.source === "independent_organizer"),
  };
}

export function getDiscoveryFallbackImage(city: string | null | undefined, source: DiscoverySourceType) {
  const cityKey = normalizeCityKey(city);
  const sourceImages = DISCOVERY_FALLBACK_IMAGES[source];
  return sourceImages[cityKey as keyof typeof sourceImages] || sourceImages.default;
}

export async function getDiscoveryNativeEvents(input: {
  city?: string | null;
  query?: string | null;
  limit?: number | null;
  startAt?: string | undefined;
  endAt?: string | undefined;
}) {
  const limit = Math.min(Math.max(Number(input.limit || 12), 1), 50);
  const effectiveStartAt = input.startAt || new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

  let query = supabaseAdmin
    .from("evntszn_events")
    .select(
      "id, slug, title, description, subtitle, hero_note, banner_image_url, start_at, city, state, event_class, visibility, status",
    )
    .in("visibility", ["published", "public"])
    .in("status", ["published", "live", "scheduled"])
    .order("start_at", { ascending: true })
    .limit(limit * 3);

  if (input.city) {
    query = query.ilike("city", input.city);
  }
  if (input.query) {
    const safeQuery = input.query.replace(/[,%]/g, " ").trim();
    if (safeQuery) {
      query = query.or(
        `title.ilike.%${safeQuery}%,subtitle.ilike.%${safeQuery}%,description.ilike.%${safeQuery}%,hero_note.ilike.%${safeQuery}%`,
      );
    }
  }
  query = query.gte("start_at", effectiveStartAt);
  if (input.endAt) {
    query = query.lte("start_at", input.endAt);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  let controlsById = new Map<
    string,
    {
      badge_label: string | null;
      featured: boolean | null;
      listing_priority: number | null;
      promo_collection: string | null;
      is_discoverable: boolean | null;
      source_type: string | null;
    }
  >();

  try {
    const eventIds = (data || []).map((row) => row.id);
    if (eventIds.length) {
      const controlsRes = await supabaseAdmin
        .from("discovery_listing_controls")
        .select("event_id, source_type, badge_label, featured, listing_priority, promo_collection, is_discoverable")
        .in("event_id", eventIds);
      if (controlsRes.error) {
        throw controlsRes.error;
      }
      controlsById = new Map(
        (controlsRes.data || []).map((row) => [
          row.event_id,
          {
            badge_label: row.badge_label,
            featured: row.featured,
            listing_priority: row.listing_priority,
            promo_collection: row.promo_collection,
            is_discoverable: row.is_discoverable,
            source_type: row.source_type,
          },
        ]),
      );
    }
  } catch (error) {
    if (!isMissingDiscoveryControlsError(error)) {
      throw error;
    }
  }

  const mappedEvents: DiscoveryEventRecord[] = ((data || []) as DiscoveryEventRow[])
    .filter((row) => !isMidnightRunEvent(row))
    .map((row) => {
      const controls = controlsById.get(row.id);
      if (controls?.is_discoverable === false) return null;
      const source = normalizeSource(controls?.source_type || row.event_class);
      const listingPriority = Number(controls?.listing_priority ?? SOURCE_PRIORITY[source]);
      return {
        id: row.id,
        source,
        title: row.title,
        description: row.description || "",
        href: `/events/${row.slug}`,
        imageUrl: row.banner_image_url || getDiscoveryFallbackImage(row.city, source),
        subtitle: row.subtitle,
        startAt: row.start_at,
        heroNote: row.hero_note,
        sourceLabel: getSourceLabel(source),
        badgeLabel: controls?.badge_label || getBadgeLabel(source),
        featured: Boolean(controls?.featured),
        listingPriority,
        promoCollection: controls?.promo_collection || null,
        city: row.city || "",
        state: row.state || "",
        isPrimary: true as const,
      };
    });

  const events = mappedEvents
    .filter((event): event is DiscoveryNativeEvent => event !== null)
    .sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      if (a.listingPriority !== b.listingPriority) return a.listingPriority - b.listingPriority;
      return (a.startAt || "").localeCompare(b.startAt || "");
    })
    .slice(0, limit);

  return {
    events,
    storageReady: true,
  };
}
