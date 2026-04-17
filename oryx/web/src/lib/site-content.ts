import { supabaseAdmin } from "@/lib/supabase-admin";
import { supabasePublicServer } from "@/lib/supabase-public-server";
import { formatRuntimeError, getSupabaseRuntimeSnapshot, isSupabaseCredentialError } from "@/lib/runtime-env";

type ContentCategory = {
  title: string;
  description: string;
};

type ContentCity = {
  name: string;
  description: string;
};

export type HomepageHeroContent = {
  eyebrow: string;
  title: string;
  description: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  tertiaryCtaLabel: string;
  tertiaryCtaHref: string;
};

export type HomepageBannerContent = {
  eyebrow: string;
  title: string;
  body: string;
};

export type HomepageDiscoveryContent = {
  headline: string;
  body: string;
  disclosure: string;
  searchPlaceholder: string;
  keywordPlaceholder: string;
  cityPlaceholder: string;
  nativeHeadline: string;
  hostHeadline: string;
  independentHeadline: string;
  externalHeadline: string;
};

export type HomepageTaxonomyContent = {
  categories: ContentCategory[];
  cities: ContentCity[];
};

export type HomepageVisibilityContent = {
  showNativeSection: boolean;
  showHostSection: boolean;
  showIndependentSection: boolean;
  showExternalSection: boolean;
  showEplPanel: boolean;
  showPopularSection: boolean;
  showCategoryBlocks: boolean;
  showCityBlocks: boolean;
};

export type EplHeroContent = {
  eyebrow: string;
  title: string;
  description: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
};

export type EplSectionContent = {
  seasonHeadline: string;
  seasonBody: string;
  scheduleHeadline: string;
  scheduleBody: string;
  teamsHeadline: string;
  teamsBody: string;
  standingsHeadline: string;
  standingsBody: string;
  storeHeadline: string;
  storeBody: string;
};

export type EplMenuVisibilityContent = {
  showRegister: boolean;
  showSchedule: boolean;
  showTeams: boolean;
  showStandings: boolean;
  showStore: boolean;
  showOpportunities: boolean;
  showDraftCountdown: boolean;
  showFaq: boolean;
};

export type PublicModulesContent = {
  citySpotlight: {
    eyebrow: string;
    headline: string;
    body: string;
  };
  teamBlocks: {
    scheduleHeadline: string;
    scheduleBody: string;
    rosterHeadline: string;
    rosterBody: string;
    announcementsHeadline: string;
    announcementsBody: string;
  };
  storePromo: {
    eyebrow: string;
    headline: string;
    body: string;
    ctaLabel: string;
    ctaHref: string;
  };
  sponsorBlock: {
    eyebrow: string;
    headline: string;
    body: string;
    footerHeadline: string;
  };
  opportunitiesBlock: {
    eyebrow: string;
    headline: string;
    body: string;
  };
};

type SiteContentRow = {
  key: string;
  content: Record<string, unknown> | null;
};

export type HomepageContent = {
  hero: HomepageHeroContent;
  banner: HomepageBannerContent;
  discovery: HomepageDiscoveryContent;
  taxonomy: HomepageTaxonomyContent;
  visibility: HomepageVisibilityContent;
  storageReady: boolean;
};

const HOMEPAGE_CONTENT_KEYS = [
  "homepage.hero",
  "homepage.banner",
  "homepage.discovery",
  "homepage.taxonomy",
  "homepage.visibility",
] as const;

const EPL_PUBLIC_CONTENT_KEYS = [
  "epl.hero",
  "epl.sections",
  "epl.menu",
] as const;

const PUBLIC_MODULE_CONTENT_KEYS = [
  "public.modules",
] as const;

export type EplPublicContent = {
  hero: EplHeroContent;
  sections: EplSectionContent;
  menu: EplMenuVisibilityContent;
  storageReady: boolean;
};

export type PublicModules = PublicModulesContent & {
  storageReady: boolean;
};

export const DEFAULT_HOMEPAGE_CONTENT: Omit<HomepageContent, "storageReady"> = {
  hero: {
    eyebrow: "Live City Guide",
    title: "Skip the noise. Find the night, the game, or the event worth showing up for.",
    description:
      "EVNTSZN brings together concerts, nightlife, sports, and league nights across the cities people check first. Search fast, move cleanly, and land on the right plan.",
    primaryCtaLabel: "Explore events",
    primaryCtaHref: "/events",
    secondaryCtaLabel: "See EPL",
    secondaryCtaHref: "/epl",
    tertiaryCtaLabel: "Sign in",
    tertiaryCtaHref: "/account/login?next=/account",
  },
  banner: {
    eyebrow: "Built for real plans",
    title: "One place to search. One cleaner path to show up.",
    body: "Browse what is happening, open the event or league page that fits, and move straight into the next step without bouncing through disconnected surfaces.",
  },
  discovery: {
    headline: "Find what is happening next.",
    body: "Search EVNTSZN listings first, then expand into trusted city results from Ticketmaster and Eventbrite when they fit the search. The goal is simple: show you the strongest options without clutter.",
    disclosure:
      "EVNTSZN listings lead the mix when they match. External results fill the gaps when they help.",
    searchPlaceholder: "Search by artist, venue, team, league night, or mood",
    keywordPlaceholder: "Search term",
    cityPlaceholder: "City",
    nativeHeadline: "EVNTSZN picks",
    hostHeadline: "Curator-led events",
    independentHeadline: "Partners",
    externalHeadline: "More around the city",
  },
  taxonomy: {
    categories: [
      {
        title: "Music",
        description: "Concerts, artist nights, and live sets worth leaving home for.",
      },
      {
        title: "Nightlife",
        description: "Late plans, parties, and after-dark rooms people actually talk about.",
      },
      {
        title: "Sports",
        description: "Game-day energy, watch plans, and leagues with something on the line.",
      },
      {
        title: "Around town",
        description: "Clean picks for the plans that make the week feel better.",
      },
    ],
    cities: [
      {
        name: "Baltimore",
        description: "Concerts, nightlife, and EPL game-day energy rooted in the city.",
      },
      {
        name: "Washington",
        description: "Concerts, sports, and city nights with a cleaner read on what is actually worth the trip.",
      },
      {
        name: "Rehoboth Beach",
        description: "Beach-weekend plans, nightlife, and coastal energy worth following without guesswork.",
      },
      {
        name: "Ocean City",
        description: "Boardwalk nights, beach crowds, and summer momentum in one cleaner city guide.",
      },
      {
        name: "Bethany Beach",
        description: "Community nights, coastal plans, and premium low-friction discovery for the quieter beach lane.",
      },
    ],
  },
  visibility: {
    showNativeSection: false,
    showHostSection: false,
    showIndependentSection: false,
    showExternalSection: true,
    showEplPanel: true,
    showPopularSection: true,
    showCategoryBlocks: true,
    showCityBlocks: true,
  },
};

export const DEFAULT_EPL_PUBLIC_CONTENT: Omit<EplPublicContent, "storageReady"> = {
  hero: {
    eyebrow: "Coed Adult Flag Football",
    title: "Coed flag football with real teams, real standings, and a city that picks sides.",
    description:
      "EPL brings league nights into one public home for players, supporters, applicants, and anyone tracking the season from the two-region draft structure through game day.",
    primaryCtaLabel: "Register for Season 1",
    primaryCtaHref: "/epl/season-1/register",
    secondaryCtaLabel: "See the schedule",
    secondaryCtaHref: "/epl/schedule",
  },
  sections: {
    seasonHeadline: "Draft night starts it. The table finishes it.",
    seasonBody:
      "Season 1 is built around coed flag football, regional identity, and weekly games that matter. The player pool is structured around 144 players entering through two draft nights: a Baltimore draft first, then a coastal draft one week later.",
    scheduleHeadline: "Every game week should feel like it matters.",
    scheduleBody:
      "Follow the two-draft rollout, opening week, rivalry matchups, and the stretch that decides playoff pressure. The league page stays built around what players and supporters actually need next.",
    teamsHeadline: "Six clubs with their own look, voice, and pressure.",
    teamsBody:
      "These are not filler placeholders. Each club carries its own regional identity, game-night edge, and supporter pull through the season.",
    standingsHeadline: "The standings are where the talk gets real.",
    standingsBody:
      "Watch the table settle, then tighten. Wins, losses, points, and club momentum all land in one public place.",
    storeHeadline: "Wear the club. Wear the league.",
    storeBody:
      "Shop EPL gear built for players, supporters, and anyone who wants the season to follow them off the field.",
  },
  menu: {
    showRegister: true,
    showSchedule: true,
    showTeams: true,
    showStandings: true,
    showStore: true,
    showOpportunities: true,
    showDraftCountdown: true,
    showFaq: true,
  },
};

export const DEFAULT_PUBLIC_MODULES: Omit<PublicModules, "storageReady"> = {
  citySpotlight: {
    eyebrow: "City spotlight",
    headline: "Find the plans a city is actually moving around.",
    body: "The strongest nights, live moments, and league energy should be easy to spot. That is the standard here.",
  },
  teamBlocks: {
    scheduleHeadline: "Schedule",
    scheduleBody: "Keep up with the next kickoff, the next rivalry spot, and the next swing game on the board.",
    rosterHeadline: "Club identity",
    rosterBody: "Follow the personality, edge, and style that make each team feel distinct all season.",
    announcementsHeadline: "League updates",
    announcementsBody: "See the latest league notes, public updates, and game-week changes in one place.",
  },
  storePromo: {
    eyebrow: "Official gear",
    headline: "League gear that still works off the field.",
    body: "Shop EPL pieces built for players, supporters, and anyone carrying the league through the week.",
    ctaLabel: "Shop EPL store",
    ctaHref: "/epl/store",
  },
  sponsorBlock: {
    eyebrow: "Sponsors",
    headline: "Brands showing up around the season.",
    body: "League nights get stronger when the right brands and sponsor activations are part of the build.",
    footerHeadline: "The brands showing up around EVNTSZN and EPL.",
  },
  opportunitiesBlock: {
    eyebrow: "League opportunities",
    headline: "Work league nights, support the teams, and get closer to the action.",
    body: "Browse paid and volunteer roles first, then apply for the opening that fits. EPL opportunities stay tied to real league-night needs.",
  },
};

function mergeObject<T extends Record<string, unknown>>(base: T, patch: Record<string, unknown> | null | undefined): T {
  if (!patch) return base;

  return {
    ...base,
    ...Object.fromEntries(
      Object.entries(patch).filter(([, value]) => value !== undefined && value !== null),
    ),
  };
}

function normalizeTaxonomyContent(value: Record<string, unknown> | null | undefined): HomepageTaxonomyContent {
  const categories = Array.isArray(value?.categories)
    ? value.categories.filter(
        (item): item is ContentCategory =>
          Boolean(item) &&
          typeof item === "object" &&
          typeof (item as ContentCategory).title === "string" &&
          typeof (item as ContentCategory).description === "string",
      )
    : DEFAULT_HOMEPAGE_CONTENT.taxonomy.categories;

  const cities = Array.isArray(value?.cities)
    ? value.cities.filter(
        (item): item is ContentCity =>
          Boolean(item) &&
          typeof item === "object" &&
          typeof (item as ContentCity).name === "string" &&
          typeof (item as ContentCity).description === "string",
      )
    : DEFAULT_HOMEPAGE_CONTENT.taxonomy.cities;

  return {
    categories,
    cities,
  };
}

function normalizeHomepageVisibility(value: Record<string, unknown> | null | undefined): HomepageVisibilityContent {
  return {
    showNativeSection: value?.showNativeSection === true,
    showHostSection: value?.showHostSection === true,
    showIndependentSection: value?.showIndependentSection === true,
    showExternalSection: value?.showExternalSection !== false,
    showEplPanel: value?.showEplPanel !== false,
    showPopularSection: value?.showPopularSection !== false,
    showCategoryBlocks: value?.showCategoryBlocks !== false,
    showCityBlocks: value?.showCityBlocks !== false,
  };
}

function normalizeEplMenu(value: Record<string, unknown> | null | undefined): EplMenuVisibilityContent {
  return {
    showRegister: value?.showRegister !== false,
    showSchedule: value?.showSchedule !== false,
    showTeams: value?.showTeams !== false,
    showStandings: value?.showStandings !== false,
    showStore: value?.showStore !== false,
    showOpportunities: value?.showOpportunities !== false,
    showDraftCountdown: value?.showDraftCountdown !== false,
    showFaq: value?.showFaq !== false,
  };
}

function normalizePublicModules(value: Record<string, unknown> | null | undefined): PublicModulesContent {
  return {
    citySpotlight: mergeObject(DEFAULT_PUBLIC_MODULES.citySpotlight, (value?.citySpotlight as Record<string, unknown> | undefined) || undefined),
    teamBlocks: mergeObject(DEFAULT_PUBLIC_MODULES.teamBlocks, (value?.teamBlocks as Record<string, unknown> | undefined) || undefined),
    storePromo: mergeObject(DEFAULT_PUBLIC_MODULES.storePromo, (value?.storePromo as Record<string, unknown> | undefined) || undefined),
    sponsorBlock: mergeObject(DEFAULT_PUBLIC_MODULES.sponsorBlock, (value?.sponsorBlock as Record<string, unknown> | undefined) || undefined),
    opportunitiesBlock: mergeObject(DEFAULT_PUBLIC_MODULES.opportunitiesBlock, (value?.opportunitiesBlock as Record<string, unknown> | undefined) || undefined),
  };
}

function isMissingContentTableError(error: unknown) {
  const code = typeof error === "object" && error !== null && "code" in error ? String((error as { code?: unknown }).code) : "";
  const status = typeof error === "object" && error !== null && "status" in error ? String((error as { status?: unknown }).status) : "";
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message?: unknown }).message)
      : "";

  return (
    code === "42P01" ||
    code === "PGRST205" ||
    status === "404" ||
    /site_content_entries/i.test(message) ||
    /relation .*site_content_entries/i.test(message) ||
    /schema cache/i.test(message)
  );
}

export async function getHomepageContent(): Promise<HomepageContent> {
  try {
    const runQuery = async (client: typeof supabaseAdmin) =>
      client
        .from("site_content_entries")
        .select("key, content")
        .in("key", [...HOMEPAGE_CONTENT_KEYS])
        .eq("is_active", true);

    let { data, error } = await runQuery(supabaseAdmin);

    if (error && isSupabaseCredentialError(error)) {
      const fallbackResponse = await runQuery(supabasePublicServer);
      data = fallbackResponse.data;
      error = fallbackResponse.error;
    }

    if (error) {
      if (isMissingContentTableError(error)) {
        return {
          ...DEFAULT_HOMEPAGE_CONTENT,
          storageReady: false,
        };
      }

      throw new Error(error.message);
    }

    const rows = ((data || []) as SiteContentRow[]).reduce<Record<string, Record<string, unknown>>>((acc, row) => {
      if (row.key && row.content) {
        acc[row.key] = row.content;
      }
      return acc;
    }, {});

    return {
      hero: mergeObject(DEFAULT_HOMEPAGE_CONTENT.hero, rows["homepage.hero"]),
      banner: mergeObject(DEFAULT_HOMEPAGE_CONTENT.banner, rows["homepage.banner"]),
      discovery: mergeObject(DEFAULT_HOMEPAGE_CONTENT.discovery, rows["homepage.discovery"]),
      taxonomy: normalizeTaxonomyContent(rows["homepage.taxonomy"]),
      visibility: normalizeHomepageVisibility(rows["homepage.visibility"]),
      storageReady: true,
    };
  } catch (error) {
    if (isMissingContentTableError(error)) {
      console.warn("[discovery] homepage content controls unavailable, using fallback content");
      return {
        ...DEFAULT_HOMEPAGE_CONTENT,
        storageReady: false,
      };
    }

    console.error("[discovery] homepage content load failed", {
      error: formatRuntimeError(error),
      credentialIssue: isSupabaseCredentialError(error),
      supabase: getSupabaseRuntimeSnapshot(),
    });
    return {
      ...DEFAULT_HOMEPAGE_CONTENT,
      storageReady: false,
    };
  }
}

export async function getEplPublicContent(): Promise<EplPublicContent> {
  try {
    const runQuery = async (client: typeof supabaseAdmin) =>
      client
        .from("site_content_entries")
        .select("key, content")
        .in("key", [...EPL_PUBLIC_CONTENT_KEYS])
        .eq("is_active", true);

    let { data, error } = await runQuery(supabaseAdmin);

    if (error && isSupabaseCredentialError(error)) {
      const fallbackResponse = await runQuery(supabasePublicServer);
      data = fallbackResponse.data;
      error = fallbackResponse.error;
    }

    if (error) {
      if (isMissingContentTableError(error)) {
        return {
          ...DEFAULT_EPL_PUBLIC_CONTENT,
          storageReady: false,
        };
      }

      throw new Error(error.message);
    }

    const rows = ((data || []) as SiteContentRow[]).reduce<Record<string, Record<string, unknown>>>((acc, row) => {
      if (row.key && row.content) {
        acc[row.key] = row.content;
      }
      return acc;
    }, {});

    return {
      hero: mergeObject(DEFAULT_EPL_PUBLIC_CONTENT.hero, rows["epl.hero"]),
      sections: mergeObject(DEFAULT_EPL_PUBLIC_CONTENT.sections, rows["epl.sections"]),
      menu: normalizeEplMenu(rows["epl.menu"]),
      storageReady: true,
    };
  } catch (error) {
    if (isMissingContentTableError(error)) {
      console.warn("[epl] public content controls unavailable, using fallback content");
      return {
        ...DEFAULT_EPL_PUBLIC_CONTENT,
        storageReady: false,
      };
    }

    console.error("[epl] public content load failed", {
      error: formatRuntimeError(error),
      credentialIssue: isSupabaseCredentialError(error),
      supabase: getSupabaseRuntimeSnapshot(),
    });
    return {
      ...DEFAULT_EPL_PUBLIC_CONTENT,
      storageReady: false,
    };
  }
}

export async function getPublicModulesContent(): Promise<PublicModules> {
  try {
    const runQuery = async (client: typeof supabaseAdmin) =>
      client
        .from("site_content_entries")
        .select("key, content")
        .in("key", [...PUBLIC_MODULE_CONTENT_KEYS])
        .eq("is_active", true);

    let { data, error } = await runQuery(supabaseAdmin);

    if (error && isSupabaseCredentialError(error)) {
      const fallbackResponse = await runQuery(supabasePublicServer);
      data = fallbackResponse.data;
      error = fallbackResponse.error;
    }

    if (error) {
      if (isMissingContentTableError(error)) {
        return {
          ...DEFAULT_PUBLIC_MODULES,
          storageReady: false,
        };
      }

      throw new Error(error.message);
    }

    const rows = ((data || []) as SiteContentRow[]).reduce<Record<string, Record<string, unknown>>>((acc, row) => {
      if (row.key && row.content) {
        acc[row.key] = row.content;
      }
      return acc;
    }, {});

    return {
      ...normalizePublicModules(rows["public.modules"]),
      storageReady: true,
    };
  } catch (error) {
    if (isMissingContentTableError(error)) {
      console.warn("[public-modules] content controls unavailable, using fallback content");
      return {
        ...DEFAULT_PUBLIC_MODULES,
        storageReady: false,
      };
    }

    console.error("[public-modules] content load failed", {
      error: formatRuntimeError(error),
      credentialIssue: isSupabaseCredentialError(error),
      supabase: getSupabaseRuntimeSnapshot(),
    });
    return {
      ...DEFAULT_PUBLIC_MODULES,
      storageReady: false,
    };
  }
}
