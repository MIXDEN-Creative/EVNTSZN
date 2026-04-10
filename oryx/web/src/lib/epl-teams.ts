export type EplTeamProfile = {
  slug: string;
  name: string;
  neighborhood: string;
  headline: string;
  description: string;
  logoUrl: string;
  notes: string[];
};

export const EPL_TEAM_PROFILES: EplTeamProfile[] = [
  {
    slug: "canton-chargers",
    name: "Canton Chargers",
    neighborhood: "Canton",
    headline: "Canton speed, late-game pressure, and clean execution.",
    description:
      "The Canton Chargers bring fast cuts, clean pulls, and a city identity built for players and supporters who want every snap to feel live.",
    logoUrl: "/epl_team_logos/chargers.jpeg",
    notes: ["Draft-built roster identity", "Waterfront crowd pull", "Fast-transition style"],
  },
  {
    slug: "federal-hill-sentinels",
    name: "Federal Hill Sentinels",
    neighborhood: "Federal Hill",
    headline: "Federal Hill discipline with a polished, high-pressure edge.",
    description:
      "The Sentinels project structure, control, and big-moment poise across every week of the standings race.",
    logoUrl: "/epl_team_logos/sentinels.jpeg",
    notes: ["Structured coverage", "Defensive composure", "Standings pressure"],
  },
  {
    slug: "fells-point-raiders",
    name: "Fells Point Raiders",
    neighborhood: "Fells Point",
    headline: "Harbor energy, pressure moments, and a side built to steal the night.",
    description:
      "The Fells Point Raiders lean into nightlife-edge personality and a game-night identity that feels loud, dangerous, and worth showing up for.",
    logoUrl: "/epl_team_logos/raiders.jpeg",
    notes: ["Crowd energy", "Attacking confidence", "Harbor-night identity"],
  },
  {
    slug: "hampden-rebels",
    name: "Hampden Rebels",
    neighborhood: "Hampden",
    headline: "Independent spirit, hard minutes, and a side that refuses to look generic.",
    description:
      "The Hampden Rebels give the league an unmistakable team personality with a style rooted in grit, pursuit speed, and city pride.",
    logoUrl: "/epl_team_logos/rebels.jpeg",
    notes: ["Independent edge", "Hard-running defense", "City-pride identity"],
  },
  {
    slug: "harbor-titans",
    name: "Harbor Titans",
    neighborhood: "Harbor",
    headline: "Big-stage presence, heavy game-night energy, and a team built to dominate.",
    description:
      "The Harbor Titans bring scale and spectacle into the league with a premium identity meant to feel imposing and unstoppable.",
    logoUrl: "/epl_team_logos/titans.jpeg",
    notes: ["Big-game feel", "Physical identity", "Premium team presence"],
  },
  {
    slug: "mount-vernon-royals",
    name: "Mount Vernon Royals",
    neighborhood: "Mount Vernon",
    headline: "Polished control, city elegance, and a side that moves with intent.",
    description:
      "The Mount Vernon Royals carry the most composed public identity in the league, pairing style with weekly pressure.",
    logoUrl: "/epl_team_logos/royals.jpeg",
    notes: ["Composed build-up", "Elegant identity", "High-pressure finishing"],
  },
];

export function getEplTeamProfile(slug: string) {
  return EPL_TEAM_PROFILES.find((team) => team.slug === slug) || null;
}

const TEAM_ALIAS_MAP = new Map(
  EPL_TEAM_PROFILES.flatMap((team) => {
    const aliases = [
      team.slug,
      team.name,
      team.neighborhood,
      team.neighborhood.toLowerCase(),
      team.name.toLowerCase(),
      team.slug.replace(/-chargers|-sentinels|-raiders|-rebels|-titans|-royals/g, ""),
    ];

    return aliases.map((alias) => [alias.trim().toLowerCase(), team] as const);
  }),
);

export function resolveEplTeamProfile(input: {
  slug?: string | null;
  teamName?: string | null;
}) {
  const candidates = [input.slug, input.teamName]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.trim().toLowerCase());

  for (const candidate of candidates) {
    const direct = TEAM_ALIAS_MAP.get(candidate);
    if (direct) return direct;
  }

  return null;
}
