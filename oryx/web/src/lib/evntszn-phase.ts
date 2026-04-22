import { formatUsd } from "@/lib/money";
import { getVenueCommerceState } from "@/lib/evntszn-monetization";
import { slugify } from "@/lib/platform-products";
import { getAllPublishedEvents, getReserveVenueListings } from "@/lib/public-directory";
import { getPulseStateSnapshot, getPulseStatesByCity } from "@/lib/pulse-signal";
import { isSupabaseCredentialError } from "@/lib/runtime-env";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { supabasePublicServer } from "@/lib/supabase-public-server";
import {
  type CrewMemberSummary,
  type ReserveVenueSummary,
  type VenueSupplySummary,
  type ZoneState,
} from "@/lib/evntszn-phase-shared";

export const EVNTSZN_CITIES = [
  { slug: "baltimore", name: "Baltimore", state: "MD", label: "Harbor circuit" },
  { slug: "dc", name: "DC", state: "DC", label: "Capital social" },
  { slug: "ocean-city", name: "Ocean City", state: "MD", label: "Boardwalk flow" },
  { slug: "rehoboth", name: "Rehoboth", state: "DE", label: "Beach demand" },
  { slug: "bethany", name: "Bethany", state: "DE", label: "Coastal dinner" },
  { slug: "dewey", name: "Dewey", state: "DE", label: "Late-night coast" },
  { slug: "fenwick", name: "Fenwick", state: "DE", label: "Quiet surge" },
] as const;

export type FeedItem = {
  id: string;
  type: "event" | "reserve" | "activity";
  title: string;
  subtitle: string;
  city: string;
  statusLabel: string;
  href: string;
  timingLabel?: string;
};

export type ZoneRow = {
  id: string;
  city: string;
  label: string;
  state: ZoneState;
  pulse: number;
  nowLabel: string;
  detail: string;
  tonightLabel?: string;
  momentumLabel?: string;
};

export type TonightCard = {
  id: string;
  city: string;
  title: string;
  detail: string;
  actionLabel: string;
  href: string;
  state: ZoneState;
  timing: string;
};

export type EplHook = {
  id: string;
  title: string;
  detail: string;
  href: string;
};

const MOCK_FEED: FeedItem[] = [
  {
    id: "mock-tonight-baltimore",
    type: "activity",
    title: "Fed Hill is heating up for tonight",
    subtitle: "Dinner traffic is turning into table demand and late-night movement.",
    city: "Baltimore",
    statusLabel: "Tonight",
    href: "/map",
  },
  {
    id: "mock-reserve-dc",
    type: "reserve",
    title: "Reserve opens up in DC from 8:30 PM",
    subtitle: "Limited availability is driving waitlist behavior near the core social lane.",
    city: "DC",
    statusLabel: "Limited availability",
    href: "/reserve",
  },
  {
    id: "mock-event-ocean-city",
    type: "event",
    title: "Ocean City after-dark traffic is rising",
    subtitle: "Boardwalk movement and bar activity are pushing the zone into active state.",
    city: "Ocean City",
    statusLabel: "Rising",
    href: "/map",
  },
];

const MOCK_ZONES: ZoneRow[] = [
  { id: "zone-baltimore", city: "Baltimore", label: "Harbor East to Fed Hill", state: "hot", pulse: 92, nowLabel: "Bottle-service demand + late dining", detail: "Reserve and nightlife traffic are stacking into one zone." },
  { id: "zone-dc", city: "DC", label: "U Street social corridor", state: "rising", pulse: 79, nowLabel: "Guest flow building for 9 PM", detail: "Good event crossover and strong table-search intent." },
  { id: "zone-ocean-city", city: "Ocean City", label: "Boardwalk bars", state: "active", pulse: 71, nowLabel: "Steady nightlife traffic", detail: "Visitor demand is live without being maxed out." },
  { id: "zone-rehoboth", city: "Rehoboth", label: "Main strip", state: "active", pulse: 66, nowLabel: "Dinner and rooftop crossover", detail: "Search and walk-up intent are landing together." },
  { id: "zone-bethany", city: "Bethany", label: "Coastal dinner lane", state: "low", pulse: 42, nowLabel: "Early reservations", detail: "Good for calm dinner inventory and lower-friction booking." },
  { id: "zone-dewey", city: "Dewey", label: "Late-night run", state: "rising", pulse: 75, nowLabel: "Bars moving into second wave", detail: "Short-notice crew and table demand can convert quickly." },
  { id: "zone-fenwick", city: "Fenwick", label: "Quiet coast edge", state: "low", pulse: 38, nowLabel: "Low pressure", detail: "Still usable as a soft-demand zone that feels alive." },
];

const MOCK_RESERVE_VENUES: ReserveVenueSummary[] = [
  {
    id: "mock-reserve-1",
    reserveVenueId: null,
    slug: "harbor-house-social",
    name: "Harbor House Social",
    city: "Baltimore",
    state: "MD",
    reservationFeeUsd: 25,
    maxPartySize: 8,
    waitlistEnabled: true,
    urgency: "Limited availability after 9:00 PM",
    slots: ["6:30 PM", "7:15 PM", "8:30 PM", "9:45 PM"],
  },
  {
    id: "mock-reserve-2",
    reserveVenueId: null,
    slug: "district-room",
    name: "District Room",
    city: "DC",
    state: "DC",
    reservationFeeUsd: 35,
    maxPartySize: 10,
    waitlistEnabled: true,
    urgency: "Fastest bookings are the next 2 slots",
    slots: ["7:00 PM", "8:00 PM", "9:00 PM", "10:00 PM"],
  },
  {
    id: "mock-reserve-3",
    reserveVenueId: null,
    slug: "salt-air-club",
    name: "Salt Air Club",
    city: "Rehoboth",
    state: "DE",
    reservationFeeUsd: 20,
    maxPartySize: 6,
    waitlistEnabled: false,
    urgency: "Tonight is filling earlier than usual",
    slots: ["5:30 PM", "6:45 PM", "8:15 PM"],
  },
];

const MOCK_CREW: CrewMemberSummary[] = [
  { id: "crew-1", slug: "aria-set", name: "Aria Set", category: "DJ", city: "Baltimore", state: "MD", priceFromUsd: 450, headline: "Open-format club sets with fast room reads.", partnerTier: "standard" },
  { id: "crew-2", slug: "pour-order", name: "Pour Order", category: "Bartender", city: "DC", state: "DC", priceFromUsd: 320, headline: "High-volume bar coverage for premium nights.", partnerTier: "partner" },
  { id: "crew-3", slug: "frame-by-noir", name: "Frame by Noir", category: "Photographer", city: "Ocean City", state: "MD", priceFromUsd: 375, headline: "Nightlife coverage tuned for socials and recap assets.", partnerTier: "pro_partner" },
  { id: "crew-4", slug: "signal-motion", name: "Signal Motion", category: "Videographer", city: "Rehoboth", state: "DE", priceFromUsd: 700, headline: "Fast-turn reels and nightlife recap edits.", partnerTier: "standard" },
  { id: "crew-5", slug: "host-lane", name: "Host Lane", category: "Curator", city: "Bethany", state: "DE", priceFromUsd: 250, headline: "Guest-facing curation and room guidance.", partnerTier: "standard" },
];

const EPL_CITY_SCHEDULE = {
  baltimore: [
    { home: "Canton Chargers", away: "Fells Point Raiders", when: "Friday 7:00 PM" },
    { home: "Federal Hill Sentinels", away: "Harbor Titans", when: "Friday 8:30 PM" },
  ],
  "ocean-city": [
    { home: "Ocean City Comets", away: "Fenwick Phantoms", when: "Saturday 6:30 PM" },
  ],
  rehoboth: [
    { home: "Rehoboth Knights", away: "Dewey Warriors", when: "Saturday 8:00 PM" },
  ],
  bethany: [
    { home: "Bethany Bulldogs", away: "Rehoboth Knights", when: "Sunday 5:30 PM" },
  ],
  dewey: [
    { home: "Dewey Warriors", away: "Ocean City Comets", when: "Sunday 7:00 PM" },
  ],
  fenwick: [
    { home: "Fenwick Phantoms", away: "Bethany Bulldogs", when: "Sunday 8:15 PM" },
  ],
  dc: [
    { home: "DC City Captains", away: "Baltimore Select", when: "Thursday 7:30 PM" },
  ],
} as const;

type CrewProfileRow = {
  id: string;
  slug: string;
  display_name: string;
  category: string;
  custom_category: string | null;
  city: string | null;
  state: string | null;
  rate_amount_usd: number | null;
  headline: string | null;
  metadata: { partnerTier?: string } | null;
};

type VenuePhaseRow = {
  id: string;
  slug: string;
  name: string;
  city: string;
  state: string;
  capacity?: number | null;
  plan_key?: string | null;
  smart_fill_add_on_active?: boolean | null;
  link_plan_override?: string | null;
  metadata: {
    smartFillEnabled?: boolean;
    smartFillPriceNote?: string;
    linkSlug?: string;
  } | null;
};

type ReserveVenueLinkRow = {
  id: string;
  evntszn_venues:
    | { slug?: string | null; name?: string | null }
    | Array<{ slug?: string | null; name?: string | null }>
    | null;
};

type EplTeamRow = {
  id: string;
  slug: string;
  team_name: string;
  team_code: string | null;
  captain_name: string | null;
};

type NodeLookupRow = {
  id: string;
  slug: string | null;
  public_title?: string | null;
  internal_name?: string | null;
  public_identifier: string | null;
  short_code: string | null;
  city?: string | null;
  state?: string | null;
  area_label?: string | null;
  location_type?: string | null;
  destination_type: string;
  destination_payload: { href?: string } | null;
  venue_id: string | null;
  link_page_id: string | null;
  event_id: string | null;
};

export function formatReservationSlotLabel(slot: string) {
  return slot.includes(":") ? slot : slot;
}

export function buildUniqueSlug(input: string, salt?: string) {
  const base = slugify(input) || "evntszn";
  return salt ? `${base}-${salt}`.slice(0, 72) : base;
}

export async function getDiscoverFeed() {
  const [events, reserveVenues] = await Promise.all([
    getAllPublishedEvents(10).catch(() => []),
    getReserveVenueListings(8).catch(() => []),
  ]);

  const liveFeed: FeedItem[] = [
    ...events.slice(0, 6).map((event) => ({
      id: event.id,
      type: "event" as const,
      title: event.title,
      subtitle: event.subtitle || event.description,
      city: event.city,
      statusLabel: "Live event",
      href: `/events/${event.slug}`,
      timingLabel: buildTimingSignal(event.startAt),
    })),
    ...reserveVenues.slice(0, 4).map((venue) => ({
      id: venue.id,
      type: "reserve" as const,
      title: `${venue.name} has tables open tonight`,
      subtitle: `${venue.city}, ${venue.state} · ${formatUsd(venue.reserveSettings?.reservation_fee_usd || 0)} hold fee`,
      city: venue.city,
      statusLabel: venue.reserveSettings?.waitlist_enabled === false ? "Direct booking" : "Waitlist available",
      href: `/reserve/${venue.slug}`,
      timingLabel: venue.reserveSettings?.waitlist_enabled === false ? "Best move now" : "Filling up later",
    })),
  ];

  return {
    feed: liveFeed.length ? liveFeed : MOCK_FEED,
    zones: await getMapZones(),
    tonight: await getTonightCards(),
    eplHooks: await getEplHooks(),
  };
}

export async function getMapZones(): Promise<ZoneRow[]> {
  const [events, reserveVenues] = await Promise.all([
    getAllPublishedEvents(40).catch(() => []),
    getReserveVenueListings(30).catch(() => []),
  ]);
  const pulseStates = await getPulseStatesByCity(EVNTSZN_CITIES.map((city) => city.name));

  if (!events.length && !reserveVenues.length) {
    return MOCK_ZONES;
  }

  return EVNTSZN_CITIES.map((city, index) => {
    const cityEvents = events.filter((event) => event.city.toLowerCase() === city.name.toLowerCase());
    const cityReserve = reserveVenues.filter((venue) => venue.city.toLowerCase() === city.name.toLowerCase());
    const storedPulse = pulseStates.get(city.name.toLowerCase());
    const pulse = storedPulse?.score || Math.min(96, 34 + cityEvents.length * 12 + cityReserve.length * 9 + (index % 3) * 4);
    const state: ZoneState = storedPulse?.state || (pulse >= 85 ? "hot" : pulse >= 72 ? "rising" : pulse >= 55 ? "active" : "low");
    return {
      id: city.slug,
      city: city.name,
      label: city.label,
      state,
      pulse,
      nowLabel: `${cityEvents.length} live event${cityEvents.length === 1 ? "" : "s"} · ${cityReserve.length} reserve lane${cityReserve.length === 1 ? "" : "s"}`,
      detail: "Zones use blended event, venue, and reservation pressure instead of dead pins.",
      tonightLabel:
        state === "hot"
          ? "Best move now"
          : state === "rising"
            ? "Getting busy after 10"
            : state === "active"
              ? "Solid tonight option"
              : "Late swing option",
      momentumLabel:
        state === "hot"
          ? "Momentum is already in the room."
          : state === "rising"
            ? "Traffic is still stacking."
            : state === "active"
              ? "Enough movement to plan around."
              : "Watch for a second wave.",
    };
  });
}

export async function getTonightCards(): Promise<TonightCard[]> {
  const [zones, events, reserveVenues] = await Promise.all([
    getMapZones(),
    getAllPublishedEvents(8).catch(() => []),
    getReserveVenuesForPhase(),
  ]);

  const cards = zones.slice(0, 4).map((zone, index) => {
    const event = events.find((entry) => entry.city.toLowerCase() === zone.city.toLowerCase());
    const reserve = reserveVenues.find((entry) => entry.city.toLowerCase() === zone.city.toLowerCase());
    return {
      id: `tonight-${zone.id}`,
      city: zone.city,
      title:
        zone.state === "hot"
          ? `${zone.city} is the best move now`
          : zone.state === "rising"
            ? `${zone.city} gets better later`
            : `${zone.city} is still in play tonight`,
      detail:
        event?.title
          ? `${event.title} is feeding momentum. ${reserve ? `${reserve.name} is ${reserve.urgency.toLowerCase()}.` : zone.detail}`
          : reserve
            ? `${reserve.name} is ${reserve.urgency.toLowerCase()}. ${zone.detail}`
            : zone.detail,
      actionLabel: index === 0 ? "Join tonight" : reserve ? "Reserve now" : "Watch this zone",
      href: reserve ? `/reserve/${reserve.slug}` : event ? `/events/${event.slug}` : "/map",
      state: zone.state,
      timing: zone.tonightLabel || "Tonight",
    };
  });
  return cards;
}

export async function getEplHooks(): Promise<EplHook[]> {
  const snapshot = await getEplCitySnapshot("baltimore").catch(() => null);
  const hooks: EplHook[] = [
    {
      id: "epl-games-week",
      title: "Games this week",
      detail: "Keep EPL inside the nightly planning loop, not in a separate lane.",
      href: "/epl/schedule",
    },
    {
      id: "epl-teams-forming",
      title: "Teams are still forming",
      detail: "Roster movement is still live across the city pages.",
      href: "/epl/teams",
    },
    {
      id: "epl-registration",
      title: "Registration closes soon",
      detail: "The return habit strengthens when the season feels like it is moving.",
      href: "/epl",
    },
  ];
  if (snapshot?.city) {
    hooks.unshift({
      id: "epl-city-spotlight",
      title: `${snapshot.city.name} spotlight`,
      detail: `${snapshot.schedule.length} live league moment${snapshot.schedule.length === 1 ? "" : "s"} worth checking back for.`,
      href: `/epl/${snapshot.city.slug}`,
    });
  }
  return hooks;
}

export async function getReserveVenuesForPhase(): Promise<ReserveVenueSummary[]> {
  const venues = await getReserveVenueListings(12).catch(() => []);
  if (!venues.length) {
    return MOCK_RESERVE_VENUES;
  }

  return Promise.all(
    venues.map(async (venue) => {
      const pulse = await getPulseStateSnapshot(venue.city);
      return {
        id: venue.id,
        reserveVenueId: venue.reserveVenueId,
        slug: venue.slug,
        name: venue.name,
        city: venue.city,
        state: venue.state,
        reservationFeeUsd: Number(venue.reserveSettings?.reservation_fee_usd || 0),
        maxPartySize: Number(venue.reserveSettings?.max_party_size || 8),
        waitlistEnabled: venue.reserveSettings?.waitlist_enabled !== false,
        urgency: getReserveUrgencyLabel({
          slotCount: buildMockTimesForCity(venue.city).length,
          reservationFeeUsd: Number(venue.reserveSettings?.reservation_fee_usd || 0),
          waitlistEnabled: venue.reserveSettings?.waitlist_enabled !== false,
          isLateWindow: pulse?.state === "hot" || pulse?.state === "rising",
        }).label,
        slots: buildMockTimesForCity(venue.city),
      };
    }),
  );
}

function buildMockTimesForCity(city: string) {
  if (city.toLowerCase().includes("bethany")) return ["5:30 PM", "6:30 PM", "7:45 PM"];
  if (city.toLowerCase().includes("rehoboth")) return ["6:00 PM", "7:15 PM", "8:45 PM"];
  return ["6:30 PM", "7:30 PM", "8:30 PM", "9:45 PM"];
}

export function getReserveUrgencyLabel(input: {
  slotCount: number;
  reservationFeeUsd?: number;
  waitlistEnabled?: boolean;
  isLateWindow?: boolean;
}) {
  const slotCount = Number(input.slotCount || 0);
  if (slotCount <= 1) {
    return { label: input.waitlistEnabled ? "Last few slots · waitlist available" : "Last few slots", tone: "critical" as const };
  }
  if (slotCount <= 2) {
    return { label: "Almost full", tone: "high" as const };
  }
  if (slotCount <= 4 || input.isLateWindow) {
    return { label: "Filling fast", tone: "medium" as const };
  }
  if (Number(input.reservationFeeUsd || 0) > 0) {
    return { label: "High demand", tone: "medium" as const };
  }
  return { label: input.waitlistEnabled ? "Waitlist available" : "Open bookings", tone: "low" as const };
}

function buildTimingSignal(startAt: string | null) {
  if (!startAt) return "Tonight";
  const deltaHours = (new Date(startAt).getTime() - Date.now()) / (1000 * 60 * 60);
  if (deltaHours <= 1) return "Best move now";
  if (deltaHours <= 3) return "Building tonight";
  if (deltaHours <= 5) return "Gets busy later";
  return "Late-night option";
}

export async function getCrewMembersForPhase(): Promise<CrewMemberSummary[]> {
  const runQuery = async (client: typeof supabaseAdmin) =>
    client
      .from("evntszn_crew_profiles")
      .select("id, slug, display_name, category, custom_category, city, state, rate_amount_usd, headline, metadata")
      .eq("status", "published")
      .limit(16);

  let { data, error } = await runQuery(supabaseAdmin);
  if (error && isSupabaseCredentialError(error)) {
    const fallback = await runQuery(supabasePublicServer);
    data = fallback.data;
    error = fallback.error;
  }

  if (error || !data?.length) {
    return MOCK_CREW;
  }

  return (data as CrewProfileRow[]).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.display_name,
    category: row.custom_category || row.category,
    city: row.city || "Remote",
    state: row.state || "US",
    priceFromUsd: Number(row.rate_amount_usd || 0) || 250,
    headline: row.headline || "Bookable through EVNTSZN Crew.",
    partnerTier:
      row.metadata?.partnerTier === "pro_partner"
        ? "pro_partner"
        : row.metadata?.partnerTier === "partner"
          ? "partner"
          : "standard",
  }));
}

export async function getVenueSupplyForPhase(): Promise<VenueSupplySummary[]> {
  const runQuery = async (client: typeof supabaseAdmin) =>
    client
      .from("evntszn_venues")
      .select("id, slug, name, city, state, capacity, plan_key, smart_fill_add_on_active, link_plan_override, metadata")
      .order("created_at", { ascending: false })
      .limit(12);

  let { data, error } = await runQuery(supabaseAdmin);
  if (error && isSupabaseCredentialError(error)) {
    const fallback = await runQuery(supabasePublicServer);
    data = fallback.data;
    error = fallback.error;
  }

  if (error || !data?.length) {
    return MOCK_RESERVE_VENUES.map((venue) => ({
      id: venue.id,
      slug: venue.slug,
      name: venue.name,
      city: venue.city,
      state: venue.state,
      smartFillEnabled: true,
      smartFillPriceNote: "$29/month add-on",
      linkSlug: venue.slug,
    }));
  }

  return (data as VenuePhaseRow[]).map((row) => {
    const commerce = getVenueCommerceState({
      venuePlanKey: row.plan_key,
      capacity: row.capacity || null,
      smartFillAddOnActive: Boolean(row.smart_fill_add_on_active),
      linkPlanOverride: row.link_plan_override,
    });
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      city: row.city,
      state: row.state,
      capacity: row.capacity || null,
      planKey: row.plan_key || "venue_free",
      monthlyPriceUsd: commerce.venueMonthlyPriceUsd,
      reserveMonthlyPriceUsd: commerce.reserveMonthlyPriceUsd,
      reserveEnabled: commerce.reserveEnabled,
      smartFillEnabled: commerce.smartFillEnabled,
      smartFillPriceNote:
        row.metadata?.smartFillPriceNote ||
        (commerce.smartFillEnabled
          ? commerce.venuePlanKey === "venue_free"
            ? "Smart Fill add-on active"
            : "Smart Fill included"
          : "$29/month add-on"),
      linkSlug: row.metadata?.linkSlug || null,
    };
  });
}

export async function getVenueDashboardSnapshot() {
  const [venues, reserveVenues, events] = await Promise.all([
    getVenueSupplyForPhase(),
    getReserveVenuesForPhase(),
    getAllPublishedEvents(12).catch(() => []),
  ]);

  return {
    venues,
    reserveVenues,
    events: events.slice(0, 10),
  };
}

export async function getLinkProfileSnapshot(slug: string) {
  const { data: page } = await supabaseAdmin
    .from("evntszn_link_pages")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!page) return null;

  const [socialLinksRes, eventLinksRes, reserveRes] = await Promise.all([
    supabaseAdmin
      .from("evntszn_link_social_links")
      .select("id, label, url, platform")
      .eq("link_page_id", page.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabaseAdmin
      .from("evntszn_events")
      .select("id, title, slug, start_at, city, state, subtitle")
      .eq("organizer_user_id", page.user_id)
      .eq("visibility", "published")
      .gte("start_at", new Date().toISOString())
      .order("start_at", { ascending: true })
      .limit(5),
    supabaseAdmin
      .from("evntszn_reserve_venues")
      .select("id, evntszn_venues!inner(slug, name, owner_user_id)")
      .eq("evntszn_venues.owner_user_id", page.user_id)
      .eq("is_active", true),
  ]);

  return {
    page,
    socialLinks: socialLinksRes.data || [],
    upcomingEvents: eventLinksRes.data || [],
    reserveLinks:
      ((reserveRes.data || []) as ReserveVenueLinkRow[]).map((row) => {
        const venue = Array.isArray(row.evntszn_venues) ? row.evntszn_venues[0] : row.evntszn_venues;
        return {
          id: row.id,
          href: `/reserve/${venue?.slug}`,
          label: venue?.name || "Reserve",
        };
      }) || [],
  };
}

export async function getEplCitySnapshot(citySlug: string) {
  const city = EVNTSZN_CITIES.find((entry) => entry.slug === citySlug);
  if (!city) return null;

  const { data: teams } = await supabaseAdmin
    .schema("epl")
    .from("teams")
    .select("id, slug, team_name, team_code, captain_name")
    .eq("is_active", true)
    .limit(24);

  const { data: registrations } = await supabaseAdmin
    .schema("epl")
    .from("player_applications")
    .select("id, first_name, last_name, city, state, position_primary, created_at")
    .ilike("city", `%${city.name}%`)
    .order("created_at", { ascending: false })
    .limit(12);

  const schedule = EPL_CITY_SCHEDULE[citySlug as keyof typeof EPL_CITY_SCHEDULE] || [];
  return {
    city,
    teams: teams || [],
    registrations: registrations || [],
    schedule,
    standings: ((teams || []) as EplTeamRow[]).slice(0, 5).map((team, index: number) => ({
      id: team.id,
      name: team.team_name,
      record: `${4 - index}-${Math.max(0, index - 1)}`,
      pointsFor: 82 - index * 6,
      pointsAgainst: 64 - index * 4,
    })),
  };
}

export async function resolveNodeDestination(id: string) {
  const value = id.trim();
  const baseQuery = supabaseAdmin
    .from("evntszn_nodes")
    .select("id, slug, public_title, internal_name, public_identifier, short_code, city, state, area_label, location_type, destination_type, destination_payload, venue_id, link_page_id, event_id")
    .eq("status", "active")
    .limit(1);

  const attempts = [
    await baseQuery.eq("id", value).maybeSingle(),
    await baseQuery.eq("slug", value).maybeSingle(),
    await baseQuery.eq("public_identifier", value).maybeSingle(),
    await baseQuery.eq("short_code", value).maybeSingle(),
  ];
  const node = attempts.map((attempt) => attempt.data).find(Boolean) as NodeLookupRow | undefined;
  if (!node) return null;

  if (node.destination_type === "link_page" && node.link_page_id) {
    const { data } = await supabaseAdmin.from("evntszn_link_pages").select("slug").eq("id", node.link_page_id).maybeSingle();
    if (data?.slug) return { href: `/link/${data.slug}`, label: "Link profile" };
  }

  if (node.destination_type === "venue" && node.venue_id) {
    const reserveVenue = await supabaseAdmin
      .from("evntszn_reserve_venues")
      .select("id, evntszn_venues!inner(slug)")
      .eq("venue_id", node.venue_id)
      .maybeSingle();
    const venue = Array.isArray(reserveVenue.data?.evntszn_venues)
      ? reserveVenue.data?.evntszn_venues[0]
      : reserveVenue.data?.evntszn_venues;
    if (venue?.slug) return { href: `/reserve/${venue.slug}`, label: "Reserve venue" };
  }

  if (node.destination_type === "custom_url" && node.destination_payload?.href) {
    return { href: String(node.destination_payload.href), label: "Custom destination" };
  }

  if (node.destination_type === "event" && node.event_id) {
    const { data } = await supabaseAdmin.from("evntszn_events").select("slug").eq("id", node.event_id).maybeSingle();
    if (data?.slug) return { href: `/events/${data.slug}`, label: "Event" };
  }

  return { href: "/reserve", label: "Reserve" };
}

export async function getNodeActionSnapshot(id: string) {
  const value = id.trim();
  const baseQuery = supabaseAdmin
    .from("evntszn_nodes")
    .select("id, slug, public_title, internal_name, public_identifier, short_code, city, state, area_label, location_type, destination_type, destination_payload, venue_id, link_page_id, event_id")
    .eq("status", "active")
    .limit(1);

  const attempts = [
    await baseQuery.eq("id", value).maybeSingle(),
    await baseQuery.eq("slug", value).maybeSingle(),
    await baseQuery.eq("public_identifier", value).maybeSingle(),
    await baseQuery.eq("short_code", value).maybeSingle(),
  ];
  const node = attempts.map((attempt) => attempt.data).find(Boolean) as NodeLookupRow | undefined;
  if (!node) return null;
  const destination = await resolveNodeDestination(id);
  if (!destination) return null;
  const title = node.public_title || node.internal_name || node.slug || "EVNTSZN spot";
  const actionLine =
    node.location_type === "nightlife_hotspot"
      ? "You found a top nightlife spot. Tonight is building here and nearby demand is worth watching."
      : node.location_type === "dining_hotspot"
        ? "This dining lane is active tonight. Save it, watch it, or reserve nearby before the room shifts."
        : node.location_type === "epl_location"
          ? "League interest is building here. Follow the city and keep the next live moment in your loop."
          : "This city spot is live inside EVNTSZN. Save it, watch it, or move into the next action now.";

  return {
    node,
    destination,
    title,
    actionLine,
  };
}
