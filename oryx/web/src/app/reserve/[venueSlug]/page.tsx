import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PulseActivityBeacon from "@/components/evntszn/PulseActivityBeacon";
import ReturnTrigger from "@/components/evntszn/ReturnTrigger";
import SaveToggle from "@/components/evntszn/SaveToggle";
import PublicPageFrame from "@/components/public/PublicPageFrame";
import PublicReserveBookingClient from "@/components/reserve/PublicReserveBookingClient";
import {
  getPublishedEventsByCity,
  getReserveVenueBySlugOrCity,
  getReserveVenuesByCity,
  getVenueListingsByCity,
} from "@/lib/public-directory";
import { getPublicCityBySlug } from "@/lib/public-cities";
import { getReserveOrigin } from "@/lib/domains";
import { getReserveUrgencyLabel } from "@/lib/evntszn-phase";
import { getReserveVenueBySlug, normalizeReserveSettings, unwrapVenue } from "@/lib/reserve";
import { buildCollectionPageSchema, buildItemListSchema, buildPageMetadata } from "@/lib/seo";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type ReserveSlugPageProps = {
  params: Promise<{ venueSlug: string }>;
};

export async function generateMetadata({ params }: ReserveSlugPageProps): Promise<Metadata> {
  const { venueSlug } = await params;
  const city = getPublicCityBySlug(venueSlug);
  if (city) {
    return buildPageMetadata({
      title: `${city.name} reservations and nightlife bookings | EVNTSZN Reserve`,
      description: `Search ${city.name} reservations, brunch bookings, nightlife tables, and Reserve-ready venues on EVNTSZN.`,
      path: `/${city.slug}`,
      origin: getReserveOrigin(),
      image: city.heroImage,
    });
  }

  const reserveVenue = await getReserveVenueBySlug(venueSlug).catch(() => null);
  const venue = unwrapVenue(reserveVenue);

  if (!reserveVenue || !reserveVenue.is_active || !venue) {
    return {};
  }

  return buildPageMetadata({
    title: `${venue.name} reservations and table bookings | EVNTSZN Reserve`,
    description: `Book ${venue.name} through EVNTSZN Reserve for dining reservations, nightlife tables, and waitlist-aware guest flow.`,
    path: `/${venueSlug}`,
    origin: getReserveOrigin(),
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1800&q=80",
  });
}

export default async function ReserveVenuePage({ params }: ReserveSlugPageProps) {
  const { venueSlug } = await params;
  const lookup = await getReserveVenueBySlugOrCity(venueSlug);

  if (lookup.city && !lookup.reserveVenue) {
    const city = lookup.city;
    const [reserveVenues, events, venues] = await Promise.all([
      getReserveVenuesByCity(city.slug, 12),
      getPublishedEventsByCity(city.slug, 6),
      getVenueListingsByCity(city.slug, 8),
    ]);

    return (
      <PublicPageFrame
        title={`${city.name} Reserve bookings`}
        description={city.reservationsIntro}
        heroImage={city.heroImage}
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Reserve", path: "/reserve" },
          { name: city.name, path: `/reserve/${city.slug}` },
        ]}
        structuredData={[
          buildCollectionPageSchema({
            name: `${city.name} reservations on EVNTSZN Reserve`,
            description: city.reservationsIntro,
            path: `${getReserveOrigin()}/${city.slug}`,
          }),
          buildItemListSchema({
            name: `${city.name} Reserve venues`,
            path: `${getReserveOrigin()}/${city.slug}`,
            items: reserveVenues.map((venue) => ({
              name: venue.name,
              url: `${getReserveOrigin()}/${venue.slug}`,
              image: venue.imageUrl,
            })),
          }),
        ]}
      >
        <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#caa7ff]">Reservations near you</div>
              <p className="mt-4 text-base leading-7 text-white/72">
                EVNTSZN Reserve makes {city.name} searchable for booking intent, from brunch reservations to nightlife tables and guest-flow-driven venues.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={`/city/${city.slug}/reservations`} className="ev-button-primary">Explore in {city.shortLabel}</Link>
                <Link href={`/city/${city.slug}/nightlife`} className="ev-button-secondary">More nightlife like this</Link>
              </div>
            </div>
            <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#caa7ff]">Availability messaging</div>
              <div className="mt-4 space-y-3 text-sm text-white/68">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">Tables, dinner flow, and nightlife bookings in {city.name} live here.</div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">Reserve pages stay indexable so Google can surface booking intent directly.</div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">Each live venue routes guests into the right Reserve booking flow.</div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-10 md:grid-cols-2 xl:grid-cols-3 md:px-6 lg:px-8">
          {reserveVenues.length ? reserveVenues.map((venue) => (
            <Link key={venue.slug} href={`/reserve/${venue.slug}`} className="rounded-[28px] border border-white/10 bg-[#0b0b10] p-6 transition hover:border-white/20">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#caa7ff]">Reserve-ready venue</div>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-white">{venue.name}</h2>
              <p className="mt-3 text-sm leading-6 text-white/68">
                Reserve at {venue.name} for dinner plans, brunch demand, nightlife flow, and waitlist-aware guest routing in {city.name}.
              </p>
              <div className="mt-4 text-sm text-white/55">
                Waitlist {venue.reserveSettings?.waitlist_enabled === false ? "off" : "on"} · max party {venue.reserveSettings?.max_party_size || 8}
              </div>
            </Link>
          )) : (
            <div className="rounded-[28px] border border-white/10 bg-[#0b0b10] p-6 text-sm text-white/68">
              Reserve inventory is still expanding in {city.name}. The city page remains live so search intent starts attaching to EVNTSZN now.
            </div>
          )}
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-10 md:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#caa7ff]">Top venues nearby</div>
              <div className="mt-4 space-y-3">
                {venues.slice(0, 5).map((venue) => (
                  <div key={venue.slug} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="text-sm font-semibold text-white">{venue.name}</div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs uppercase tracking-[0.18em] text-white/45">
                      <Link href={`/city/${city.slug}/venues`} className="hover:text-white/80">Top venues nearby</Link>
                      {venue.isReserveActive ? <Link href={`/reserve/${venue.slug}`} className="hover:text-white/80">Reserve at similar places</Link> : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#caa7ff]">Explore in {city.name}</div>
              <div className="mt-4 space-y-3">
                {events.slice(0, 5).map((event) => (
                  <Link key={event.id} href={`/events/${event.slug}`} className="block rounded-2xl border border-white/10 bg-black/20 p-4 hover:border-white/20">
                    <div className="text-sm font-semibold text-white">{event.title}</div>
                    <div className="mt-1 text-sm text-white/60">{event.venueName}</div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      </PublicPageFrame>
    );
  }

  const reserveVenue = await getReserveVenueBySlug(venueSlug).catch(() => null);
  if (!reserveVenue || !reserveVenue.is_active) notFound();

  const venue = unwrapVenue(reserveVenue);
  if (!venue) notFound();

  const settings = normalizeReserveSettings((reserveVenue.settings || {}) as Record<string, unknown>);
  const cityProfile = lookup.reserveVenue?.cityProfile || null;
  const [slotsRes, similarPlaces, relatedEvents] = await Promise.all([
    supabaseAdmin
      .from("evntszn_reserve_slots")
      .select("id, reserve_venue_id, day_of_week, start_time, end_time, capacity_limit, is_active")
      .eq("reserve_venue_id", reserveVenue.id)
      .eq("is_active", true)
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true }),
    cityProfile ? getReserveVenuesByCity(cityProfile.slug, 8) : Promise.resolve([]),
    cityProfile ? getPublishedEventsByCity(cityProfile.slug, 6) : Promise.resolve([]),
  ]);

  const slots = slotsRes.data || [];
  const similarReserve = similarPlaces.filter((item) => item.slug !== venue.slug).slice(0, 4);
  const urgency = getReserveUrgencyLabel({
    slotCount: slots.length,
    reservationFeeUsd: Number(settings.reservation_fee_usd || 0),
    waitlistEnabled: settings.waitlist_enabled !== false,
  });

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: venue.name,
      image: ["https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1800&q=80"],
      telephone: lookup.reserveVenue?.contactPhone || undefined,
      email: lookup.reserveVenue?.contactEmail || undefined,
      address: {
        "@type": "PostalAddress",
        addressLocality: venue.city,
        addressRegion: venue.state,
        addressCountry: "US",
      },
      geo: cityProfile
        ? {
            "@type": "GeoCoordinates",
            latitude: cityProfile.latitude,
            longitude: cityProfile.longitude,
          }
        : undefined,
      openingHoursSpecification: slots.slice(0, 7).map((slot) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][slot.day_of_week],
        opens: slot.start_time,
        closes: slot.end_time,
      })),
      url: `${getReserveOrigin()}/${venue.slug}`,
    },
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: `${venue.name} reservations`,
      description: `Book ${venue.name} through EVNTSZN Reserve for dining reservations, nightlife tables, and waitlist-aware guest flow.`,
      brand: { "@type": "Brand", name: "EVNTSZN Reserve" },
      offers: {
        "@type": "Offer",
        priceCurrency: "USD",
        price: Number(settings.reservation_fee_usd || 0).toFixed(2),
        availability: "https://schema.org/InStock",
        url: `${getReserveOrigin()}/${venue.slug}`,
      },
    },
  ];

  return (
    <PublicPageFrame
      title={`${venue.name} reservations`}
      description={`Book dining and nightlife flow for ${venue.name} with EVNTSZN Reserve.`}
      heroImage="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1800&q=80"
      breadcrumbs={[
        { name: "Home", path: "/" },
        { name: "Reserve", path: "/reserve" },
        ...(cityProfile ? [{ name: cityProfile.name, path: `/reserve/${cityProfile.slug}` }] : []),
        { name: venue.name, path: `/reserve/${venue.slug}` },
      ]}
      structuredData={structuredData}
    >
      <PulseActivityBeacon sourceType="reserve_view" city={venue.city} referenceType="reserve" referenceId={venue.slug} />
      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <div className="ev-panel p-8">
              <div className="ev-section-kicker">Reserve venue</div>
              <h1 className="mt-3 text-5xl font-black tracking-tight text-white">{venue.name}</h1>
              <div className="mt-4 text-sm text-white/58">{venue.city}, {venue.state}</div>
              <p className="mt-5 text-base leading-7 text-white/68">
                Reserve handles dining reservations, nightlife tables, and guest flow for venues that need more than a static booking link.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <div className="rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-amber-50">
                  {urgency.label}
                </div>
                <SaveToggle
                  item={{
                    intent: "save",
                    entityType: "reserve",
                    entityKey: venue.slug,
                    title: venue.name,
                    href: `/reserve/${venue.slug}`,
                    city: venue.city,
                    state: venue.state,
                  }}
                  inactiveLabel="Save spot"
                />
                <SaveToggle
                  item={{
                    intent: "watch",
                    entityType: "reserve",
                    entityKey: `${venue.slug}:watch`,
                    title: `${venue.name} watch`,
                    href: `/reserve/${venue.slug}`,
                    city: venue.city,
                    state: venue.state,
                  }}
                  inactiveLabel="Watch demand"
                  activeLabel="Watching demand"
                />
              </div>
              <div className="mt-6 rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-white/68">
                Booking window {settings.booking_window_days || 30} days · max party {settings.max_party_size || 8} · waitlist{" "}
                {settings.waitlist_enabled === false ? "off" : "on"}
              </div>
              <div className="mt-4">
                <ReturnTrigger href={`/reserve/${venue.slug}`} tone="reserve" />
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#caa7ff]">Reserve at similar places</div>
              <div className="mt-4 space-y-3">
                {similarReserve.length ? similarReserve.map((place) => (
                  <Link key={place.slug} href={`/reserve/${place.slug}`} className="block rounded-2xl border border-white/10 bg-black/20 p-4 hover:border-white/20">
                    <div className="text-sm font-semibold text-white">{place.name}</div>
                    <div className="mt-1 text-sm text-white/60">{place.city}, {place.state}</div>
                  </Link>
                )) : (
                  <div className="text-sm text-white/60">More Reserve inventory is rolling out across this city.</div>
                )}
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#caa7ff]">More events like this</div>
              <div className="mt-4 space-y-3">
                {relatedEvents.slice(0, 4).map((event) => (
                  <Link key={event.id} href={`/events/${event.slug}`} className="block rounded-2xl border border-white/10 bg-black/20 p-4 hover:border-white/20">
                    <div className="text-sm font-semibold text-white">{event.title}</div>
                    <div className="mt-1 text-sm text-white/60">{event.venueName}</div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <PublicReserveBookingClient
            venue={{
              id: reserveVenue.id,
              venueId: reserveVenue.venue_id,
              isActive: reserveVenue.is_active,
              settings,
              venue,
            }}
            slots={slots}
          />
        </div>
      </section>
    </PublicPageFrame>
  );
}
