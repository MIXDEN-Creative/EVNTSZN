import { supabaseAdmin } from "@/lib/supabase-admin";

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

type SiteContentRow = {
  key: string;
  content: Record<string, unknown> | null;
};

export type HomepageContent = {
  hero: HomepageHeroContent;
  banner: HomepageBannerContent;
  discovery: HomepageDiscoveryContent;
  taxonomy: HomepageTaxonomyContent;
  storageReady: boolean;
};

const HOMEPAGE_CONTENT_KEYS = [
  "homepage.hero",
  "homepage.banner",
  "homepage.discovery",
  "homepage.taxonomy",
] as const;

export const DEFAULT_HOMEPAGE_CONTENT: Omit<HomepageContent, "storageReady"> = {
  hero: {
    eyebrow: "EVNTSZN discovery",
    title: "A premium discovery surface for the events people actually move on.",
    description:
      "Discover EVNTSZN-native events first, explore broader city demand intelligently, and move from public discovery into a premium member experience without losing trust, clarity, or momentum.",
    primaryCtaLabel: "Explore EVNTSZN events",
    primaryCtaHref: "/events",
    secondaryCtaLabel: "Open discovery",
    secondaryCtaHref: "/events",
    tertiaryCtaLabel: "Member access",
    tertiaryCtaHref: "/account/login?next=/account",
  },
  banner: {
    eyebrow: "Premium access",
    title: "EVNTSZN keeps discovery public and operations controlled.",
    body: "Attendees can explore EVNTSZN openly while scanner, league, admin, HQ, and operations surfaces stay clearly separated and purpose-built.",
  },
  discovery: {
    headline: "Start with EVNTSZN. Expand with market-scale discovery.",
    body: "Native EVNTSZN inventory stays primary. External discovery adds breadth when you want a wider city pulse without diluting the platform.",
    disclosure:
      "Broader event discovery is available when you search for it. EVNTSZN native inventory remains the primary path and featured layer.",
    searchPlaceholder: "Search events, artists, moments",
    cityPlaceholder: "City",
    nativeHeadline: "Featured EVNTSZN events",
    hostHeadline: "EVNTSZN Host events",
    independentHeadline: "Independent Organizer events",
    externalHeadline: "External discovery, handled carefully",
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

    console.error("[discovery] homepage content load failed", error);
    return {
      ...DEFAULT_HOMEPAGE_CONTENT,
      storageReady: false,
    };
  }
}
