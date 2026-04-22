import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import PublicPageFrame from "@/components/public/PublicPageFrame";
import { getReserveOrigin } from "@/lib/domains";
import { getPublishedEventsByCity, getReserveVenuesByCity, getVenueListingsByCity } from "@/lib/public-directory";
import { getPublicCityBySlug, PUBLIC_CITIES } from "@/lib/public-cities";
import { buildCollectionPageSchema, buildItemListSchema, buildPageMetadata } from "@/lib/seo";

type CityOverviewProps = {
  params: Promise<{ citySlug: string }>;
};

export function generateStaticParams() {
  return PUBLIC_CITIES.map((city) => ({ citySlug: city.slug }));
}

export async function generateMetadata({ params }: CityOverviewProps): Promise<Metadata> {
  const { citySlug } = await params;
  const city = getPublicCityBySlug(citySlug);
  if (!city) return {};

  return buildPageMetadata({
    title: `${city.name} events, nightlife, reservations, and venues | EVNTSZN`,
    description: `Search ${city.name} events, nightlife, reservations, lounges, brunch spots, and venues through EVNTSZN's city guide.`,
    path: `/city/${city.slug}`,
    image: city.heroImage,
    keywords: [
      `${city.name} events`,
      `${city.name} nightlife`,
      `${city.name} reservations`,
      `${city.name} venues`,
      `things to do in ${city.name}`,
      `EVNTSZN ${city.name}`,
    ],
  });
}

export default async function CityOverviewPage({ params }: CityOverviewProps) {
  const { citySlug } = await params;
  const city = getPublicCityBySlug(citySlug);
  if (!city) notFound();

  const [events, reserveVenues, venues] = await Promise.all([
    getPublishedEventsByCity(city.slug, 6),
    getReserveVenuesByCity(city.slug, 6),
    getVenueListingsByCity(city.slug, 6),
  ]);

  const structuredData = [
    buildCollectionPageSchema({
      name: `${city.name} experiences on EVNTSZN`,
      description: city.experienceBlurb,
      path: `/city/${city.slug}`,
    }),
    buildItemListSchema({
      name: `${city.name} EVNTSZN city pages`,
      path: `/city/${city.slug}`,
      items: [
        { name: `${city.name} events`, url: `/city/${city.slug}/events` },
        { name: `${city.name} nightlife`, url: `/city/${city.slug}/nightlife` },
        { name: `${city.name} reservations`, url: `/city/${city.slug}/reservations` },
        { name: `${city.name} venues`, url: `/city/${city.slug}/venues` },
      ],
    }),
  ];

  const sections = [
    {
      title: `${city.name} events`,
      href: `/city/${city.slug}/events`,
      description: city.eventsIntro,
      cta: `Browse ${city.name} events`,
    },
    {
      title: `${city.name} nightlife`,
      href: `/city/${city.slug}/nightlife`,
      description: city.nightlifeIntro,
      cta: `See ${city.name} nightlife`,
    },
    {
      title: `${city.name} reservations`,
      href: `/city/${city.slug}/reservations`,
      description: city.reservationsIntro,
      cta: `Search ${city.name} reservations`,
    },
    {
      title: `${city.name} venues`,
      href: `/city/${city.slug}/venues`,
      description: city.venuesIntro,
      cta: `Explore ${city.name} venues`,
    },
  ];

  return (
    <PublicPageFrame
      title={`${city.name} experiences on EVNTSZN`}
      description={city.experienceBlurb}
      heroImage={city.heroImage}
      breadcrumbs={[
        { name: "Home", path: "/" },
        { name: "Cities", path: "/city" },
        { name: city.name, path: `/city/${city.slug}` },
      ]}
      structuredData={structuredData}
    >
      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {sections.map((section) => (
            <Link key={section.href} href={section.href} className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6 transition hover:border-white/20 hover:bg-white/[0.06]">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#caa7ff]">Search ownership</div>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-white">{section.title}</h2>
              <p className="mt-4 text-sm leading-7 text-white/70">{section.description}</p>
              <div className="mt-6 text-sm font-semibold text-white">{section.cta}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10 md:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#caa7ff]">Events live now</div>
            <div className="mt-4 space-y-4">
              {events.length ? (
                events.map((event) => (
                  <Link key={event.id} href={`/events/${event.slug}`} className="block rounded-2xl border border-white/10 bg-black/20 p-4 hover:border-white/20">
                    <div className="text-sm font-semibold text-white">{event.title}</div>
                    <div className="mt-1 text-sm text-white/60">{event.venueName}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/40">
                      {event.startAt ? new Date(event.startAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Date coming soon"}
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-sm text-white/60">EVNTSZN is building the live event inventory for {city.name} now.</div>
              )}
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#caa7ff]">Reserve-ready venues</div>
            <div className="mt-4 space-y-4">
              {reserveVenues.length ? (
                reserveVenues.map((venue) => (
                <Link key={venue.slug} href={`/reserve/${venue.slug}`} className="block rounded-2xl border border-white/10 bg-black/20 p-4 hover:border-white/20">
                    <div className="text-sm font-semibold text-white">{venue.name}</div>
                    <div className="mt-1 text-sm text-white/60">
                      Waitlist {venue.reserveSettings?.waitlist_enabled === false ? "off" : "on"} · max party {venue.reserveSettings?.max_party_size || 8}
                    </div>
                  </Link>
                ))
              ) : (
                <Link href={`/reserve/${city.slug}`} className="block rounded-2xl border border-white/10 bg-black/20 p-4 hover:border-white/20">
                  <div className="text-sm font-semibold text-white">Search Reserve in {city.name}</div>
                  <div className="mt-1 text-sm text-white/60">See who is taking reservations, brunch bookings, and nightlife table requests.</div>
                </Link>
              )}
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#caa7ff]">Top venues nearby</div>
            <div className="mt-4 space-y-4">
              {venues.length ? (
                venues.map((venue) => (
                  <div key={venue.slug} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="text-sm font-semibold text-white">{venue.name}</div>
                    <div className="mt-1 text-sm text-white/60">
                      {venue.isReserveActive ? "Reserve available" : "Event venue on EVNTSZN"}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs uppercase tracking-[0.18em] text-white/48">
                      <Link href={`/city/${city.slug}/venues`} className="hover:text-white/80">Explore in {city.name}</Link>
                      {venue.isReserveActive ? <Link href={`/reserve/${venue.slug}`} className="hover:text-white/80">Reserve</Link> : null}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-white/60">Venue discovery expands as EVNTSZN listings and Reserve placements grow in {city.name}.</div>
              )}
            </div>
          </div>
        </div>
      </section>
    </PublicPageFrame>
  );
}
