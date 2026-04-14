import { notFound } from "next/navigation";
import PublicPageFrame from "@/components/public/PublicPageFrame";
import EventPulseCard from "@/components/events/EventPulseCard";
import { buildNodeActivityScore, getNodeTypeLabel } from "@/lib/nodes";
import { averagePulseVote } from "@/lib/platform-products";
import { supabaseAdmin } from "@/lib/supabase-admin";
import NodeActivityBeacon from "./NodeActivityBeacon";
import NodePulsePanel from "./NodePulsePanel";
import NodeTapLink from "./NodeTapLink";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

function summarizeVotes(
  votes: Array<{
    energy_level: number | null;
    crowd_density: number | null;
    music_vibe: number | null;
    bar_activity: number | null;
  }>,
) {
  if (!votes.length) return null;

  const totals = votes.reduce(
    (acc, vote) => {
      acc.energy += Number(vote.energy_level || 0);
      acc.crowd += Number(vote.crowd_density || 0);
      acc.music += Number(vote.music_vibe || 0);
      acc.bar += Number(vote.bar_activity || 0);
      return acc;
    },
    { energy: 0, crowd: 0, music: 0, bar: 0 },
  );

  return averagePulseVote({
    energyLevel: Math.round((totals.energy / votes.length) * 10) / 10,
    crowdDensity: Math.round((totals.crowd / votes.length) * 10) / 10,
    musicVibe: Math.round((totals.music / votes.length) * 10) / 10,
    barActivity: Math.round((totals.bar / votes.length) * 10) / 10,
  });
}

export const dynamic = "force-dynamic";

export default async function NodePage(context: RouteContext) {
  const { slug } = await context.params;
  const { data: node, error } = await supabaseAdmin
    .from("evntszn_nodes")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (error || !node) {
    notFound();
  }

  const windowStart = new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString();
  const [interactionsRes, relatedEventRes, relatedVenueRes, relatedCrewRes, relatedLinkRes] = await Promise.all([
    supabaseAdmin
      .from("evntszn_node_interactions")
      .select("interaction_type, actor_user_id, session_key, interaction_fingerprint, created_at")
      .eq("node_id", node.id)
      .gte("created_at", windowStart),
    node.event_id
      ? supabaseAdmin
          .from("evntszn_events")
          .select("id, title, slug, city, state, subtitle, start_at, venue_id")
          .eq("id", node.event_id)
          .eq("visibility", "published")
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    node.venue_id
      ? supabaseAdmin
          .from("evntszn_venues")
          .select("id, name, slug, city, state")
          .eq("id", node.venue_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    node.crew_profile_id
      ? supabaseAdmin
          .from("evntszn_crew_profiles")
          .select("id, display_name, slug, city, state, headline")
          .eq("id", node.crew_profile_id)
          .eq("status", "published")
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    node.link_page_id
      ? supabaseAdmin
          .from("evntszn_link_pages")
          .select("id, display_name, slug, headline")
          .eq("id", node.link_page_id)
          .eq("status", "published")
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (interactionsRes.error) throw new Error(interactionsRes.error.message);
  if (relatedEventRes.error) throw new Error(relatedEventRes.error.message);
  if (relatedVenueRes.error) throw new Error(relatedVenueRes.error.message);
  if (relatedCrewRes.error) throw new Error(relatedCrewRes.error.message);
  if (relatedLinkRes.error) throw new Error(relatedLinkRes.error.message);

  const liveEventsRes =
    node.event_id || node.venue_id || node.city
      ? await (() => {
          let query = supabaseAdmin
            .from("evntszn_events")
            .select("id, title, slug, city, state, start_at, venue_id")
            .eq("visibility", "published")
            .eq("status", "published")
            .gte("end_at", new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString())
            .order("start_at", { ascending: true })
            .limit(8);

          if (node.event_id) {
            query = query.eq("id", node.event_id);
          } else if (node.venue_id) {
            query = query.eq("venue_id", node.venue_id);
          } else if (node.city) {
            query = query.ilike("city", node.city);
          }

          return query;
        })()
      : { data: [], error: null };

  if (liveEventsRes.error) throw new Error(liveEventsRes.error.message);
  const liveEvents = liveEventsRes.data || [];
  const pulseEventIds = liveEvents.map((event) => event.id);
  const pulseVotesRes = pulseEventIds.length
    ? await supabaseAdmin
        .from("evntszn_event_pulse_votes")
        .select("event_id, energy_level, crowd_density, music_vibe, bar_activity")
        .in("event_id", pulseEventIds)
        .gte("created_at", windowStart)
    : { data: [], error: null };
  if (pulseVotesRes.error) throw new Error(pulseVotesRes.error.message);

  const ticketTotalsRes = pulseEventIds.length
    ? await supabaseAdmin
        .from("evntszn_ticket_types")
        .select("event_id, quantity_sold")
        .in("event_id", pulseEventIds)
    : { data: [], error: null };
  if (ticketTotalsRes.error) throw new Error(ticketTotalsRes.error.message);

  const eventPulseScore = relatedEventRes.data
    ? summarizeVotes((pulseVotesRes.data || []).filter((vote) => vote.event_id === relatedEventRes.data?.id))
    : null;
  const aggregatePulseScore = summarizeVotes(pulseVotesRes.data || []);

  const interactionRows = interactionsRes.data || [];
  const interactionCounts = interactionRows.reduce(
    (acc, row) => {
      if (row.interaction_type === "view") acc.views += 1;
      if (row.interaction_type === "tap") acc.taps += 1;
      if (row.interaction_type === "reaction") acc.reactions += 1;
      const uniqueKey = row.actor_user_id || row.session_key || row.interaction_fingerprint || row.created_at;
      acc.unique.add(uniqueKey);
      return acc;
    },
    { views: 0, taps: 0, reactions: 0, unique: new Set<string>() },
  );

  const liveSummary = buildNodeActivityScore({
    basePulseScore: eventPulseScore || aggregatePulseScore,
    views: interactionCounts.views,
    taps: interactionCounts.taps,
    reactions: interactionCounts.reactions,
  });

  const ticketMap = new Map<string, number>();
  for (const ticketType of ticketTotalsRes.data || []) {
    ticketMap.set(ticketType.event_id, (ticketMap.get(ticketType.event_id) || 0) + Number(ticketType.quantity_sold || 0));
  }

  const primaryHref =
    node.destination_type === "custom_url" && typeof node.destination_payload?.url === "string"
      ? String(node.destination_payload.url)
      : node.destination_type === "crew_profile" && relatedCrewRes.data?.slug
        ? `/${relatedCrewRes.data.slug}`
        : node.destination_type === "link_page" && relatedLinkRes.data?.slug
          ? `/${relatedLinkRes.data.slug}`
          : node.destination_type === "crew_marketplace"
            ? `/crew${node.city ? `?city=${encodeURIComponent(node.city)}` : ""}`
            : relatedEventRes.data?.slug
              ? `/events/${relatedEventRes.data.slug}`
              : liveEvents[0]?.slug
                ? `/events/${liveEvents[0].slug}`
                : node.city
                  ? `/events?city=${encodeURIComponent(node.city)}`
                  : "/events";

  const primaryLabel =
    node.destination_type === "crew_marketplace"
      ? "Open crew marketplace"
      : node.destination_type === "link_page"
        ? "Open EVNTSZN Link"
        : node.destination_type === "crew_profile"
          ? "Open featured crew"
          : relatedEventRes.data
            ? "Open event"
            : "See what’s active now";

  return (
    <PublicPageFrame>
      <NodeActivityBeacon slug={slug} city={node.city} />
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(162,89,255,0.24),transparent_35%),linear-gradient(180deg,#09090c_0%,#050507_100%)]" />
        <div className="relative mx-auto max-w-[1500px] px-4 py-14 md:px-6 lg:px-8 lg:py-18">
          <div className="grid gap-8 xl:grid-cols-[1.08fr_0.92fr]">
            <div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-[#A259FF]">{getNodeTypeLabel(node.node_type)}</div>
              <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-[-0.05em] text-white md:text-6xl">
                {node.public_title || node.internal_name}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-white/68">
                {node.placement_label || node.campaign_label || "This EVNTSZN Node is a live entry point into what is happening around you right now."}
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white/72">
                  {node.city ? [node.city, node.state].filter(Boolean).join(", ") : "EVNTSZN"}
                </div>
                <div className="rounded-full border border-[#A259FF]/25 bg-[#A259FF]/12 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#eadcff]">
                  {liveSummary.score ? `🔥 ${liveSummary.score.toFixed(1)} ${liveSummary.label}` : "Live node"}
                </div>
                <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white/72">
                  {interactionCounts.taps} taps in the last 6h
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <NodeTapLink slug={slug} href={primaryHref} city={node.city} className="ev-button-primary">
                  {primaryLabel}
                </NodeTapLink>
                <a href="/events" className="ev-button-secondary">Browse EVNTSZN events</a>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                <div className="text-[11px] uppercase tracking-[0.22em] text-white/42">Views</div>
                <div className="mt-2 text-3xl font-black text-white">{interactionCounts.views}</div>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                <div className="text-[11px] uppercase tracking-[0.22em] text-white/42">Unique traffic</div>
                <div className="mt-2 text-3xl font-black text-white">{interactionCounts.unique.size}</div>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                <div className="text-[11px] uppercase tracking-[0.22em] text-white/42">Nearby event signals</div>
                <div className="mt-2 text-3xl font-black text-white">{liveEvents.length}</div>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                <div className="text-[11px] uppercase tracking-[0.22em] text-white/42">Pulse mode</div>
                <div className="mt-2 text-2xl font-black text-white capitalize">{String(node.pulse_mode).replace(/_/g, " ")}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-4 py-10 md:px-6 lg:px-8 lg:py-14">
        <div className="grid gap-8 xl:grid-cols-[1.04fr_0.96fr]">
          <div className="space-y-6">
            <NodePulsePanel
              slug={slug}
              city={node.city}
              initialSummary={{
                score: liveSummary.score,
                label: liveSummary.label,
                summary: liveSummary.summary,
                views: interactionCounts.views,
                taps: interactionCounts.taps,
                reactions: interactionCounts.reactions,
                uniqueInteractions: interactionCounts.unique.size,
                nearbyEventCount: liveEvents.length,
                isLive: Boolean(interactionRows.length || aggregatePulseScore || eventPulseScore),
              }}
            />

            {relatedEventRes.data ? (
              <EventPulseCard eventId={relatedEventRes.data.id} />
            ) : null}
          </div>

          <div className="space-y-6">
            <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6 md:p-7">
              <div className="ev-section-kicker">What’s active here</div>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
                {relatedVenueRes.data
                  ? `${relatedVenueRes.data.name} live board`
                  : node.city
                    ? `${node.city} nearby activity`
                    : "Live EVNTSZN inventory"}
              </h2>

              <div className="mt-5 grid gap-3">
                {liveEvents.map((event) => (
                  <NodeTapLink
                    key={event.id}
                    slug={slug}
                    href={`/events/${event.slug}`}
                    city={node.city}
                    className="rounded-[22px] border border-white/10 bg-black/20 p-4 transition hover:bg-white/[0.05]"
                  >
                    <div className="text-lg font-black text-white">{event.title}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45">
                      {[event.city, event.state].filter(Boolean).join(", ")} • {new Date(event.start_at).toLocaleDateString()}
                    </div>
                    <div className="mt-3 text-sm text-white/62">
                      {ticketMap.get(event.id) ? `${ticketMap.get(event.id)} going` : "Ticket demand building"}
                    </div>
                  </NodeTapLink>
                ))}

                {!liveEvents.length ? (
                  <div className="rounded-[22px] border border-dashed border-white/12 bg-black/20 p-4 text-sm text-white/60">
                    No published live events are tied to this node yet. The node is still tracking traffic and can be pointed at the next destination once inventory is live.
                  </div>
                ) : null}
              </div>
            </section>

            {(relatedCrewRes.data || relatedLinkRes.data) ? (
              <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6 md:p-7">
                <div className="ev-section-kicker">Attached destination</div>
                <div className="mt-4 space-y-3">
                  {relatedCrewRes.data ? (
                    <NodeTapLink slug={slug} href={`/${relatedCrewRes.data.slug}`} city={node.city} className="block rounded-[22px] border border-white/10 bg-black/20 p-4 transition hover:bg-white/[0.05]">
                      <div className="text-lg font-black text-white">{relatedCrewRes.data.display_name}</div>
                      <div className="mt-2 text-sm text-white/62">{relatedCrewRes.data.headline || "Featured crew profile linked to this node."}</div>
                    </NodeTapLink>
                  ) : null}
                  {relatedLinkRes.data ? (
                    <NodeTapLink slug={slug} href={`/${relatedLinkRes.data.slug}`} city={node.city} className="block rounded-[22px] border border-white/10 bg-black/20 p-4 transition hover:bg-white/[0.05]">
                      <div className="text-lg font-black text-white">{relatedLinkRes.data.display_name || relatedLinkRes.data.slug}</div>
                      <div className="mt-2 text-sm text-white/62">{relatedLinkRes.data.headline || "Featured EVNTSZN Link page attached to this node."}</div>
                    </NodeTapLink>
                  ) : null}
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </section>
    </PublicPageFrame>
  );
}
