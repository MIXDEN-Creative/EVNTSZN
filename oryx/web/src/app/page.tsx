import type { Metadata } from "next";
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";
import DiscoveryLanding from "@/components/public/DiscoveryLanding";
import StructuredData from "@/components/seo/StructuredData";
import { getDiscoveryNativeEvents, groupDiscoveryEventsBySource } from "@/lib/discovery";
import { applyExternalDiscoveryControls } from "@/lib/external-discovery-controls";
import { getReserveVenueListings } from "@/lib/public-directory";
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
import { buildOrganizationSchema } from "@/lib/seo";

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
    images: [{ url: "https://evntszn.com/brand/eplhero.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "EVNTSZN | Nights out, live games, concerts, and city plans worth showing up for",
    description:
      "Find the next concert, game, league night, or night out worth your time with EVNTSZN.",
    images: ["https://evntszn.com/brand/eplhero.png"],
  },
};

function formatHomepageJsonLd() {
  return buildOrganizationSchema();
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
  const [content, modules, nativeResult, ticketmasterShowcase, eventbriteShowcase, homepagePlacements, reserveVenues] = await Promise.all([
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
    safePublicLoad("homepage-reserve-venues", () => getReserveVenueListings(8), []),
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
    <main className="ev-public-page bg-black text-white">
      <StructuredData id="evntszn-homepage-structured-data" data={formatHomepageJsonLd()} />
      <PublicNav />
      <DiscoveryLanding
        content={content}
        modules={modules}
        initialPopular={initialPopular}
        initialNativeSections={nativeSections}
        initialExternal={externalShowcase}
        reserveVenues={reserveVenues}
        sponsorPlacements={homepagePlacements}
      />
      <PublicFooter />
    </main>
  );
}
