export type PublicCity = {
  slug: string;
  name: string;
  stateLabel: string;
  shortLabel: string;
  headline: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
};

export const PUBLIC_CITIES: PublicCity[] = [
  {
    slug: "baltimore",
    name: "Baltimore",
    stateLabel: "Maryland",
    shortLabel: "Baltimore",
    headline: "Baltimore events, nightlife, sports, and things to do",
    description:
      "Discover nightlife, sports, concerts, leagues, and standout city energy in Baltimore through EVNTSZN’s premium discovery layer.",
    seoTitle: "Baltimore events, nightlife, sports, and things to do",
    seoDescription:
      "Find Baltimore events, nightlife, live music, sports entertainment, and the best things to do through EVNTSZN.",
  },
  {
    slug: "atlanta",
    name: "Atlanta",
    stateLabel: "Georgia",
    shortLabel: "Atlanta",
    headline: "Atlanta events, music, nightlife, and live moments",
    description:
      "Search Atlanta concerts, nightlife, sports, and things to do with a cleaner premium event-discovery experience.",
    seoTitle: "Atlanta events, nightlife, music, and things to do",
    seoDescription:
      "Discover Atlanta nightlife, music events, sports, and things to do with EVNTSZN’s premium event-discovery platform.",
  },
  {
    slug: "newyork",
    name: "New York",
    stateLabel: "New York",
    shortLabel: "NYC",
    headline: "New York events, nightlife, concerts, and city discovery",
    description:
      "Browse New York nightlife, headline events, live music, and premium city plans without fighting noisy discovery feeds.",
    seoTitle: "New York events, nightlife, concerts, and things to do",
    seoDescription:
      "Find New York events, nightlife, concerts, sports, and things to do with EVNTSZN.",
  },
  {
    slug: "miami",
    name: "Miami",
    stateLabel: "Florida",
    shortLabel: "Miami",
    headline: "Miami events, nightlife, music, and destination energy",
    description:
      "Discover Miami nightlife, live entertainment, concerts, and city-shaping events through a premium discovery layer.",
    seoTitle: "Miami events, nightlife, music, and things to do",
    seoDescription:
      "Discover Miami nightlife, music events, sports entertainment, and things to do with EVNTSZN.",
  },
  {
    slug: "dc",
    name: "Washington",
    stateLabel: "District of Columbia",
    shortLabel: "DC",
    headline: "DC events, nightlife, sports, and live entertainment",
    description:
      "Find DC nightlife, concerts, sports, and premium things to do across Washington’s live-event mix.",
    seoTitle: "DC events, nightlife, sports, and things to do",
    seoDescription:
      "Discover DC events, nightlife, sports, and live entertainment with EVNTSZN.",
  },
];

export function getPublicCityBySlug(slug: string) {
  return PUBLIC_CITIES.find((city) => city.slug === slug) || null;
}
