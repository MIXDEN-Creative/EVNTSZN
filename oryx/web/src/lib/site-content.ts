import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSupabaseRuntimeSnapshot, isSupabaseCredentialError } from "@/lib/runtime-env";

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
    eyebrow: "EVNTSZN live discovery",
    title: "Find the night, the match, the concert, or the city plan worth moving on.",
    description:
      "EVNTSZN helps people find the strongest nightlife, live music, sports, league energy, and things to do across Baltimore, Atlanta, Miami, New York, DC, and the next city up.",
    primaryCtaLabel: "Start discovering",
    primaryCtaHref: "/events",
    secondaryCtaLabel: "Create attendee account",
    secondaryCtaHref: "/account/login?mode=signup&next=/account",
    tertiaryCtaLabel: "Member login",
    tertiaryCtaHref: "/account/login?next=/account",
  },
  banner: {
    eyebrow: "Built for real nights out",
    title: "Discover what is actually happening without digging through junk.",
    body: "Search the city fast, surface the strongest listings first, and move from discovery to account, tickets, and league action without getting pulled into clutter.",
  },
  discovery: {
    headline: "Search the city and get to the best options fast.",
    body: "Search nightlife, concerts, sports, live entertainment, and things to do right now. EVNTSZN leads with its own premium inventory first, then expands into the city's broader pulse when you want more range.",
    disclosure:
      "EVNTSZN-led inventory still gets priority. External discovery only widens the field when it actually helps the search.",
    searchPlaceholder: "Search artist, event, venue, vibe, or something happening tonight",
    keywordPlaceholder: "Keyword",
    cityPlaceholder: "City",
    nativeHeadline: "Official EVNTSZN events",
    hostHeadline: "EVNTSZN Host events",
    independentHeadline: "Independent Organizer events",
    externalHeadline: "Expanded city discovery",
  },
  taxonomy: {
    categories: [
      {
        title: "Music",
        description: "Concerts, DJ nights, artist drops, and live performances.",
      },
      {
        title: "Nightlife",
        description: "Late-night sessions, premium parties, and city after-dark experiences.",
      },
      {
        title: "Sports",
        description: "League nights, sports entertainment, tournaments, and fan experiences.",
      },
      {
        title: "Things to Do",
        description: "Curated city energy for people looking for the best events right now.",
      },
    ],
    cities: [
      {
        name: "New York",
        description: "Flagship market for high-density nightlife, entertainment, and premium event discovery.",
      },
      {
        name: "Baltimore",
        description: "League, culture, and city-community events with EVNTSZN-native energy.",
      },
      {
        name: "Atlanta",
        description: "Music, nightlife, sports culture, and standout hosted experiences.",
      },
      {
        name: "Miami",
        description: "High-velocity nightlife and destination-event demand.",
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
    eyebrow: "EVNTSZN Prime League",
    title: "A city-built coed league with draft-night energy and premium presentation.",
    description:
      "EPL brings registration, team identity, schedule momentum, and sports-entertainment polish into one public league surface built for players, fans, and city energy.",
    primaryCtaLabel: "Register",
    primaryCtaHref: "/epl/season-1/register",
    secondaryCtaLabel: "View Schedule",
    secondaryCtaHref: "#schedule",
  },
  sections: {
    seasonHeadline: "Season 1 is built to feel organized, competitive, and alive.",
    seasonBody:
      "Structured registration, player review, draft-night presentation, and team identity make EPL feel like a real league product instead of a one-off rec run.",
    scheduleHeadline: "Schedule visibility that supports players, fans, and weekly momentum.",
    scheduleBody:
      "Use the public league page as the clean front door for season rhythm, marquee matchups, and the nights that define the table.",
    teamsHeadline: "Six teams. Strong identity. Real city pull.",
    teamsBody:
      "Canton Chargers, Federal Hill Sentinels, Fells Point Raiders, Hampden Rebels, Harbor Titans, and Mount Vernon Royals drive the league's competitive personality.",
    standingsHeadline: "Standings that make every week matter.",
    standingsBody:
      "The public league surface is built to support competitive tension, weekly movement, and a table that fans can actually follow.",
    storeHeadline: "League merch should feel collectible, not generic.",
    storeBody:
      "The EPL store keeps branded gear, drop moments, and team identity aligned with the same premium EVNTSZN presentation standard.",
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
    headline: "Move through the strongest nights, venues, and city moments without wasting time.",
    body: "Use EVNTSZN to start with the strongest city pulse first, then widen the search when you want more range.",
  },
  teamBlocks: {
    scheduleHeadline: "Team schedule",
    scheduleBody: "Official fixtures and weekly match rhythm will lock here as the season schedule publishes.",
    rosterHeadline: "Roster",
    rosterBody: "Final rosters and player identity will surface here once registration, draft movement, and confirmations are complete.",
    announcementsHeadline: "Announcements",
    announcementsBody: "Team news, league updates, and match-day notes stack here once the season cycle is active.",
  },
  storePromo: {
    eyebrow: "Merchandise",
    headline: "Official EPL merch with real product drops, not filler blocks.",
    body: "Run featured products, collection visibility, and store messaging from the dashboard while Printful stays behind the order flow.",
    ctaLabel: "Open store",
    ctaHref: "/epl/store",
  },
  sponsorBlock: {
    eyebrow: "Presented with",
    headline: "Sponsors and partners can go live across EVNTSZN once placements are actually ready.",
    body: "Only approved, active placements render publicly, with dashboard control over dates, locations, and order priority.",
    footerHeadline: "Trusted by sponsors, partners, and city builders who are live in the system.",
  },
  opportunitiesBlock: {
    eyebrow: "Opportunities",
    headline: "Open EPL roles stay visible here while hiring stays inside the dashboard pipeline.",
    body: "Publish only the roles you need now, then move applicants through review, interviews, and decisions without leaving the operating layer.",
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
    const { data, error } = await supabaseAdmin
      .from("site_content_entries")
      .select("key, content")
      .in("key", [...HOMEPAGE_CONTENT_KEYS])
      .eq("is_active", true);

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
      error,
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
    const { data, error } = await supabaseAdmin
      .from("site_content_entries")
      .select("key, content")
      .in("key", [...EPL_PUBLIC_CONTENT_KEYS])
      .eq("is_active", true);

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
      error,
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
    const { data, error } = await supabaseAdmin
      .from("site_content_entries")
      .select("key, content")
      .in("key", [...PUBLIC_MODULE_CONTENT_KEYS])
      .eq("is_active", true);

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
      error,
      credentialIssue: isSupabaseCredentialError(error),
      supabase: getSupabaseRuntimeSnapshot(),
    });
    return {
      ...DEFAULT_PUBLIC_MODULES,
      storageReady: false,
    };
  }
}
