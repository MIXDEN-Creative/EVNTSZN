export type EplTeamProfile = {
  slug: string;
  name: string;
  teamCode: string;
  logoUrl: string;
  neighborhood: string;
  city: string;
  conference: "Baltimore" | "Coastal";
  headline: string;
  description: string;
  notes: string[];
};

export const EPL_TEAM_PROFILES: EplTeamProfile[] = [
  {
    slug: "chargers",
    name: "Canton Chargers",
    teamCode: "CHA",
    logoUrl: "/epl_team_logos/chargers.jpeg",
    neighborhood: "Canton",
    city: "Baltimore",
    conference: "Baltimore",
    headline: "Tempo from the harbor edge.",
    description: "The Chargers stretch the field early and keep pressure on every short corner in Canton.",
    notes: ["Explosive tempo", "East harbor identity", "Fast pressure package"],
  },
  {
    slug: "raiders",
    name: "Fells Point Raiders",
    teamCode: "RAI",
    logoUrl: "/epl_team_logos/raiders.jpeg",
    neighborhood: "Fells Point",
    city: "Baltimore",
    conference: "Baltimore",
    headline: "Chaos, contact, and late-drive edge.",
    description: "The Raiders bring waterfront energy, crowd momentum, and a pressure-heavy style built for tight games.",
    notes: ["High-pressure defense", "Fells Point identity", "Momentum-forward group"],
  },
  {
    slug: "rebels",
    name: "Hampden Rebels",
    teamCode: "REB",
    logoUrl: "/epl_team_logos/rebels.jpeg",
    neighborhood: "Hampden",
    city: "Baltimore",
    conference: "Baltimore",
    headline: "Creative football with live-wire confidence.",
    description: "The Rebels thrive when the game breaks script and Hampden energy opens the field.",
    notes: ["Improvisational offense", "Athletic coverage unit", "Momentum-driven group"],
  },
  {
    slug: "royals",
    name: "Mount Vernon Royals",
    teamCode: "ROY",
    logoUrl: "/epl_team_logos/royals.jpeg",
    neighborhood: "Mount Vernon",
    city: "Baltimore",
    conference: "Baltimore",
    headline: "Composed, polished, and ruthless late.",
    description: "The Royals operate with structure, spacing, and fourth-quarter composure from the center of the city.",
    notes: ["Controlled pace", "Balanced offense", "Late-game composure"],
  },
  {
    slug: "sentinels",
    name: "Federal Hill Sentinels",
    teamCode: "SEN",
    logoUrl: "/epl_team_logos/sentinels.jpeg",
    neighborhood: "Federal Hill",
    city: "Baltimore",
    conference: "Baltimore",
    headline: "Disciplined shape with a fast close.",
    description: "The Sentinels stay organized, absorb pressure, and close drives with urgency above the harbor.",
    notes: ["Sound positioning", "Reliable flag pulls", "Strong two-minute execution"],
  },
  {
    slug: "titans",
    name: "Harbor Titans",
    teamCode: "TIT",
    logoUrl: "/epl_team_logos/titans.jpeg",
    neighborhood: "Inner Harbor",
    city: "Baltimore",
    conference: "Baltimore",
    headline: "Size, leverage, and red-zone power.",
    description: "The Titans lean on physical matchups and finish drives with authority around the harbor core.",
    notes: ["Power concepts", "High-point receivers", "Short-yardage control"],
  },
  {
    slug: "warriors",
    name: "Dewey Warriors",
    teamCode: "WAR",
    logoUrl: "/epl_team_logos/warriors.jpg",
    neighborhood: "Dewey Beach",
    city: "Rehoboth Beach",
    conference: "Coastal",
    headline: "Aggressive tempo from first whistle.",
    description: "The Warriors push pace, stretch the field, and hunt early separation with Dewey urgency.",
    notes: ["Up-tempo opening script", "Wide-field spacing", "Attacking pursuit angles"],
  },
  {
    slug: "bulldogs",
    name: "Bethany Bulldogs",
    teamCode: "BUL",
    logoUrl: "/epl_team_logos/bulldogs.jpg",
    neighborhood: "Bethany Beach",
    city: "Bethany Beach",
    conference: "Coastal",
    headline: "Structured football with finish.",
    description: "The Bulldogs are methodical, disciplined, and built to grind out four-quarter wins along the coast.",
    notes: ["Disciplined reads", "Short-field execution", "Reliable red-zone unit"],
  },
  {
    slug: "comets",
    name: "Ocean City Comets",
    teamCode: "COM",
    logoUrl: "/epl_team_logos/comets.jpg",
    neighborhood: "Ocean City boardwalk",
    city: "Ocean City",
    conference: "Coastal",
    headline: "Clean routes and sharp timing.",
    description: "The Comets are built around precision, spacing, and a polished boardwalk identity.",
    notes: ["Timing-based offense", "Technical route runners", "Calm under pressure"],
  },
  {
    slug: "hawks",
    name: "Delmarva Hawks",
    teamCode: "HWK",
    logoUrl: "/epl_team_logos/hawks.jpg",
    neighborhood: "Delmarva coast",
    city: "Rehoboth Beach",
    conference: "Coastal",
    headline: "Read it early. Strike over the top.",
    description: "The Hawks live off anticipation, takeaways, and long-field punishment across the peninsula.",
    notes: ["Ball-hawk secondary", "Vertical threats", "Quick-change scoring"],
  },
  {
    slug: "knights",
    name: "Rehoboth Knights",
    teamCode: "KNI",
    logoUrl: "/epl_team_logos/knights.jpg",
    neighborhood: "Rehoboth Beach",
    city: "Bethany Beach",
    conference: "Coastal",
    headline: "Coastal structure with late-game finish.",
    description: "The Knights bring disciplined football and clean situational execution to the Rehoboth lane.",
    notes: ["Disciplined reads", "Short-field execution", "Reliable red-zone unit"],
  },
  {
    slug: "phantoms",
    name: "Fenwick Phantoms",
    teamCode: "PHA",
    logoUrl: "/epl_team_logos/phantoms.PNG",
    neighborhood: "Fenwick Island",
    city: "Bethany Beach",
    conference: "Coastal",
    headline: "Hard to track. Harder to stop.",
    description: "The Phantoms lean into disguise, motion, and disruptive late rotations across the Fenwick edge.",
    notes: ["Disguise-heavy defense", "Late rotation looks", "Sudden momentum swings"],
  },
];

export const EPL_TEAMS = Object.fromEntries(
  EPL_TEAM_PROFILES.map((team) => [
    team.slug,
    {
      name: team.name,
      logo: team.logoUrl,
      city: team.city,
      conference: team.conference,
    },
  ]),
) as Record<string, { name: string; logo: string; city: string; conference: string }>;

export function getEplTeamProfile(teamSlug: string | null | undefined) {
  const normalized = String(teamSlug || "").trim().toLowerCase();
  return EPL_TEAM_PROFILES.find((team) => team.slug === normalized) || null;
}

export function resolveEplTeamProfile(input: { slug?: string | null; teamName?: string | null }) {
  const slugMatch = getEplTeamProfile(input.slug);
  if (slugMatch) return slugMatch;
  const normalizedName = String(input.teamName || "").trim().toLowerCase();
  return EPL_TEAM_PROFILES.find((team) => team.name.toLowerCase() === normalizedName) || null;
}

export const getEPLTeam = (teamId: string) => EPL_TEAMS[teamId] || null;
export const getAllEPLTeams = () => EPL_TEAM_PROFILES;
export const getTeamsByConference = (conference: string) =>
  EPL_TEAM_PROFILES.filter((team) => team.conference.toLowerCase() === conference.toLowerCase());
export const getTeamsByCity = (city: string) =>
  EPL_TEAM_PROFILES.filter((team) => team.city.toLowerCase() === city.toLowerCase());
