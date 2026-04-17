export type PublicCity = {
  name: string;
  slug: string;
  shortLabel: string;
  stateLabel: string;
  stateCode: string;
  latitude: number;
  longitude: number;
  seoTitle: string;
  seoDescription: string;
  headline: string;
  description: string;
  heroImage: string;
  eventsIntro: string;
  nightlifeIntro: string;
  reservationsIntro: string;
  venuesIntro: string;
  experienceBlurb: string;
};

export const PUBLIC_CITIES: PublicCity[] = [
  {
    name: "Baltimore",
    slug: "baltimore",
    shortLabel: "Baltimore",
    stateLabel: "Maryland",
    stateCode: "MD",
    latitude: 39.2904,
    longitude: -76.6122,
    seoTitle: "Baltimore nightlife, events, and league nights",
    seoDescription:
      "Track premium nightlife, events, and EVNTSZN activity across Baltimore.",
    headline: "Baltimore nights built for momentum.",
    description:
      "Baltimore is the EVNTSZN home market for premium nightlife, city events, and EPL league energy.",
    heroImage:
      "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1800&q=80",
    eventsIntro:
      "Baltimore moves best when the calendar is filtered down to what actually pulls a room. EVNTSZN curates live events, ticketed nights, sports energy, and nightlife demand into one searchable city view.",
    nightlifeIntro:
      "Baltimore nightlife on EVNTSZN focuses on the rooms, parties, lounges, and after-dark events that create real momentum instead of generic event clutter.",
    reservationsIntro:
      "Baltimore reservations through EVNTSZN Reserve are built for nightlife tables, dinner flow, brunch demand, and venues that need guests routed into the room with intent.",
    venuesIntro:
      "Baltimore venues on EVNTSZN blend event demand, nightlife traffic, and Reserve-ready hospitality so guests can discover where to go next without guesswork.",
    experienceBlurb:
      "From Fells Point energy to downtown event traffic, Baltimore is where EVNTSZN operates as both nightlife authority and live-plan engine.",
  },
  {
    name: "Washington",
    slug: "washington",
    shortLabel: "Washington",
    stateLabel: "District of Columbia",
    stateCode: "DC",
    latitude: 38.9072,
    longitude: -77.0369,
    seoTitle: "Washington nightlife, events, and league nights",
    seoDescription:
      "Find premium Washington nightlife, live events, and EVNTSZN activity in one operating layer.",
    headline: "Washington plans worth leaving home for.",
    description:
      "Washington is wired for polished social nights, ticketed experiences, and city discovery with real signal.",
    heroImage:
      "https://images.unsplash.com/photo-1617581629397-a72507c3de9e?auto=format&fit=crop&w=1800&q=80",
    eventsIntro:
      "Washington events on EVNTSZN are filtered for nightlife, live shows, city happenings, and experiences that deserve a spot on the calendar instead of another ignored listing.",
    nightlifeIntro:
      "Washington nightlife moves through lounges, social rooms, curated parties, and polished nights out. EVNTSZN keeps that lane discoverable and searchable.",
    reservationsIntro:
      "Washington reservations on EVNTSZN Reserve are structured for high-intent booking demand across dinner, brunch, late-night tables, and event-led hospitality.",
    venuesIntro:
      "Washington venues on EVNTSZN give Google and guests a cleaner map of where events, nightlife, and reservation demand intersect.",
    experienceBlurb:
      "Washington is where EVNTSZN positions itself as city-events authority, nightlife search layer, and reservation engine for premium demand.",
  },
  {
    name: "Rehoboth Beach",
    slug: "rehoboth",
    shortLabel: "Rehoboth",
    stateLabel: "Delaware",
    stateCode: "DE",
    latitude: 38.7209,
    longitude: -75.076,
    seoTitle: "Rehoboth Beach nightlife, events, and league nights",
    seoDescription:
      "Find Rehoboth Beach nightlife, events, and EVNTSZN discovery surfaces.",
    headline: "Rehoboth nights with a cleaner signal.",
    description:
      "Rehoboth Beach anchors the coastal EVNTSZN lane with nightlife, resort demand, and league-night crossover.",
    heroImage:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1800&q=80",
    eventsIntro:
      "Rehoboth Beach events on EVNTSZN are built around weekend demand, summer movement, and nightlife that makes the coast feel active after the beach clears out.",
    nightlifeIntro:
      "Rehoboth nightlife on EVNTSZN covers bars, lounges, parties, and late plans people actually search for when they want a night out near the beach.",
    reservationsIntro:
      "Rehoboth reservations on EVNTSZN Reserve help guests move from search intent into dinner, table, and nightlife booking without friction.",
    venuesIntro:
      "Rehoboth Beach venues on EVNTSZN highlight where hospitality, nightlife, and event demand overlap across the resort lane.",
    experienceBlurb:
      "Rehoboth Beach gives EVNTSZN a strong coastal search footprint for things to do tonight, nightlife near me, and reservations near me.",
  },
  {
    name: "Ocean City",
    slug: "ocean-city",
    shortLabel: "Ocean City",
    stateLabel: "Maryland",
    stateCode: "MD",
    latitude: 38.3365,
    longitude: -75.0849,
    seoTitle: "Ocean City nightlife, events, and league nights",
    seoDescription:
      "Browse Ocean City nightlife, event listings, and EVNTSZN public discovery.",
    headline: "Ocean City demand, routed with intent.",
    description:
      "Ocean City blends nightlife traffic, hospitality demand, and reserve-ready operating volume.",
    heroImage:
      "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1800&q=80",
    eventsIntro:
      "Ocean City events on EVNTSZN are tuned for beach weekends, concert traffic, nightlife demand, and the kind of plans visitors actually search for in-season.",
    nightlifeIntro:
      "Ocean City nightlife on EVNTSZN focuses on clubs, lounges, parties, and waterfront energy that translates into real search intent.",
    reservationsIntro:
      "Ocean City reservations on EVNTSZN Reserve support hospitality-heavy demand for brunch, dinner, nightlife tables, and guest flow on busy weekends.",
    venuesIntro:
      "Ocean City venues on EVNTSZN map the nightlife and hospitality rooms that matter when guests search for where to go next.",
    experienceBlurb:
      "Ocean City gives EVNTSZN a strong seasonal search surface for nightlife, reservations, events near me, and things to do tonight.",
  },
  {
    name: "Bethany Beach",
    slug: "bethany",
    shortLabel: "Bethany",
    stateLabel: "Delaware",
    stateCode: "DE",
    latitude: 38.5396,
    longitude: -75.0552,
    seoTitle: "Bethany Beach nightlife, events, and league nights",
    seoDescription:
      "Follow Bethany Beach events, nightlife, and EVNTSZN experiences with one clean city view.",
    headline: "Bethany plans with premium routing.",
    description:
      "Bethany Beach stays focused on premium placements, hospitality coordination, and the quieter coastal lane.",
    heroImage:
      "https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?auto=format&fit=crop&w=1800&q=80",
    eventsIntro:
      "Bethany Beach events on EVNTSZN surface the cleaner, more premium side of the coast: low-friction discovery, curated nights, and local experiences worth planning around.",
    nightlifeIntro:
      "Bethany nightlife on EVNTSZN is less about noise and more about polished lounges, social dinners, coastal bars, and nights that still carry intent.",
    reservationsIntro:
      "Bethany reservations on EVNTSZN Reserve give restaurants and nightlife venues a clearer path from guest search to confirmed booking.",
    venuesIntro:
      "Bethany Beach venues on EVNTSZN bring hospitality, nightlife, and reservations into one discoverable local directory.",
    experienceBlurb:
      "Bethany Beach gives EVNTSZN authority in the quieter premium-coastal lane where searchers still want nightlife, venues, and reservations near them.",
  },
];

export const PUBLIC_HOST_MARKETS = PUBLIC_CITIES.map((city) => city.name);

export function getPublicCityBySlug(citySlug: string | null | undefined) {
  const normalized = String(citySlug || "").trim().toLowerCase();
  return PUBLIC_CITIES.find((city) => city.slug === normalized) || null;
}

export function getPublicCityByName(cityName: string | null | undefined) {
  const normalized = String(cityName || "").trim().toLowerCase();
  return PUBLIC_CITIES.find((city) => city.name.toLowerCase() === normalized) || null;
}
