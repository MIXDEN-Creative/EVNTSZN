import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import SurfaceShell from "@/components/shells/SurfaceShell";
import DiscoveryLanding from "@/components/public/DiscoveryLanding";
import { getDiscoveryNativeEvents } from "@/lib/discovery";
import { getWebOrigin } from "@/lib/domains";
import { getHomepageContent } from "@/lib/site-content";

export async function generateMetadata(): Promise<Metadata> {
  const homepage = await getHomepageContent();
  const title = "Discover premium events, nightlife, sports, music, and things to do";
  const description = homepage.hero.description;

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
      "things to do",
      "nightlife",
      "sports events",
      "music events",
      "city event discovery",
      "premium event platform",
      "EVNTSZN",
    ],
  };
}

export default async function Home() {
  const [homepage, featuredResult] = await Promise.all([
    getHomepageContent(),
    getDiscoveryNativeEvents({ limit: 12 }),
  ]);

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "EVNTSZN",
    url: getWebOrigin(),
    description:
      "Premium event discovery, ticketing, scanning, and operations across EVNTSZN-native, hosted, and selected partner inventory.",
    sameAs: [getWebOrigin()],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "EVNTSZN",
    url: getWebOrigin(),
    description: homepage.discovery.body,
  };

  const featuredItemsSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Featured EVNTSZN discovery listings",
    itemListElement: featuredResult.events.slice(0, 8).map((event, index) => ({
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
      <SurfaceShell
        surface="web"
        eyebrow={homepage.hero.eyebrow}
        title={homepage.hero.title}
        description={homepage.hero.description}
        actions={
          <>
            <Link href={homepage.hero.primaryCtaHref} className="ev-button-primary">
              {homepage.hero.primaryCtaLabel}
            </Link>
            <Link href={homepage.hero.secondaryCtaHref} className="ev-button-secondary">
              {homepage.hero.secondaryCtaLabel}
            </Link>
            <Link href={homepage.hero.tertiaryCtaHref} className="ev-button-secondary">
              {homepage.hero.tertiaryCtaLabel}
            </Link>
          </>
        }
        meta={
          <>
            <div className="ev-meta-card">
              <div className="ev-meta-label">Discovery hierarchy</div>
              <div className="ev-meta-value">
                EVNTSZN events lead, hosted experiences stay elevated, independent organizers remain clear, and external discovery expands breadth without hijacking priority.
              </div>
            </div>
            <div className="ev-meta-card">
              <div className="ev-meta-label">Operational control</div>
              <div className="ev-meta-value">
                Staff, ops, scanner, admin, HQ, and league operations stay inside their own guarded EVNTSZN surfaces.
              </div>
            </div>
          </>
        }
      >
        <DiscoveryLanding
          featuredNativeEvents={featuredResult.events}
          banner={homepage.banner}
          discovery={homepage.discovery}
          taxonomy={homepage.taxonomy}
        />
      </SurfaceShell>
    </>
  );
}
