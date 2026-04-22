import PulseActivityBeacon from "@/components/evntszn/PulseActivityBeacon";
import DiscoveryLanding from "@/components/public/DiscoveryLanding";
import PublicPageFrame from "@/components/public/PublicPageFrame";
import { safePublicLoad } from "@/lib/public-safe-load";
import { getDiscoveryNativeEvents, groupDiscoveryEventsBySource, type DiscoveryNativeEvent } from "@/lib/discovery";
import { getReserveVenueListings } from "@/lib/public-directory";
import { getPublicModulesContent, getHomepageContent, DEFAULT_PUBLIC_MODULES, DEFAULT_HOMEPAGE_CONTENT } from "@/lib/site-content";
import { getPublicSponsorPlacements } from "@/lib/sponsor-placements";
import { getTicketmasterShowcase } from "@/lib/ticketmaster";

function mapNativeToListing(event: DiscoveryNativeEvent) {
  return {
    id: event.id,
    title: event.title,
    href: event.href,
    imageUrl: event.imageUrl || "",
    venue: event.subtitle || event.heroNote || "EVNTSZN listing",
    city: event.city,
    state: event.state,
    startAt: event.startAt,
    source: event.source,
    badgeLabel: event.badgeLabel,
    summary: event.description || event.heroNote || `${event.sourceLabel} worth showing up for.`,
    isPrimary: true,
    featured: event.featured,
  };
}

export default async function HomePage() {
  const [content, modules, nativeResponse, reserveVenues, sponsorPlacements, ticketmaster] = await Promise.all([
    safePublicLoad("homepage-content", () => getHomepageContent(), {
      ...DEFAULT_HOMEPAGE_CONTENT,
      storageReady: false,
    }),
    safePublicLoad("homepage-modules", () => getPublicModulesContent(), {
      ...DEFAULT_PUBLIC_MODULES,
      storageReady: false,
    }),
    safePublicLoad("homepage-native-discovery", () => getDiscoveryNativeEvents({ limit: 12 }), {
      events: [],
      storageReady: false,
    }),
    safePublicLoad("homepage-reserve-venues", () => getReserveVenueListings(8), []),
    safePublicLoad("homepage-sponsor-placements", () => getPublicSponsorPlacements("homepage"), []),
    safePublicLoad("homepage-ticketmaster", () => getTicketmasterShowcase(), []),
  ]);

  const nativeSections = groupDiscoveryEventsBySource(nativeResponse.events);
  const initialPopular = [
    ...nativeResponse.events.slice(0, 6).map(mapNativeToListing),
    ...ticketmaster.slice(0, 4).map((event) => ({
      id: event.id,
      title: event.title,
      href: event.url || "/events",
      imageUrl: event.imageUrl || "",
      venue: event.venueName || "Live event",
      city: event.city || "",
      state: event.state || "",
      startAt: event.startAt,
      source: event.source,
      badgeLabel: "Ticketmaster",
      summary: event.description || `${event.venueName || "Event"}${event.city ? ` · ${event.city}` : ""}`,
      isPrimary: false,
    })),
  ];

  return (
    <PublicPageFrame>
      <PulseActivityBeacon sourceType="discover_view" city="Baltimore" referenceType="discover" referenceId="homepage" />
      <DiscoveryLanding
        content={content}
        modules={modules}
        initialPopular={initialPopular}
        initialNativeSections={nativeSections}
        initialExternal={ticketmaster}
        reserveVenues={reserveVenues}
        sponsorPlacements={sponsorPlacements}
      />
    </PublicPageFrame>
  );
}
