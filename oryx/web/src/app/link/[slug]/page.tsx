import { notFound } from "next/navigation";
import PublicPageFrame from "@/components/public/PublicPageFrame";
import { LINK_PLAN_CONFIG, normalizeLinkPlan, safeJsonArray } from "@/lib/platform-products";
import { supabaseAdmin } from "@/lib/supabase-admin";
import LeadCaptureForm from "./LeadCaptureForm";
import LinkPageLiveMeta from "./LinkPageLiveMeta";
import TrackedEventLink from "./TrackedEventLink";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export default async function EvntsznLinkPage(context: RouteContext) {
  const { slug } = await context.params;
  const { data: page, error } = await supabaseAdmin
    .from("evntszn_link_pages")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !page) {
    notFound();
  }

  const [socialRes, offersRes, eventLinksRes, profileRes] = await Promise.all([
    supabaseAdmin
      .from("evntszn_link_social_links")
      .select("*")
      .eq("link_page_id", page.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabaseAdmin
      .from("evntszn_link_offers")
      .select("*")
      .eq("link_page_id", page.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabaseAdmin
      .from("evntszn_link_event_links")
      .select("sort_order, evntszn_events:event_id(id, title, slug, city, state, start_at, subtitle)")
      .eq("link_page_id", page.id)
      .order("sort_order", { ascending: true }),
    supabaseAdmin
      .from("evntszn_profiles")
      .select("full_name, city, state")
      .eq("user_id", page.user_id)
      .maybeSingle(),
  ]);

  const socialLinks = socialRes.data || [];
  const offers = offersRes.data || [];
  const pinnedEvents = (eventLinksRes.data || [])
    .map((item: any) => (Array.isArray(item.evntszn_events) ? item.evntszn_events[0] : item.evntszn_events))
    .filter(Boolean);
  const { data: ownedEvents } = await supabaseAdmin
    .from("evntszn_events")
    .select("id, title, slug, city, state, start_at, subtitle, organizer_user_id")
    .eq("organizer_user_id", page.user_id)
    .eq("visibility", "published")
    .eq("status", "published")
    .gte("start_at", new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString())
    .order("start_at", { ascending: true })
    .limit(4);
  const displayName = page.display_name || profileRes.data?.full_name || "EVNTSZN Curator";
  const location = [page.city || profileRes.data?.city, page.state || profileRes.data?.state].filter(Boolean).join(", ");
  const viewCount = Number((page.metadata || {}).view_count || 0);
  const plan = normalizeLinkPlan(page.plan_tier);
  const planConfig = LINK_PLAN_CONFIG[plan];
  const eventPool = pinnedEvents.length ? pinnedEvents : ownedEvents || [];
  const featuredEvents = eventPool.filter((event, index, rows) => rows.findIndex((entry) => entry.id === event.id) === index);
  const featuredEventIds = featuredEvents.map((event: any) => event.id);
  const { data: ticketRows } = featuredEventIds.length
    ? await supabaseAdmin
        .from("evntszn_ticket_types")
        .select("event_id, quantity_sold")
        .in("event_id", featuredEventIds)
    : { data: [] as Array<{ event_id: string; quantity_sold: number | null }> };
  const goingByEventId = new Map<string, number>();
  for (const ticket of ticketRows || []) {
    goingByEventId.set(ticket.event_id, (goingByEventId.get(ticket.event_id) || 0) + Number(ticket.quantity_sold || 0));
  }
  const activeEvent = featuredEvents.length
    ? [...featuredEvents].sort((left: any, right: any) => {
        const soldDelta = (goingByEventId.get(right.id) || 0) - (goingByEventId.get(left.id) || 0);
        if (soldDelta !== 0) return soldDelta;
        return new Date(left.start_at).getTime() - new Date(right.start_at).getTime();
      })[0]
    : null;
  const featuredCrewIds = safeJsonArray((page.metadata || {}).featuredCrewIds);
  const { data: featuredCrewRows } = featuredCrewIds.length
    ? await supabaseAdmin
        .from("evntszn_crew_profiles")
        .select("id, slug, display_name, category, custom_category, city, state, availability_state, headline")
        .in("id", featuredCrewIds)
        .eq("status", "published")
    : { data: [] as any[] };
  const featuredCrew = featuredCrewIds
    .map((id) => (featuredCrewRows || []).find((entry) => entry.id === id))
    .filter(Boolean);

  return (
    <PublicPageFrame>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(162,89,255,0.3),transparent_38%),linear-gradient(180deg,#0f0d18_0%,#08080d_65%,#050507_100%)]" />
        <div className="relative mx-auto max-w-[1500px] px-4 py-12 md:px-6 lg:px-8 lg:py-18">
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr] xl:gap-8">
            <div className="ev-section-frame">
              <div className="ev-dashboard-hero">
              <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#caa7ff]">
                {planConfig.brandingEnforced ? "Powered by EVNTSZN" : page.accent_label || displayName}
              </div>
              <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-[-0.05em] text-white md:text-6xl xl:text-7xl">{displayName}</h1>
              {location ? <div className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-white/48">{location}</div> : null}
              <p className="mt-4 max-w-2xl text-lg leading-8 text-white/76">{page.headline || "Premium EVNTSZN conversion page"}</p>
              {page.intro ? <p className="mt-4 max-w-2xl text-base leading-7 text-white/62">{page.intro}</p> : null}

              <div className="mt-7 flex flex-wrap gap-3">
                <LinkPageLiveMeta slug={slug} initialViewCount={viewCount} />
                {socialLinks.map((item) => (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm font-semibold text-white/84 transition hover:bg-white/10"
                  >
                    {item.label || item.platform}
                  </a>
                ))}
              </div>

              {activeEvent ? (
                <TrackedEventLink slug={slug} eventId={activeEvent.id} href={`/events/${activeEvent.slug}`} className="mt-8 block rounded-[30px] border border-[#A259FF]/25 bg-[linear-gradient(135deg,rgba(162,89,255,0.18),rgba(255,255,255,0.04)),rgba(0,0,0,0.28)] p-6 transition hover:-translate-y-0.5 hover:border-[#A259FF]/40">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#e2cbff]">Active event</div>
                      <div className="mt-2 text-3xl font-black tracking-tight text-white">{activeEvent.title}</div>
                      <div className="mt-3 text-sm leading-6 text-white/70">
                        {[activeEvent.city, activeEvent.state].filter(Boolean).join(", ")} • {new Date(activeEvent.start_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="rounded-full bg-white px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-black">
                      Buy ticket
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/68">
                    <span>{(goingByEventId.get(activeEvent.id) || 0).toLocaleString()} going</span>
                    <span>Newest live push</span>
                  </div>
                </TrackedEventLink>
              ) : null}

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {[
                  ["Plan", page.plan_tier],
                  ["Lead capture", page.email_capture_enabled ? "On" : "Off"],
                  ["Monetization", page.fee_bearing_enabled ? "Fee-ready" : "Direct links"],
                ].map(([label, value]) => (
                  <div key={String(label)} className="ev-feature-card">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-white/42">{label}</div>
                    <div className="mt-2 text-lg font-bold capitalize text-white">{value}</div>
                  </div>
                ))}
              </div>
              </div>
            </div>

            {planConfig.leadCapture ? <LeadCaptureForm slug={slug} /> : (
              <div className="ev-panel flex min-h-[320px] items-center justify-center p-6 md:p-8">
                <div className="max-w-sm text-center">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-[#caa7ff]">Lead capture</div>
                  <h2 className="mt-3 text-2xl font-black tracking-tight text-white">Upgrade to Pro to capture leads.</h2>
                  <p className="mt-3 text-sm leading-6 text-white/66">
                    Free and Starter links stay focused on simple traffic routing. Pro unlocks email and SMS-ready funnel capture.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-4 py-10 md:px-6 lg:px-8 lg:py-14">
        <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="space-y-6">
            <div className="ev-section-frame">
              <div className="ev-dashboard-hero">
              <div className="ev-section-kicker">Current events</div>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-white">Push guests into the live calendar first.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/66">
                Make the active ticket lane the dominant action on the page, then let offers and socials support it.
              </p>
              <div className="mt-6 grid gap-4">
                {featuredEvents.length ? (
                  featuredEvents.map((event: any) => (
                    <TrackedEventLink key={event.id} slug={slug} eventId={event.id} href={`/events/${event.slug}`} className={`rounded-[28px] border p-5 transition hover:bg-white/[0.06] md:p-6 ${activeEvent?.id === event.id ? "border-[#A259FF]/30 bg-[#A259FF]/10" : "border-white/12 bg-black/20"}`}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="text-[11px] uppercase tracking-[0.22em] text-[#caa7ff]">
                            {event.city}, {event.state}
                          </div>
                          <div className="mt-2 text-2xl font-black tracking-tight text-white">{event.title}</div>
                        </div>
                        <div className="rounded-full border border-white/10 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-black">
                          Tickets
                        </div>
                      </div>
                      {event.subtitle ? <p className="mt-3 text-sm leading-6 text-white/65">{event.subtitle}</p> : null}
                      <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold text-white/55">
                        <span>{new Date(event.start_at).toLocaleString()}</span>
                        <span>{(goingByEventId.get(event.id) || 0).toLocaleString()} going</span>
                      </div>
                    </TrackedEventLink>
                  ))
                ) : (
                  <div className="ev-empty-state text-sm leading-6">
                    No featured events are pinned to this EVNTSZN Link yet.
                  </div>
                )}
              </div>
              </div>
            </div>

            {featuredCrew.length ? (
              <div className="ev-section-frame ev-section-frame--muted">
                <div className="ev-dashboard-hero">
                <div className="ev-section-kicker">Tonight&apos;s crew</div>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-white">The people shaping the room.</h2>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {featuredCrew.map((member: any, index: number) => (
                    <a key={member.id} href={`/crew/${member.slug}`} className="ev-list-card transition hover:bg-white/[0.06]">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#d5b8ff]">
                          {index === 0 ? "Tonight’s DJ" : index === 1 ? "Official photographer" : "Featured crew"}
                        </span>
                        {member.availability_state === "available" ? (
                          <span className="rounded-full border border-emerald-400/25 bg-emerald-500/12 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-100">
                            Available now
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-3 text-2xl font-black tracking-tight text-white">{member.display_name}</div>
                      <div className="mt-2 text-sm uppercase tracking-[0.18em] text-white/48">
                        {(member.custom_category || member.category).replace(/_/g, " ")} • {[member.city, member.state].filter(Boolean).join(", ") || "Flexible"}
                      </div>
                      {member.headline ? <p className="mt-3 text-sm leading-6 text-white/65">{member.headline}</p> : null}
                    </a>
                  ))}
                </div>
                </div>
              </div>
            ) : null}
          </section>

          <section className="space-y-6">
            <div className="ev-section-frame ev-section-frame--muted">
              <div className="ev-dashboard-hero">
              <div className="ev-section-kicker">Offers</div>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-white">Sell directly from the page.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/66">
                Keep secondary offers clean, compact, and easy to scan after the event CTA.
              </p>
              <div className="mt-6 grid gap-4">
                {planConfig.funnelPages && offers.length ? (
                  offers.map((offer) => (
                    <a
                      key={offer.id}
                      href={offer.href}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.06]"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="text-[11px] uppercase tracking-[0.22em] text-[#caa7ff]">{String(offer.offer_type).replace(/_/g, " ")}</div>
                          <div className="mt-2 text-2xl font-black tracking-tight text-white">{offer.title}</div>
                        </div>
                        {offer.price_label ? (
                          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80">{offer.price_label}</div>
                        ) : null}
                      </div>
                      {offer.description ? <p className="mt-3 text-sm leading-6 text-white/65">{offer.description}</p> : null}
                      <div className="mt-5 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white">{offer.cta_label}</div>
                    </a>
                  ))
                ) : planConfig.funnelPages ? (
                  <div className="rounded-[26px] border border-dashed border-white/10 bg-black/20 p-6 text-sm leading-6 text-white/58">
                    No offers are live on this page yet.
                  </div>
                ) : (
                  <div className="rounded-[26px] border border-dashed border-white/10 bg-black/20 p-6 text-sm leading-6 text-white/58">
                    Funnel offers unlock on Pro.
                  </div>
                )}
              </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </PublicPageFrame>
  );
}
