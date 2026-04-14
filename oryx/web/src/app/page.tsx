import type { Metadata } from "next";
import Script from "next/script";
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";
import DiscoveryLanding from "@/components/public/DiscoveryLanding";
import { getDiscoveryNativeEvents, groupDiscoveryEventsBySource } from "@/lib/discovery";
import { applyExternalDiscoveryControls } from "@/lib/external-discovery-controls";
import {
  DEFAULT_HOMEPAGE_CONTENT,
  DEFAULT_PUBLIC_MODULES,
  getHomepageContent,
  getPublicModulesContent,
} from "@/lib/site-content";
import { getEventbriteShowcase } from "@/lib/eventbrite";
import { getTicketmasterShowcase } from "@/lib/ticketmaster";
import { getWebOrigin } from "@/lib/domains";
import { getPublicSponsorPlacements } from "@/lib/sponsor-placements";
import { safePublicLoad } from "@/lib/public-safe-load";

export const metadata: Metadata = {
  title: "EVNTSZN | Nights out, live games, concerts, and city plans worth showing up for",
  description:
    "Find concerts, nightlife, sports, league nights, and city plans worth leaving home for across Baltimore, Washington, Rehoboth Beach, Ocean City, and Bethany Beach.",
  alternates: {
    canonical: "https://evntszn.com",
  },
  keywords: [
    "events",
    "nightlife",
    "music",
    "sports",
    "live entertainment",
    "things to do",
    "Baltimore events",
    "Washington events",
    "Rehoboth Beach nightlife",
    "Ocean City events",
    "Bethany Beach events",
    "EVNTSZN",
  ],
  openGraph: {
    title: "EVNTSZN | Nights out, live games, concerts, and city plans worth showing up for",
    description:
      "Search concerts, nightlife, sports, and local plans with one clean public guide to what is happening next.",
    url: "https://evntszn.com",
    siteName: "EVNTSZN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EVNTSZN | Nights out, live games, concerts, and city plans worth showing up for",
    description:
      "Find the next concert, game, league night, or night out worth your time with EVNTSZN.",
  },
};

function formatHomepageJsonLd() {
  const origin = getWebOrigin();
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${origin}/#organization`,
        name: "EVNTSZN",
        url: origin,
        logo: `${origin}/favicon.ico`,
        description:
          "EVNTSZN helps people find nights out, live games, concerts, and local plans worth showing up for.",
      },
      {
        "@type": "WebSite",
        "@id": `${origin}/#website`,
        url: origin,
        name: "EVNTSZN",
        potentialAction: {
          "@type": "SearchAction",
          target: `${origin}/?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
}

function dedupeHomepageListings<
  T extends { title: string; city?: string; state?: string; startAt?: string | null }
>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = [item.title, item.city || "", item.state || "", item.startAt?.slice(0, 10) || "unknown"]
      .join("|")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default async function HomePage() {
  const [content, modules, nativeResult, ticketmasterShowcase, eventbriteShowcase, homepagePlacements] = await Promise.all([
    safePublicLoad("homepage-content", () => getHomepageContent(), {
      ...DEFAULT_HOMEPAGE_CONTENT,
      storageReady: false,
    }),
    safePublicLoad("homepage-public-modules", () => getPublicModulesContent(), {
      ...DEFAULT_PUBLIC_MODULES,
      storageReady: false,
    }),
    safePublicLoad("homepage-native-discovery", () => getDiscoveryNativeEvents({ limit: 12 }), {
      events: [],
      storageReady: false,
    }),
    safePublicLoad("homepage-ticketmaster-showcase", async () => applyExternalDiscoveryControls("ticketmaster", await getTicketmasterShowcase()), []),
    safePublicLoad("homepage-eventbrite-showcase", () => getEventbriteShowcase(), []),
    safePublicLoad("homepage-sponsor-placements", () => getPublicSponsorPlacements("homepage"), []),
  ]);

  const externalShowcase = dedupeHomepageListings(
    [...ticketmasterShowcase, ...eventbriteShowcase].map((event) => ({
      ...event,
      city: event.city || undefined,
      state: event.state || undefined,
    })),
  ).slice(0, 12);

  const nativeSections = groupDiscoveryEventsBySource(nativeResult.events);
  const initialPopular = dedupeHomepageListings([
    ...nativeResult.events.slice(0, 4).map((event) => ({
      id: event.id,
      title: event.title,
      href: event.href,
      imageUrl:
        event.imageUrl ||
        "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1800&q=80",
      venue: event.subtitle || event.heroNote || "EVNTSZN listing",
      city: event.city,
      state: event.state,
      startAt: event.startAt,
      source: event.source,
      badgeLabel: event.badgeLabel,
      summary:
        event.description ||
        event.heroNote ||
        `${event.sourceLabel} shaping the city calendar.`,
      isPrimary: true,
      featured: event.featured,
    })),
    ...externalShowcase.slice(0, 8).map((event) => ({
      id: event.id,
      title: event.title,
      href: event.url || "/events",
      imageUrl:
        event.imageUrl ||
        "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1800&q=80",
      venue: event.venueName || "Venue to be announced",
      city: event.city || "",
      state: event.state || "",
      startAt: event.startAt,
      source: event.source,
      badgeLabel: event.source === "ticketmaster" ? "Ticketmaster" : "Eventbrite",
      summary:
        event.description ||
        `${event.venueName || "Live event"}${event.city ? ` · ${event.city}` : ""}`,
      isPrimary: false,
    })),
  ]).slice(0, 8);

  return (
    <main className="min-h-screen bg-black text-white">
      <Script
        id="evntszn-homepage-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(formatHomepageJsonLd()),
        }}
      />
      <PublicNav />
      <DiscoveryLanding
        content={content}
        modules={modules}
        initialPopular={initialPopular}
        initialNativeSections={nativeSections}
        initialExternal={externalShowcase}
        sponsorPlacements={homepagePlacements}
      />
      <PublicFooter />
    </main>
  );
}
