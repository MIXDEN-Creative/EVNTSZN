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
    slug: "atlanta",
    name: "Atlanta",
    stateLabel: "Georgia",
    shortLabel: "Atlanta",
    headline: "Atlanta's headline culture, captured in one pulse.",
    description:
      "Tap into Atlanta music, sports, and late-night energy without digging through a cluttered calendar.",
    seoTitle: "Atlanta Nightlife, Music Events & City Energy | EVNTSZN",
    seoDescription:
      "Find your next move in Atlanta. Access headline concerts, premium nightlife, and the city's most electric live sessions first.",
  },
  {
    slug: "newyork",
    name: "New York",
    stateLabel: "New York",
    shortLabel: "NYC",
    headline: "The global standard for exclusive nightlife and city plans.",
    description:
      "Cut through the noise and get to the concerts, nightlife, and city plans that actually deserve a spot on the calendar.",
    seoTitle: "NYC Nightlife, Exclusive Events & Headline Concerts | EVNTSZN",
    seoDescription:
      "The definitive source for NYC discovery. Access premium nightlife, exclusive artist events, and the plans worth arriving for.",
  },
  {
    slug: "miami",
    name: "Miami",
    stateLabel: "Florida",
    shortLabel: "Miami",
    headline: "Destination energy. Destination-defining events.",
    description:
      "Find the nights, destination weekends, and high-energy events people actually travel for.",
    seoTitle: "Miami Destination Events, Premium Nightlife & Luxury Discovery | EVNTSZN",
    seoDescription:
      "Unlock Miami's elite event scene. From luxury destination energy to destination-shaping nightlife, land exactly where the energy is.",
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
    slug: "dover",
    name: "Dover",
    stateLabel: "Delaware",
    shortLabel: "Dover",
    headline: "Community momentum. Clean, premium access to local leagues.",
    description:
      "Find community events, league nights, and local plans in Dover through the same cleaner EVNTSZN guide used across every city.",
    seoTitle: "Dover Local Events, League Nights & Community Discovery | EVNTSZN",
    seoDescription:
      "Find local Dover events and league nights worth following. EVNTSZN provides a cleaner, premium surface for community-rooted discovery.",
  },
];

export function getPublicCityBySlug(slug: string) {
  return PUBLIC_CITIES.find((city) => city.slug === slug) || null;
}
