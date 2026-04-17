export type PublicCity = {
  name: string;
  slug: string;
  shortLabel: string;
  stateLabel: string;
  stateCode: string;
  seoTitle: string;
  seoDescription: string;
  headline: string;
  description: string;
};

export const PUBLIC_CITIES: PublicCity[] = [
  {
    name: "Baltimore",
    slug: "baltimore",
    shortLabel: "Baltimore",
    stateLabel: "Maryland",
    stateCode: "MD",
    seoTitle: "Baltimore nightlife, events, and league nights",
    seoDescription:
      "Track premium nightlife, events, and EVNTSZN activity across Baltimore.",
    headline: "Baltimore nights built for momentum.",
    description:
      "Baltimore is the EVNTSZN home market for premium nightlife, city events, and EPL league energy.",
  },
  {
    name: "Washington",
    slug: "washington",
    shortLabel: "Washington",
    stateLabel: "District of Columbia",
    stateCode: "DC",
    seoTitle: "Washington nightlife, events, and league nights",
    seoDescription:
      "Find premium Washington nightlife, live events, and EVNTSZN activity in one operating layer.",
    headline: "Washington plans worth leaving home for.",
    description:
      "Washington is wired for polished social nights, ticketed experiences, and city discovery with real signal.",
  },
  {
    name: "Rehoboth Beach",
    slug: "rehoboth",
    shortLabel: "Rehoboth",
    stateLabel: "Delaware",
    stateCode: "DE",
    seoTitle: "Rehoboth Beach nightlife, events, and league nights",
    seoDescription:
      "Find Rehoboth Beach nightlife, events, and EVNTSZN discovery surfaces.",
    headline: "Rehoboth nights with a cleaner signal.",
    description:
      "Rehoboth Beach anchors the coastal EVNTSZN lane with nightlife, resort demand, and league-night crossover.",
  },
  {
    name: "Ocean City",
    slug: "ocean-city",
    shortLabel: "Ocean City",
    stateLabel: "Maryland",
    stateCode: "MD",
    seoTitle: "Ocean City nightlife, events, and league nights",
    seoDescription:
      "Browse Ocean City nightlife, event listings, and EVNTSZN public discovery.",
    headline: "Ocean City demand, routed with intent.",
    description:
      "Ocean City blends nightlife traffic, hospitality demand, and reserve-ready operating volume.",
  },
  {
    name: "Bethany Beach",
    slug: "bethany",
    shortLabel: "Bethany",
    stateLabel: "Delaware",
    stateCode: "DE",
    seoTitle: "Bethany Beach nightlife, events, and league nights",
    seoDescription:
      "Follow Bethany Beach events, nightlife, and EVNTSZN experiences with one clean city view.",
    headline: "Bethany plans with premium routing.",
    description:
      "Bethany Beach stays focused on premium placements, hospitality coordination, and the quieter coastal lane.",
  },
];

export const PUBLIC_HOST_MARKETS = PUBLIC_CITIES.map((city) => city.name);

export function getPublicCityBySlug(citySlug: string | null | undefined) {
  const normalized = String(citySlug || "").trim().toLowerCase();
  return PUBLIC_CITIES.find((city) => city.slug === normalized) || null;
}
