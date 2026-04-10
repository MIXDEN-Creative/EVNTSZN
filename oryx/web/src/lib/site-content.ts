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
    eyebrow: "Live City Pulse",
    title: "Don't just go out. Land exactly where the energy is.",
    description:
      "Access the city's most exclusive nights, headline concerts, and high-stakes sports. We connect you to the moments that define the season.",
    primaryCtaLabel: "Explore the movement",
    primaryCtaHref: "/events",
    secondaryCtaLabel: "Claim your access",
    secondaryCtaHref: "/account/login?mode=signup&next=/account",
    tertiaryCtaLabel: "Member Login",
    tertiaryCtaHref: "/account/login?next=/account",
  },
  banner: {
    eyebrow: "The Premium Standard",
    title: "Stop searching. Start arriving.",
    body: "EVNTSZN surfaces the city's strongest moves first. From the initial discovery to the final ticket, we keep the path clean so you never miss a beat.",
  },
  discovery: {
    headline: "The city is moving. Find your next move.",
    body: "Filter for the elite experiences—nightlife, concerts, and sports that define the city calendar. We prioritize exclusive EVNTSZN events so you get the strongest options first.",
    disclosure:
      "Priority is given to EVNTSZN-native events to ensure the highest quality experience.",
    searchPlaceholder: "Search artist, venue, vibe, or the night's headline event",
    keywordPlaceholder: "Keyword",
    cityPlaceholder: "City",
    nativeHeadline: "Featured EVNTSZN Events",
    hostHeadline: "Hosted Experiences",
    independentHeadline: "Independent Organizers",
    externalHeadline: "Extended City Discovery",
  },
  taxonomy: {
    categories: [
      {
        title: "Music",
        description: "Headline performances, artist drops, and the city's best live sessions.",
      },
      {
        title: "Nightlife",
        description: "Premium sessions and exclusive after-dark energy.",
      },
      {
        title: "Sports",
        description: "League nights, high-stakes competition, and fan-driven momentum.",
      },
      {
        title: "Curated",
        description: "Hand-picked city energy for those who demand the best.",
      },
    ],
    cities: [
      {
        name: "New York",
        description: "The global standard for nightlife and headline entertainment.",
      },
      {
        name: "Baltimore",
        description: "League pride and community-rooted events with real momentum.",
      },
      {
        name: "Atlanta",
        description: "The heartbeat of music, sports culture, and hosted vibes.",
      },
      {
        name: "Miami",
        description: "High-velocity energy and destination-defining events.",
      },
      {
        name: "Dover",
        description: "Clean, premium access to local leagues and community discovery.",
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
    eyebrow: "Elite Competition",
    title: "More than a league. A Baltimore legacy in the making.",
    description:
      "Forge your team's identity, track the standings, and command the field. Season 1 starts now—don't just watch the game, own it.",
    primaryCtaLabel: "Join the Ranks",
    primaryCtaHref: "/epl/season-1/register",
    secondaryCtaLabel: "View the Schedule",
    secondaryCtaHref: "#schedule",
  },
  sections: {
    seasonHeadline: "Forged in Baltimore. Built for the Bold.",
    seasonBody:
      "From draft night to the championship stretch, every snap carries the weight of city pride and team identity. This is where athletes become legends.",
    scheduleHeadline: "The Road to the Title.",
    scheduleBody:
      "Follow the rivalries, the statement nights, and the games that will define the season. No guessing, just momentum.",
    teamsHeadline: "Six Teams. One Throne.",
    teamsBody:
      "Every team carries a neighborhood edge and a drive to dominate. Choose your side and follow the journey.",
    standingsHeadline: "Where Respect is Earned.",
    standingsBody:
      "The table never lies. Track every win, every loss, and the relentless pursuit of the top spot.",
    storeHeadline: "Wear the Pride.",
    storeBody:
      "Elite gear for players and supporters. Shop official EPL drops built for the field and the street.",
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
    eyebrow: "City Spotlight",
    headline: "Move through the strongest nights without wasting a second.",
    body: "We surface the city's pulse so you can spend less time searching and more time arriving.",
  },
  teamBlocks: {
    scheduleHeadline: "Match Rhythm",
    scheduleBody: "The official path to the playoffs locks here as the season goes live.",
    rosterHeadline: "The Roster",
    rosterBody: "The elite lineup of players ready to represent their colors this season.",
    announcementsHeadline: "League Pulse",
    announcementsBody: "Real-time updates, scouting notes, and game-day intel for the inner circle.",
  },
  storePromo: {
    eyebrow: "Official Gear",
    headline: "EPL Signature Collection.",
    body: "Club-inspired drops and league-standard gear built for those who show up.",
    ctaLabel: "Shop the Drop",
    ctaHref: "/epl/store",
  },
  sponsorBlock: {
    eyebrow: "Backed by the Best",
    headline: "Partners in Progress.",
    body: "The brands and city builders showing up to power the season.",
    footerHeadline: "Trusted by the city's most influential partners.",
  },
  opportunitiesBlock: {
    eyebrow: "Own the Sideline",
    headline: "Drive the Season from the Inside.",
    body: "Get closer to the pulse. From high-stakes game-day operations to capturing the city’s loudest moments, this is your seat at the table. Don’t just watch the season—command it.",
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
