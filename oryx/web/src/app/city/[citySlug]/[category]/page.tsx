import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import PublicPageFrame from "@/components/public/PublicPageFrame";
import { getReserveOrigin } from "@/lib/domains";
import {
  getNightlifeEventsByCity,
  getPublishedEventsByCity,
  getReserveVenuesByCity,
  getVenueListingsByCity,
} from "@/lib/public-directory";
import { getPublicCityBySlug, PUBLIC_CITIES } from "@/lib/public-cities";
import {
  buildCollectionPageSchema,
  buildItemListSchema,
  buildPageMetadata,
} from "@/lib/seo";

type CityCategoryPageProps = {
  params: Promise<{ citySlug: string; category: string }>;
};

const CATEGORY_ORDER = ["events", "nightlife", "reservations", "venues"] as const;
type CategorySlug = (typeof CATEGORY_ORDER)[number];

const CATEGORY_COPY: Record<
  CategorySlug,
  {
    suffix: string;
    description: (cityName: string) => string;
  }
> = {
  events: {
    suffix: "events",
    description: (cityName) => `Search ${cityName} events, concerts, parties, sports nights, and city plans on EVNTSZN.`,
  },
  nightlife: {
    suffix: "nightlife",
    description: (cityName) => `Discover ${cityName} nightlife, lounges, parties, brunch moves, and after-dark rooms on EVNTSZN.`,
  },
  reservations: {
    suffix: "reservations",
    description: (cityName) => `Find ${cityName} reservations, brunch bookings, dinner plans, and nightlife table options on EVNTSZN Reserve.`,
  },
  venues: {
    suffix: "venues",
    description: (cityName) => `Browse ${cityName} venues, Reserve-ready places, and event rooms across EVNTSZN.`,
  },
};

function isCategory(value: string): value is CategorySlug {
  return CATEGORY_ORDER.includes(value as CategorySlug);
}

export function generateStaticParams() {
  return PUBLIC_CITIES.flatMap((city) => CATEGORY_ORDER.map((category) => ({ citySlug: city.slug, category })));
}

export async function generateMetadata({ params }: CityCategoryPageProps): Promise<Metadata> {
  const { citySlug, category } = await params;
  const city = getPublicCityBySlug(citySlug);
  if (!city || !isCategory(category)) return {};

  return buildPageMetadata({
    title: `${city.name} ${CATEGORY_COPY[category].suffix} | EVNTSZN`,
    description: CATEGORY_COPY[category].description(city.name),
    path: `/city/${city.slug}/${category}`,
    image: city.heroImage,
    keywords: [
      `${city.name} ${category}`,
      `${category} near me`,
      `${city.name} things to do`,
      `${city.name} nightlife`,
      `${city.name} reservations`,
      `EVNTSZN ${city.name}`,
    ],
  });
}

export default async function CityCategoryPage({ params }: CityCategoryPageProps) {
  const { citySlug, category } = await params;
  const city = getPublicCityBySlug(citySlug);
  if (!city || !isCategory(category)) notFound();

  const [events, nightlife, reserveVenues, venues] = await Promise.all([
    getPublishedEventsByCity(city.slug, 18),
    getNightlifeEventsByCity(city.slug, 18),
    getReserveVenuesByCity(city.slug, 18),
    getVenueListingsByCity(city.slug, 18),
  ]);

  const pageTitle = `${city.name} ${CATEGORY_COPY[category].suffix} on EVNTSZN`;
  const pageDescription =
    category === "events"
      ? city.eventsIntro
      : category === "nightlife"
        ? city.nightlifeIntro
        : category === "reservations"
          ? city.reservationsIntro
          : city.venuesIntro;

  const listItems =
    category === "events"
      ? events.map((event) => ({ name: event.title, url: `/events/${event.slug}`, image: event.imageUrl, startDate: event.startAt }))
      : category === "nightlife"
        ? nightlife.map((event) => ({ name: event.title, url: `/events/${event.slug}`, image: event.imageUrl, startDate: event.startAt }))
        : category === "reservations"
          ? reserveVenues.map((venue) => ({ name: venue.name, url: `/reserve/${venue.slug}`, image: venue.imageUrl }))
          : venues.map((venue) => ({ name: venue.name, url: venue.isReserveActive ? `/reserve/${venue.slug}` : `/city/${city.slug}/venues`, image: venue.imageUrl }));

  const structuredData = [
    buildCollectionPageSchema({
      name: pageTitle,
      description: pageDescription,
      path: `/city/${city.slug}/${category}`,
    }),
    buildItemListSchema({
      name: pageTitle,
      path: `/city/${city.slug}/${category}`,
      items: listItems,
    }),
  ];

  const crossLinks = CATEGORY_ORDER.filter((item) => item !== category);

  return (
    <PublicPageFrame
      title={pageTitle}
      description={pageDescription}
      heroImage={city.heroImage}
      breadcrumbs={[
        { name: "Home", path: "/" },
        { name: "Cities", path: "/city" },
        { name: city.name, path: `/city/${city.slug}` },
        { name: CATEGORY_COPY[category].suffix, path: `/city/${city.slug}/${category}` },
      ]}
      structuredData={structuredData}
    >
      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:px-8">
        <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6">
          <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#caa7ff]">Explore in {city.name}</div>
          <p className="mt-4 max-w-4xl text-base leading-7 text-white/72">{city.experienceBlurb}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {crossLinks.map((link) => (
              <Link key={link} href={`/city/${city.slug}/${link}`} className="rounded-full border border-white/12 bg-black/25 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/70 hover:border-white/20 hover:text-white">
                More {link} in {city.shortLabel}
              </Link>
            ))}
            <Link href={`${getReserveOrigin()}/${city.slug}`} className="rounded-full border border-white/12 bg-black/25 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/70 hover:border-white/20 hover:text-white">
              Reserve in {city.shortLabel}
            </Link>
          </div>
        </div>
      </section>

      {category === "events" || category === "nightlife" ? (
        <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-10 md:grid-cols-2 xl:grid-cols-3 md:px-6 lg:px-8">
          {(category === "events" ? events : nightlife).map((event) => (
            <article key={event.id} className="overflow-hidden rounded-[28px] border border-white/10 bg-[#0b0b10]">
              <Link href={`/events/${event.slug}`} className="block">
                <div className="relative h-56">
                  <Image src={event.imageUrl} alt={event.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" unoptimized />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
                </div>
                <div className="p-5">
                  <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#caa7ff]">{event.city}, {event.state}</div>
                  <h2 className="mt-3 text-2xl font-black tracking-tight text-white">{event.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-white/68">{event.description}</p>
                  <div className="mt-4 text-sm text-white/55">{event.venueName}</div>
                </div>
              </Link>
              <div className="flex flex-wrap gap-3 px-5 pb-5 text-xs uppercase tracking-[0.18em] text-white/45">
                <Link href={`/city/${city.slug}/events`} className="hover:text-white/80">Explore in {city.shortLabel}</Link>
                <Link href={`/city/${city.slug}/venues`} className="hover:text-white/80">Top venues nearby</Link>
                <Link href={`/reserve/${city.slug}`} className="hover:text-white/80">Reserve at similar places</Link>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {category === "reservations" ? (
        <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-10 md:grid-cols-2 xl:grid-cols-3 md:px-6 lg:px-8">
          {reserveVenues.map((venue) => (
            <Link key={venue.slug} href={`${getReserveOrigin()}/${venue.slug}`} className="rounded-[28px] border border-white/10 bg-[#0b0b10] p-6 transition hover:border-white/20">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#caa7ff]">Reservations live</div>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-white">{venue.name}</h2>
              <p className="mt-3 text-sm leading-6 text-white/68">
                Book {venue.name} through EVNTSZN Reserve for dinner flow, brunch demand, nightlife tables, and waitlist-aware booking.
              </p>
              <div className="mt-4 text-sm text-white/55">
                Waitlist {venue.reserveSettings?.waitlist_enabled === false ? "off" : "on"} · max party {venue.reserveSettings?.max_party_size || 8}
              </div>
              <div className="mt-5 flex flex-wrap gap-3 text-xs uppercase tracking-[0.18em] text-white/45">
                <span>Reserve at similar places</span>
                <span>Top venues nearby</span>
              </div>
            </Link>
          ))}
        </section>
      ) : null}

      {category === "venues" ? (
        <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-10 md:grid-cols-2 xl:grid-cols-3 md:px-6 lg:px-8">
          {venues.map((venue) => (
            <div key={venue.slug} className="rounded-[28px] border border-white/10 bg-[#0b0b10] p-6">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#caa7ff]">
                {venue.isReserveActive ? "Reserve-ready venue" : "Event venue"}
              </div>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-white">{venue.name}</h2>
              <p className="mt-3 text-sm leading-6 text-white/68">
                {venue.isReserveActive
                  ? `${venue.name} is active inside EVNTSZN Reserve for booking demand, nightlife flow, and guest routing.`
                  : `${venue.name} is part of the EVNTSZN city venue network for events, nightlife discovery, and local search coverage.`}
              </p>
              <div className="mt-5 flex flex-wrap gap-3 text-xs uppercase tracking-[0.18em] text-white/45">
                <Link href={`/city/${city.slug}/nightlife`} className="hover:text-white/80">More nightlife like this</Link>
                {venue.isReserveActive ? <Link href={`${getReserveOrigin()}/${venue.slug}`} className="hover:text-white/80">Reserve</Link> : null}
                <Link href={`/city/${city.slug}/events`} className="hover:text-white/80">Events nearby</Link>
              </div>
            </div>
          ))}
        </section>
      ) : null}
    </PublicPageFrame>
  );
}
