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
    headline: "The home of EPL and high-stakes city energy.",
    description:
      "From EPL game nights to the city’s strongest concerts and nightlife plans, Baltimore is where EVNTSZN feels most alive.",
    seoTitle: "Baltimore Events, EPL Flag Football & Nightlife | EVNTSZN",
    seoDescription:
      "Join the league in Baltimore. Discover high-stakes flag football, neighborhood team pride, and the city's strongest nightlife moves through EVNTSZN.",
  },
  {
    slug: "dc",
    name: "Washington",
    stateLabel: "District of Columbia",
    shortLabel: "DC",
    headline: "Power plans. Direct access to Washington's live pulse.",
    description:
      "Move through the District’s mix of sports, concerts, and nights out with a cleaner read on what is worth the trip.",
    seoTitle: "DC Live Events, Sports Entertainment & Washington Nightlife | EVNTSZN",
    seoDescription:
      "Connect to the capital's energy. EVNTSZN brings you direct access to Washington DC's live pulse, from sports to headline nightlife.",
  },
  {
    slug: "rehoboth",
    name: "Rehoboth Beach",
    stateLabel: "Delaware",
    shortLabel: "Rehoboth",
    headline: "Coastal energy. Clean, premium access to the beach pulse.",
    description:
      "Find the nights, beach weekends, and high-energy events worth the trip to Rehoboth.",
    seoTitle: "Rehoboth Beach Events, Nightlife & Coastal Discovery | EVNTSZN",
    seoDescription:
      "Find Rehoboth Beach events worth following. EVNTSZN provides a cleaner, premium surface for coastal-rooted discovery.",
  },
  {
    slug: "oceancity",
    name: "Ocean City",
    stateLabel: "Maryland",
    shortLabel: "Ocean City",
    headline: "The boardwalk pulse, captured in one clean view.",
    description:
      "From beach nights to the city’s strongest concerts and nightlife plans, Ocean City is where the summer feels most alive.",
    seoTitle: "Ocean City Events, Nightlife & Beach Discovery | EVNTSZN",
    seoDescription:
      "Find Ocean City events worth following. EVNTSZN provides a cleaner, premium surface for beach-rooted discovery.",
  },
  {
    slug: "bethany",
    name: "Bethany Beach",
    stateLabel: "Delaware",
    shortLabel: "Bethany",
    headline: "Quiet coastal energy. Premium community access.",
    description:
      "Find community events, beach nights, and local plans in Bethany through the same cleaner EVNTSZN guide.",
    seoTitle: "Bethany Beach Events, Community & Coastal Discovery | EVNTSZN",
    seoDescription:
      "Find Bethany Beach events worth following. EVNTSZN provides a cleaner, premium surface for community-rooted discovery.",
  },
];

export function getPublicCityBySlug(slug: string) {
  return PUBLIC_CITIES.find((city) => city.slug === slug) || null;
}
