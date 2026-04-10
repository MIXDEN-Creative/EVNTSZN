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
      "From the first flag pull to the championship stretch, Baltimore is the heartbeat of EVNTSZN Prime League. Experience the city's most competitive sports and exclusive nightlife.",
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
      "Experience the high-velocity music and sports culture that defines Atlanta. EVNTSZN connects you to the city's destination-defining moments.",
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
      "Navigate the world's most dense entertainment market with clarity. EVNTSZN surfaces the headline sessions and artist drops that actually matter.",
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
      "Miami isn't just a market; it's a statement. Experience high-velocity nightlife and destination-defining events through the premium EVNTSZN discovery layer.",
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
      "Move through the District's live-event mix without the noise. Access high-stakes sports entertainment and Washington's strongest live plans first.",
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
      "Discover the local momentum in Dover. Access community-rooted events and league nights through the same premium discovery layer used across the network.",
    seoTitle: "Dover Local Events, League Nights & Community Discovery | EVNTSZN",
    seoDescription:
      "Find local Dover events and league nights worth following. EVNTSZN provides a cleaner, premium surface for community-rooted discovery.",
  },
];

export function getPublicCityBySlug(slug: string) {
  return PUBLIC_CITIES.find((city) => city.slug === slug) || null;
}
