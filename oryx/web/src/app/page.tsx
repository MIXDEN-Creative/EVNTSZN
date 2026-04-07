import type { Metadata } from "next";
import Script from "next/script";
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";
import DiscoveryLanding from "@/components/public/DiscoveryLanding";
import { getDiscoveryNativeEvents, groupDiscoveryEventsBySource } from "@/lib/discovery";
import { getHomepageContent } from "@/lib/site-content";
import { getTicketmasterShowcase } from "@/lib/ticketmaster";
import { getWebOrigin } from "@/lib/domains";

export const metadata: Metadata = {
  title: "EVNTSZN | Discover nightlife, live music, sports, and the best things to do",
  description:
    "Discover nightlife, live music, sports, draft night energy, and the best things to do in Baltimore, Atlanta, Miami, New York, and DC with EVNTSZN.",
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
    "Atlanta events",
    "Miami events",
    "New York nightlife",
    "DC events",
    "EVNTSZN",
  ],
  openGraph: {
    title: "EVNTSZN | Discover nightlife, live music, sports, and the best things to do",
    description:
      "Search nightlife, concerts, sports, city energy, and the strongest live plans with EVNTSZN’s premium public discovery experience.",
    url: "https://evntszn.com",
    siteName: "EVNTSZN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EVNTSZN | Discover nightlife, live music, sports, and the best things to do",
    description:
      "Find the best things to do in Baltimore, Atlanta, Miami, New York, DC, and beyond with EVNTSZN.",
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
          "EVNTSZN is a premium event discovery platform for nightlife, music, sports, and live entertainment.",
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

export default async function HomePage() {
  const [content, nativeResult, externalShowcase] = await Promise.all([
    getHomepageContent(),
    getDiscoveryNativeEvents({ limit: 12 }),
    getTicketmasterShowcase().catch(() => []),
  ]);

  const nativeSections = groupDiscoveryEventsBySource(nativeResult.events);
  const initialPopular = [
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
      source: "ticketmaster" as const,
      badgeLabel: "External listing",
      summary:
        "Broader city demand pulled into EVNTSZN discovery without crowding out EVNTSZN-led inventory.",
      isPrimary: false,
    })),
  ].slice(0, 8);

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
        initialPopular={initialPopular}
        initialNativeSections={nativeSections}
        initialExternal={externalShowcase}
      />
      <PublicFooter />
    </main>
  );
}
