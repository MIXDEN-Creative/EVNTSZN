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
    slug: "dewey-warriors",
    name: "Dewey Warriors",
    neighborhood: "Dewey Beach",
    headline: "Beachfront speed, late-snap pressure, and a group built to keep the game loud.",
    description:
      "The Dewey Warriors give the coastal region a fast, aggressive identity built around crowd pull, open-field speed, and clean game-night presence.",
    logoUrl: "/epl_team_logos/warriors.jpg",
    notes: ["Coastal speed", "Beach crowd pull", "Fast-transition offense"],
  },
  {
    slug: "bethany-bulldogs",
    name: "Bethany Bulldogs",
    neighborhood: "Bethany Beach",
    headline: "Controlled pressure, clean discipline, and a team that closes games with force.",
    description:
      "The Bethany Bulldogs bring structure and composure into the coastal side of EPL with a profile built to feel physical, locked in, and reliable.",
    logoUrl: "/epl_team_logos/bulldogs.jpg",
    notes: ["Defensive discipline", "Short-field control", "Late-game composure"],
  },
  {
    slug: "ocean-city-phantoms",
    name: "Ocean City Phantoms",
    neighborhood: "Ocean City",
    headline: "Boardwalk edge, pressure possessions, and a club built for big swings.",
    description:
      "The Ocean City Phantoms are the menace side of the coast: fast-pressure defense, hard cuts, and a look that feels dangerous from warmups through the final whistle.",
    logoUrl: "/epl_team_logos/phantoms.jpg",
    notes: ["Boardwalk energy", "Attacking confidence", "Pressure-defense identity"],
  },
  {
    slug: "ocean-city-comets",
    name: "Ocean City Comets",
    neighborhood: "Ocean City",
    headline: "Tempo, deep shots, and a team built to turn one play into a full momentum swing.",
    description:
      "The Ocean City Comets bring splash-play energy into the league with a cleaner, faster identity meant to feel explosive and watchable every week.",
    logoUrl: "/epl_team_logos/comets.jpg",
    notes: ["Explosive tempo", "Downfield threat", "Momentum-swing identity"],
  },
  {
    slug: "delmarva-hawks",
    name: "Delmarva Hawks",
    neighborhood: "Delmarva",
    headline: "Regional range, pursuit speed, and a side built to cover the whole field.",
    description:
      "The Delmarva Hawks give EPL a broad-market club with a fast-closing defensive read, long-range offense, and a regional identity that stretches beyond one strip of coast.",
    logoUrl: "/epl_team_logos/hawks.jpg",
    notes: ["Wide-market identity", "Pursuit defense", "Balanced roster build"],
  },
  {
    slug: "rehoboth-knights",
    name: "Rehoboth Knights",
    neighborhood: "Rehoboth Beach",
    headline: "Polished execution, composed pressure, and a club meant for marquee nights.",
    description:
      "The Rehoboth Knights carry the most polished coastal profile in Season 1, pairing game management and premium presence with enough firepower to close nights out.",
    logoUrl: "/epl_team_logos/knights.jpg",
    notes: ["Premium identity", "Composed build-up", "Marquee-night presence"],
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
      team.slug.replace(/-(warriors|bulldogs|phantoms|comets|hawks|knights)$/g, ""),
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
