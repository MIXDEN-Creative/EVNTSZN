export type EplTeamProfile = {
  slug: string;
  name: string;
  neighborhood: string;
  headline: string;
  description: string;
  notes: string[];
};

export const EPL_TEAM_PROFILES: EplTeamProfile[] = [
  {
    slug: "canton-chargers",
    name: "Canton Chargers",
    neighborhood: "Canton",
    headline: "Canton speed, late-game pressure, and clean execution.",
    description:
      "The Canton Chargers carry a fast, sharp city identity built for players and supporters who want the league to feel intense from the first whistle.",
    notes: ["Draft-built roster identity", "Waterfront crowd pull", "Fast-transition style"],
  },
  {
    slug: "federal-hill-sentinels",
    name: "Federal Hill Sentinels",
    neighborhood: "Federal Hill",
    headline: "Federal Hill discipline with a polished, high-pressure edge.",
    description:
      "The Sentinels project structure, control, and big-moment poise across every week of the table race.",
    notes: ["Structured shape", "Defensive composure", "Table-pressure football"],
  },
  {
    slug: "fells-point-raiders",
    name: "Fells Point Raiders",
    neighborhood: "Fells Point",
    headline: "Harbor energy, pressure moments, and a side built to steal the night.",
    description:
      "The Fells Point Raiders lean into nightlife-edge personality and a match-day identity that feels loud, dangerous, and worth showing up for.",
    notes: ["Crowd energy", "Attacking confidence", "Harbor-night identity"],
  },
  {
    slug: "hampden-rebels",
    name: "Hampden Rebels",
    neighborhood: "Hampden",
    headline: "Independent spirit, hard minutes, and a side that refuses to look generic.",
    description:
      "The Hampden Rebels give the league an unmistakable club personality with a style rooted in grit and city pride.",
    notes: ["Independent edge", "Hard-running midfield", "City-pride identity"],
  },
  {
    slug: "harbor-titans",
    name: "Harbor Titans",
    neighborhood: "Harbor",
    headline: "Big-stage presence, heavy-match energy, and a club built to look the part.",
    description:
      "The Harbor Titans bring scale and spectacle into the league with a premium public-facing identity meant to feel imposing.",
    notes: ["Big-match feel", "Physical identity", "Premium club presence"],
  },
  {
    slug: "mount-vernon-royals",
    name: "Mount Vernon Royals",
    neighborhood: "Mount Vernon",
    headline: "Polished control, city elegance, and a side that moves with intent.",
    description:
      "The Mount Vernon Royals carry the most composed public identity in the league, pairing style with weekly pressure.",
    notes: ["Composed build-up", "Elegant identity", "High-pressure finishing"],
  },
];

export function getEplTeamProfile(slug: string) {
  return EPL_TEAM_PROFILES.find((team) => team.slug === slug) || null;
}
