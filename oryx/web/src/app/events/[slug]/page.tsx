import { notFound } from "next/navigation";
import PublicPageFrame from "@/components/public/PublicPageFrame";
import EventPulseCard from "@/components/events/EventPulseCard";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getTicketAvailabilityState, type TicketAvailabilityState } from "@/lib/ticketing";
import { averagePulseVote, describePulseScore } from "@/lib/platform-products";
import TicketPurchaseCard from "./TicketPurchaseCard";

type Params = Promise<{ slug: string }>;
type EventVenue = {
  name: string;
};

export default async function EventDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const { data: event } = await supabaseAdmin
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
      evntszn_venues (
        name
      )
    `)
    .eq("slug", slug)
    .eq("visibility", "published")
    .maybeSingle();

  if (!event) {
    notFound();
  }

  const { data: ticketTypes } = await supabaseAdmin
    .from("evntszn_ticket_types")
    .select("id, name, description, price_usd, quantity_total, quantity_sold, max_per_order, sales_start_at, sales_end_at, is_active, visibility_mode, sort_order")
    .eq("event_id", event.id)
    .order("sort_order", { ascending: true });

  const { data: operations } = await supabaseAdmin
    .from("evntszn_event_operations")
    .select("objective, run_of_show")
    .eq("event_id", event.id)
    .maybeSingle();

  const { data: pulseVotes } = await supabaseAdmin
    .from("evntszn_event_pulse_votes")
    .select("energy_level, crowd_density, music_vibe, bar_activity, created_at")
    .eq("event_id", event.id)
    .gte("created_at", new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString())
    .order("created_at", { ascending: false })
    .limit(250);

  const visibleTicketTypes = ((ticketTypes || [])
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": event.title,
    "startDate": event.start_at,
    "endDate": event.end_at,
    "eventStatus": "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "location": {
      "@type": "Place",
      "name": venueName,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": event.city,
        "addressRegion": event.state,
        "addressCountry": "US"
      }
    },
    "description": event.description || event.subtitle,
    "offers": visibleTicketTypes.map(tt => ({
      "@type": "Offer",
      "name": tt.name,
      "price": Number(tt.price_usd || 0).toFixed(2),
      "priceCurrency": "USD",
      "availability": tt.availability_state === 'active' ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "validFrom": tt.sales_start_at
    }))
  };
  const goingCount = visibleTicketTypes.reduce((sum, ticket) => sum + Number(ticket.quantity_sold || 0), 0);
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
  const crewCity = encodeURIComponent(event.city || "");
  const djHref = `/crew?category=dj${event.city ? `&city=${crewCity}` : ""}`;
  const photographerHref = `/crew?category=photographer${event.city ? `&city=${crewCity}` : ""}`;

  return (
    <PublicPageFrame>
      <main className="px-4 py-12 text-white md:px-6 lg:px-8 lg:py-16">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <div className="mx-auto max-w-[1500px]">
          <div className="grid gap-10 xl:grid-cols-[1.1fr_0.9fr] xl:gap-12">
            <section className="space-y-8">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-[#A259FF]">
                  {event.city}, {event.state}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/70">
                    {event.event_vertical === "epl" ? "EPL" : "EVNTSZN"}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/70">
                    {String(event.event_class || "evntszn").replace(/_/g, " ")}
                  </span>
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
                </div>
                <h1 className="mt-3 text-5xl font-black tracking-tight md:text-6xl">{event.title}</h1>
                <p className="mt-5 max-w-3xl text-lg leading-8 text-white/68">
                  {event.description || event.subtitle}
                </p>
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
                  <p className="text-xs uppercase tracking-[0.22em] text-white/45">Doors</p>
                  <p className="mt-3 text-xl font-semibold">
                    {new Date(event.start_at).toLocaleString()}
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

              {event.hero_note ? (
                <div className="rounded-[30px] border border-[#A259FF]/25 bg-[#A259FF]/10 p-6 text-[#e4d8ff]">
                  {event.hero_note}
                </div>
              ) : null}

              <EventPulseCard eventId={event.id} />



              {operations?.objective || operations?.run_of_show ? (
                <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6">
                  <p className="text-xs uppercase tracking-[0.22em] text-[#A259FF]">What to know</p>
                  {operations.objective ? (
                    <p className="mt-4 text-base leading-7 text-white/76">{operations.objective}</p>
                  ) : null}
                  {operations.run_of_show ? (
                    <pre className="mt-5 whitespace-pre-wrap text-sm leading-7 text-white/68">{operations.run_of_show}</pre>
                  ) : null}
                </div>
              ) : null}
            </section>

            <TicketPurchaseCard
              eventId={event.id}
              eventTitle={event.title}
              eventSlug={event.slug}
              ticketTypes={visibleTicketTypes}
            />
          </div>
        </div>
      </main>
    </PublicPageFrame>
  );
}
