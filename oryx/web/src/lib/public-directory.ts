import { isMidnightRunEvent } from "@/lib/events-runtime";
import { getPublicCityByName, getPublicCityBySlug, type PublicCity } from "@/lib/public-cities";
import { deriveReserveSettingsFromPlan, normalizeReserveSettings } from "@/lib/reserve";
import { supabaseAdmin } from "@/lib/supabase-admin";

const EVENT_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=80";

type EventRow = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  hero_note: string | null;
  city: string | null;
  state: string | null;
  start_at: string | null;
  end_at: string | null;
  banner_image_url: string | null;
  event_class: string | null;
  event_vertical: string | null;
  visibility: string | null;
  status: string | null;
  evntszn_venues:
    | { slug?: string | null; name?: string | null; city?: string | null; state?: string | null; timezone?: string | null }
    | Array<{ slug?: string | null; name?: string | null; city?: string | null; state?: string | null; timezone?: string | null }>
    | null;
};

type VenueRow = {
  id: string;
  slug: string;
  name: string;
  city: string;
  state: string;
  timezone: string;
  capacity: number | null;
  contact_email: string | null;
  contact_phone: string | null;
  plan_key?: string | null;
  smart_fill_add_on_active?: boolean | null;
  link_plan_override?: string | null;
  plan_status?: string | null;
};

type ReserveVenueRow = {
  id: string;
  venue_id: string;
  is_active: boolean;
  plan_key?: string | null;
  subscription_status?: string | null;
  capacity_snapshot?: number | null;
  settings: Record<string, unknown> | null;
  evntszn_venues:
    | VenueRow
    | VenueRow[]
    | null;
};

export type PublicEventListing = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string;
  city: string;
  state: string;
  startAt: string | null;
  endAt: string | null;
  imageUrl: string;
  eventClass: string | null;
  eventVertical: string | null;
  venueName: string;
  venueSlug: string | null;
  timezone: string | null;
};

export type PublicVenueListing = {
  id: string;
  slug: string;
  name: string;
  city: string;
  state: string;
  timezone: string;
  capacity: number | null;
  contactEmail: string | null;
  contactPhone: string | null;
  imageUrl: string;
  isReserveActive: boolean;
  reserveVenueId: string | null;
  reserveSettings: ReturnType<typeof normalizeReserveSettings> | null;
  cityProfile: PublicCity | null;
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] || null : value;
}

function normalizeEventDescription(row: EventRow) {
  return (
    row.description ||
    row.subtitle ||
    row.hero_note ||
    "EVNTSZN tracks the event, the room, and the city demand so the plan is clear before you leave home."
  );
}

function normalizeEventRow(row: EventRow): PublicEventListing | null {
  if (isMidnightRunEvent(row)) return null;
  const venue = firstRelation(row.evntszn_venues);
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    description: normalizeEventDescription(row),
    city: row.city || venue?.city || "",
    state: row.state || venue?.state || "",
    startAt: row.start_at,
    endAt: row.end_at,
    imageUrl: row.banner_image_url || EVENT_FALLBACK_IMAGE,
    eventClass: row.event_class,
    eventVertical: row.event_vertical,
    venueName: venue?.name || "EVNTSZN venue",
    venueSlug: venue?.slug || null,
    timezone: venue?.timezone || null,
  };
}

function nightlifeScore(event: PublicEventListing) {
  const haystack = [
    event.title,
    event.subtitle || "",
    event.description || "",
    event.eventClass || "",
    event.eventVertical || "",
  ]
    .join(" ")
    .toLowerCase();
  const keywords = ["nightlife", "party", "after", "brunch", "lounge", "rooftop", "dj", "dance", "late", "cocktail"];
  return keywords.reduce((score, keyword) => score + (haystack.includes(keyword) ? 1 : 0), 0);
}

export async function getAllPublishedEvents(limit = 120) {
  const { data, error } = await supabaseAdmin
    .from("evntszn_events")
    .select(`
      id,
      slug,
      title,
      subtitle,
      description,
      hero_note,
      city,
      state,
      start_at,
      end_at,
      banner_image_url,
      event_class,
      event_vertical,
      visibility,
      status,
      evntszn_venues (
        slug,
        name,
        city,
        state,
        timezone
      )
    `)
    .eq("visibility", "published")
    .in("status", ["published", "live", "scheduled"])
    .gte("start_at", new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())
    .order("start_at", { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);

  return ((data || []) as EventRow[])
    .map(normalizeEventRow)
    .filter((value): value is PublicEventListing => Boolean(value));
}

export async function getPublishedEventsByCity(citySlug: string, limit = 24) {
  const city = getPublicCityBySlug(citySlug);
  if (!city) return [];

  const events = await getAllPublishedEvents(160);
  return events.filter((event) => event.city.toLowerCase() === city.name.toLowerCase()).slice(0, limit);
}

export async function getNightlifeEventsByCity(citySlug: string, limit = 16) {
  const cityEvents = await getPublishedEventsByCity(citySlug, 40);
  const scored = cityEvents
    .map((event) => ({ event, score: nightlifeScore(event) }))
    .sort((a, b) => b.score - a.score || (a.event.startAt || "").localeCompare(b.event.startAt || ""));
  const filtered = scored.filter((item) => item.score > 0).map((item) => item.event);
  return (filtered.length ? filtered : cityEvents).slice(0, limit);
}

export async function getRelatedEvents(input: { city: string; excludeSlug?: string | null; limit?: number }) {
  const city = getPublicCityByName(input.city);
  if (!city) return [];
  const events = await getPublishedEventsByCity(city.slug, Math.max((input.limit || 6) + 4, 10));
  return events.filter((event) => event.slug !== input.excludeSlug).slice(0, input.limit || 6);
}

export async function getReserveVenueListings(limit = 80) {
  try {
    const { data, error } = await supabaseAdmin
      .from("evntszn_reserve_venues")
      .select(`
        id,
        venue_id,
        is_active,
        plan_key,
        subscription_status,
        capacity_snapshot,
        settings,
        evntszn_venues!inner(
          id,
          slug,
          name,
          city,
          state,
          timezone,
          capacity,
          contact_email,
          contact_phone,
          plan_key,
          smart_fill_add_on_active,
          link_plan_override,
          plan_status
        )
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);

    const rows = (data || []) as ReserveVenueRow[];
    return rows.map((row) => {
      const venue = firstRelation(row.evntszn_venues);
      const cityProfile = getPublicCityByName(venue?.city || null);
      return {
        id: venue?.id || row.venue_id,
        slug: venue?.slug || "",
        name: venue?.name || "EVNTSZN venue",
        city: venue?.city || "",
        state: venue?.state || "",
        timezone: venue?.timezone || "America/New_York",
        capacity: venue?.capacity || null,
        contactEmail: venue?.contact_email || null,
        contactPhone: venue?.contact_phone || null,
        imageUrl: EVENT_FALLBACK_IMAGE,
        isReserveActive: row.is_active,
        reserveVenueId: row.id,
        reserveSettings: deriveReserveSettingsFromPlan({
          settings: (row.settings || {}) as Record<string, unknown>,
          venuePlanKey: venue?.plan_key,
          reservePlanKey: row.plan_key,
          capacity: venue?.capacity || row.capacity_snapshot || null,
          smartFillAddOnActive: Boolean(venue?.smart_fill_add_on_active),
          linkPlanOverride: venue?.link_plan_override,
        }),
        cityProfile,
      } satisfies PublicVenueListing;
    });
  } catch {
    return [];
  }
}

export async function getReserveVenuesByCity(citySlug: string, limit = 24) {
  const city = getPublicCityBySlug(citySlug);
  if (!city) return [];

  const venues = await getReserveVenueListings(120);
  return venues.filter((venue) => venue.city.toLowerCase() === city.name.toLowerCase() && venue.isReserveActive).slice(0, limit);
}

export async function getVenueListingsByCity(citySlug: string, limit = 24) {
  const city = getPublicCityBySlug(citySlug);
  if (!city) return [];

  const [reserveVenuesRes, events] = await Promise.all([
    getReserveVenueListings(120),
    getPublishedEventsByCity(citySlug, 60),
  ]);

  const venueMap = new Map<string, PublicVenueListing>();

  for (const venue of reserveVenuesRes) {
    if (venue.city.toLowerCase() !== city.name.toLowerCase()) continue;
    venueMap.set(venue.slug, venue);
  }

  for (const event of events) {
    const cityProfile = getPublicCityByName(event.city);
    if (event.venueSlug && !venueMap.has(event.venueSlug)) {
      venueMap.set(event.venueSlug, {
        id: event.venueSlug,
        slug: event.venueSlug,
        name: event.venueName,
        city: event.city,
        state: event.state,
        timezone: event.timezone || "America/New_York",
        capacity: null,
        contactEmail: null,
        contactPhone: null,
        imageUrl: event.imageUrl,
        isReserveActive: false,
        reserveVenueId: null,
        reserveSettings: null,
        cityProfile,
      });
    }
  }

  return [...venueMap.values()].slice(0, limit);
}

export async function getReserveVenueBySlugOrCity(slug: string) {
  const [reserveVenues, city] = await Promise.all([
    getReserveVenueListings(120),
    Promise.resolve(getPublicCityBySlug(slug)),
  ]);

  return {
    reserveVenue: reserveVenues.find((venue) => venue.slug === slug) || null,
    city,
  };
}
