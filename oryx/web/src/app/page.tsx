import type { Metadata } from "next";
import Script from "next/script";
import DiscoveryLanding from "@/components/public/DiscoveryLanding";
import { getDiscoveryNativeEvents, groupDiscoveryEventsBySource } from "@/lib/discovery";
import { getWebOrigin } from "@/lib/domains";
import { getHomepageContent } from "@/lib/site-content";
import { searchTicketmasterEvents } from "@/lib/ticketmaster";

export async function generateMetadata(): Promise<Metadata> {
  const homepage = await getHomepageContent();
  const title = "Nightlife, music, sports, entertainment, and things to do in Baltimore, Atlanta, Miami, New York, and beyond";
  const description =
    "Discover premium EVNTSZN events, hosted experiences, nightlife, sports, music, and city energy through a cinematic event platform built for discovery, tickets, and momentum.";

  return {
    title,
    description,
    alternates: {
      canonical: "/",
    },
    openGraph: {
      title: `EVNTSZN | ${title}`,
      description,
      url: "/",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `EVNTSZN | ${title}`,
      description,
    },
    keywords: [
      "events",
      "event discovery",
      "nightlife",
      "music events",
      "sports events",
      "entertainment",
      "things to do",
      "Baltimore events",
      "Atlanta events",
      "Miami events",
      "New York events",
      "premium event platform",
      "EVNTSZN",
      homepage.hero.title,
    ],
  };
}

export default async function HomePage() {
  const [homepage, nativeResult, externalShowcase] = await Promise.all([
    getHomepageContent(),
    getDiscoveryNativeEvents({ limit: 12 }),
    searchTicketmasterEvents({ size: 6 }).catch(() => []),
  ]);

  const groupedNative = groupDiscoveryEventsBySource(nativeResult.events);
  const heroImage =
    externalShowcase.find((event) => event.imageUrl)?.imageUrl ||
    null;

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "EVNTSZN",
    url: getWebOrigin(),
    description:
      "Premium event discovery, ticketing, scanning, and operations across EVNTSZN-native events, hosted experiences, nightlife, sports, music, and city energy.",
    sameAs: [getWebOrigin()],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "EVNTSZN",
    url: getWebOrigin(),
    description: homepage.discovery.body,
    potentialAction: {
      "@type": "SearchAction",
      target: `${getWebOrigin()}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const featuredItemsSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Featured EVNTSZN discovery listings",
    itemListElement: nativeResult.events.slice(0, 8).map((event, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${getWebOrigin()}${event.href}`,
      name: event.title,
    })),
  };

  return (
    <>
      <Script
        id="evntszn-homepage-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([organizationSchema, websiteSchema, featuredItemsSchema]),
        }}
      />
      <main className="ev-surface ev-surface--web">
        <DiscoveryLanding
          hero={homepage.hero}
          banner={homepage.banner}
          discovery={homepage.discovery}
          taxonomy={homepage.taxonomy}
          visibility={homepage.visibility}
          groupedNativeEvents={groupedNative}
          externalShowcase={externalShowcase}
          heroImage={heroImage}
        />
      </main>
    </>
  );
}
