import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SaveToggle from "@/components/evntszn/SaveToggle";
import PublicPageFrame from "@/components/public/PublicPageFrame";
import {
  CREATOR_KICKOFF_DESCRIPTION,
  ensureCreatorKickoffRuntimeSetup,
  isCreatorKickoffEvent,
  isMidnightRunEvent,
} from "@/lib/events-runtime";
import { getRelatedEvents, getReserveVenuesByCity } from "@/lib/public-directory";
import { getPublicCityByName } from "@/lib/public-cities";
import { isSupabaseCredentialError } from "@/lib/runtime-env";
import { buildPageMetadata } from "@/lib/seo";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { supabasePublicServer } from "@/lib/supabase-public-server";
import { getTicketAvailabilityState, type TicketAvailabilityState } from "@/lib/ticketing";
import { averagePulseVote, describePulseScore } from "@/lib/platform-products";
import TicketPurchaseCard from "./TicketPurchaseCard";

type Params = Promise<{ slug: string }>;
type EventVenue = {
  name: string;
  slug?: string | null;
  city?: string | null;
  state?: string | null;
  timezone?: string | null;
};
type EventTicketType = {
  id: string;
  name: string;
  description: string | null;
  price_usd: number;
  quantity_total: number;
  quantity_sold: number;
  max_per_order: number;
  sales_start_at?: string | null;
  sales_end_at?: string | null;
  is_active?: boolean;
  visibility_mode?: "visible" | "hidden";
  sort_order?: number | null;
};

function formatEventStart(value: string) {
  return new Date(value).toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

async function getEventBySlug(slug: string) {
  const runQuery = async (client: typeof supabaseAdmin) =>
    client
      .from("evntszn_events")
      .select(`
        id,
        title,
        slug,
        subtitle,
        description,
        hero_note,
        city,
        state,
        start_at,
        end_at,
        scanner_status,
        event_class,
        event_vertical,
        banner_image_url,
        evntszn_venues (
          name,
          slug,
          city,
          state,
          timezone
        )
      `)
      .eq("slug", slug)
      .eq("visibility", "published")
      .maybeSingle();

  let { data: event, error } = await runQuery(supabaseAdmin);
  if (error && isSupabaseCredentialError(error)) {
    const fallback = await runQuery(supabasePublicServer);
    event = fallback.data;
  }

  return event;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event || isMidnightRunEvent(event)) return {};

  return buildPageMetadata({
    title: `${event.title} in ${event.city} | EVNTSZN`,
    description:
      event.description ||
      event.subtitle ||
      `Discover ${event.title} in ${event.city}, ${event.state} on EVNTSZN.`,
    path: `/events/${event.slug}`,
    image: event.banner_image_url || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=80",
    keywords: [
      event.title,
      `${event.city} events`,
      `${event.city} nightlife`,
      "things to do tonight",
      "EVNTSZN event",
    ],
  });
}

export default async function EventDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    notFound();
  }

  if (isMidnightRunEvent(event)) {
    notFound();
  }

  const ticketTypes: EventTicketType[] = (isCreatorKickoffEvent(event)
    ? await ensureCreatorKickoffRuntimeSetup(event.id)
    : (
        await supabaseAdmin
          .from("evntszn_ticket_types")
          .select("id, name, description, price_usd, quantity_total, quantity_sold, max_per_order, sales_start_at, sales_end_at, is_active, visibility_mode, sort_order")
          .eq("event_id", event.id)
          .order("sort_order", { ascending: true })
      ).data || []) as EventTicketType[];

  const { data: pulseVotes } = await supabaseAdmin
    .from("evntszn_event_pulse_votes")
    .select("energy_level, crowd_density, music_vibe, bar_activity, created_at")
    .eq("event_id", event.id)
    .gte("created_at", new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString())
    .order("created_at", { ascending: false })
    .limit(250);

  const visibleTicketTypes = (ticketTypes
    .map((ticket) => ({ ...ticket, availability_state: getTicketAvailabilityState(ticket) }))
    .filter((ticket) => ticket.visibility_mode === "visible" || ticket.availability_state === "active")) as Array<
    {
      id: string;
      name: string;
      description: string | null;
      price_usd: number;
      quantity_total: number;
      quantity_sold: number;
      max_per_order: number;
      sales_start_at?: string | null;
      sales_end_at?: string | null;
      is_active?: boolean;
      visibility_mode?: "visible" | "hidden";
      availability_state: TicketAvailabilityState;
    }
  >;

  const venueName = Array.isArray(event.evntszn_venues)
    ? (event.evntszn_venues[0] as EventVenue | undefined)?.name
    : (event.evntszn_venues as EventVenue | null)?.name || "EVNTSZN venue";
  const cityProfile = getPublicCityByName(event.city);
  const [relatedEvents, nearbyReserve] = await Promise.all([
    getRelatedEvents({ city: event.city || "", excludeSlug: event.slug, limit: 4 }),
    cityProfile ? getReserveVenuesByCity(cityProfile.slug, 4) : Promise.resolve([]),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    "@id": `https://evntszn.com/events/${event.slug}#event`,
    name: event.title,
    startDate: event.start_at,
    endDate: event.end_at,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    image: [event.banner_image_url || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=80"],
    url: `https://evntszn.com/events/${event.slug}`,
    organizer: {
      "@type": "Organization",
      name: "EVNTSZN",
      url: "https://evntszn.com",
    },
    location: {
      "@type": "Place",
      name: venueName,
      address: {
        "@type": "PostalAddress",
        addressLocality: event.city,
        addressRegion: event.state,
        addressCountry: "US"
      },
      ...(cityProfile
        ? {
            geo: {
              "@type": "GeoCoordinates",
              latitude: cityProfile.latitude,
              longitude: cityProfile.longitude,
            },
          }
        : {}),
    },
    description: event.description || event.subtitle,
    offers: visibleTicketTypes.map(tt => ({
      "@type": "Offer",
      name: tt.name,
      price: Number(tt.price_usd || 0).toFixed(2),
      priceCurrency: "USD",
      availability: tt.availability_state === 'active' ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      validFrom: tt.sales_start_at,
      url: `https://evntszn.com/events/${event.slug}`,
    }))
  };
  const pulseCount = pulseVotes?.length || 0;
  const pulseBreakdown = pulseCount
    ? pulseVotes!.reduce(
        (acc, vote) => {
          acc.energy += Number(vote.energy_level || 0);
          acc.crowd += Number(vote.crowd_density || 0);
          acc.music += Number(vote.music_vibe || 0);
          acc.bar += Number(vote.bar_activity || 0);
          return acc;
        },
        { energy: 0, crowd: 0, music: 0, bar: 0 },
      )
    : null;
  const pulseScore = pulseBreakdown
    ? averagePulseVote({
        energyLevel: Math.round((pulseBreakdown.energy / pulseCount) * 10) / 10,
        crowdDensity: Math.round((pulseBreakdown.crowd / pulseCount) * 10) / 10,
        musicVibe: Math.round((pulseBreakdown.music / pulseCount) * 10) / 10,
        barActivity: Math.round((pulseBreakdown.bar / pulseCount) * 10) / 10,
      })
    : null;
  const pulseSummary = describePulseScore(pulseScore);
  const latestPulseAt = pulseVotes?.[0]?.created_at ? new Date(pulseVotes[0].created_at).getTime() : null;
  const isLiveNow = Boolean(latestPulseAt && latestPulseAt >= Date.now() - 1000 * 60 * 20);
  const isHotEvent = Boolean(pulseScore && pulseScore > 8);
  const description = isCreatorKickoffEvent(event)
    ? CREATOR_KICKOFF_DESCRIPTION
    : event.description || event.subtitle || "Event details coming soon.";
  const overviewParagraphs = description
    .split(/\n{2,}/)
    .map((paragraph: string) => paragraph.trim())
    .filter(Boolean);

  return (
    <PublicPageFrame
      breadcrumbs={[
        { name: "Home", path: "/" },
        { name: "Events", path: "/events" },
        ...(cityProfile ? [{ name: cityProfile.name, path: `/city/${cityProfile.slug}/events` }] : []),
        { name: event.title, path: `/events/${event.slug}` },
      ]}
      structuredData={jsonLd}
    >
      <main className="px-4 py-10 text-white md:px-6 lg:px-8 lg:py-14">
        <div className="mx-auto max-w-[1500px]">
          <div className="grid gap-10 xl:grid-cols-[1.1fr_0.9fr] xl:gap-12">
            <section className="space-y-8">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-[#A259FF]">
                  {event.city}, {event.state}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {isLiveNow ? (
                    <span className="rounded-full border border-emerald-400/25 bg-emerald-500/12 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-emerald-100">
                      Live now
                    </span>
                  ) : null}
                  {isHotEvent ? (
                    <span className="rounded-full border border-[#A259FF]/30 bg-[#A259FF]/12 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#eadcff]">
                      Hot
                    </span>
                  ) : null}
                  <SaveToggle
                    item={{
                      intent: "save",
                      entityType: "event",
                      entityKey: event.slug,
                      title: event.title,
                      href: `/events/${event.slug}`,
                      city: event.city,
                      state: event.state,
                      startsAt: event.start_at,
                    }}
                  />
                  <SaveToggle
                    item={{
                      intent: "watch",
                      entityType: "event",
                      entityKey: `${event.slug}:watch`,
                      title: `${event.title} watch`,
                      href: `/events/${event.slug}`,
                      city: event.city,
                      state: event.state,
                      startsAt: event.start_at,
                    }}
                    inactiveLabel="Watch tonight"
                    activeLabel="Watching tonight"
                  />
                </div>
                <h1 className="mt-3 text-5xl font-black tracking-tight md:text-6xl">{event.title}</h1>
                <div className="mt-5 max-w-3xl space-y-4 text-base leading-7 text-white/72">
                  {overviewParagraphs.map((paragraph: string) => (
                  <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/45">Venue</p>
                  <p className="mt-3 text-xl font-semibold">
                    {Array.isArray(event.evntszn_venues)
                      ? (event.evntszn_venues[0] as EventVenue | undefined)?.name
                      : (event.evntszn_venues as EventVenue | null)?.name || "EVNTSZN venue"}
                  </p>
                </div>
                <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/45">Time</p>
                  <p className="mt-3 text-xl font-semibold">
                    {formatEventStart(event.start_at)}
                  </p>
                </div>
              </div>

              <div className={`grid gap-4 md:grid-cols-2 ${isHotEvent ? "rounded-[30px] border border-[#A259FF]/25 bg-[#A259FF]/10 p-4" : ""}`}>
                <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/45">Live energy</p>
                  <p className="mt-3 text-xl font-semibold">
                    {pulseScore ? `🔥 ${pulseScore.toFixed(1)}` : "No pulse yet"}
                  </p>
                </div>
                <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/45">Room read</p>
                  <p className="mt-3 text-xl font-semibold">{pulseCount ? pulseSummary.label : "Be first"}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/45">Explore in {event.city}</p>
                  <div className="mt-4 flex flex-wrap gap-3 text-xs font-bold uppercase tracking-[0.18em] text-white/50">
                    {cityProfile ? <Link href={`/city/${cityProfile.slug}/events`} className="hover:text-white">Explore in {cityProfile.shortLabel}</Link> : null}
                    {cityProfile ? <Link href={`/city/${cityProfile.slug}/nightlife`} className="hover:text-white">More events like this</Link> : null}
                    {cityProfile ? <Link href={`/city/${cityProfile.slug}/venues`} className="hover:text-white">Top venues nearby</Link> : null}
                    {cityProfile ? <Link href={`/reserve/${cityProfile.slug}`} className="hover:text-white">Reserve nearby</Link> : null}
                  </div>
                </div>
                <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/45">Organizer</p>
                  <p className="mt-3 text-xl font-semibold">EVNTSZN</p>
                  <p className="mt-2 text-sm text-white/65">City events, nightlife authority, and reservation-linked discovery.</p>
                </div>
              </div>
            </section>

            <TicketPurchaseCard
              eventId={event.id}
              eventTitle={event.title}
              eventSlug={event.slug}
              ticketTypes={visibleTicketTypes}
            />
          </div>

          <div className="mt-10 grid gap-6 xl:grid-cols-2">
            <section className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#caa7ff]">More events like this</div>
              <div className="mt-4 space-y-3">
                {relatedEvents.map((relatedEvent) => (
                  <Link key={relatedEvent.id} href={`/events/${relatedEvent.slug}`} className="block rounded-2xl border border-white/10 bg-black/20 p-4 hover:border-white/20">
                    <div className="text-sm font-semibold text-white">{relatedEvent.title}</div>
                    <div className="mt-1 text-sm text-white/60">{relatedEvent.venueName}</div>
                  </Link>
                ))}
              </div>
            </section>

            <section className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#caa7ff]">Reserve at similar places</div>
              <div className="mt-4 space-y-3">
                {nearbyReserve.length ? nearbyReserve.map((venue) => (
                  <Link key={venue.slug} href={`/reserve/${venue.slug}`} className="block rounded-2xl border border-white/10 bg-black/20 p-4 hover:border-white/20">
                    <div className="text-sm font-semibold text-white">{venue.name}</div>
                    <div className="mt-1 text-sm text-white/60">{venue.city}, {venue.state}</div>
                  </Link>
                )) : (
                  <div className="text-sm text-white/60">Reserve is expanding across this city now.</div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </PublicPageFrame>
  );
}
