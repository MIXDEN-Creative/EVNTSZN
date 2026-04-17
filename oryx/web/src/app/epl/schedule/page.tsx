import type { Metadata } from "next";
import Link from "next/link";
import EplNav from "@/components/epl/EplNav";
import PublicFooter from "@/components/public/PublicFooter";
import { getEplOrigin } from "@/lib/domains";
import { getEplPublicContent } from "@/lib/site-content";
import { getEplPublicSnapshot } from "@/lib/epl/public";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "EPL Schedule",
  description: "Track EPL season windows, draft operations, public game-night events, and the next live league milestones.",
  alternates: {
    canonical: `${getEplOrigin()}/schedule`,
  },
};

function formatDateTime(value: string | null | undefined) {
  if (!value) return "TBD";
  return new Date(value).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function SchedulePage() {
  const [content, snapshot] = await Promise.all([getEplPublicContent(), getEplPublicSnapshot()]);
  const upcomingEvents = snapshot.events.filter((event) => new Date(event.startAt).getTime() >= Date.now());
  const completedEvents = snapshot.events.filter((event) => new Date(event.startAt).getTime() < Date.now()).slice(-4).reverse();

  return (
    <main className="min-h-screen bg-black text-white">
      <EplNav menu={content.menu} />
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <div>
            <div className="ev-kicker">Season 1 schedule</div>
            <h1 className="ev-title">League timing, draft flow, and live event windows in one place.</h1>
            <p className="ev-subtitle max-w-3xl">
              This schedule is driven by the active EPL season record, draft sessions, and public EPL-tagged event inventory. It stays useful even before the full game grid is populated.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="ev-meta-card">
              <div className="ev-meta-label">Registration opens</div>
              <div className="ev-meta-value text-base">{formatDateTime(snapshot.season.registration_opens_at)}</div>
            </div>
            <div className="ev-meta-card">
              <div className="ev-meta-label">Registration closes</div>
              <div className="ev-meta-value text-base">{formatDateTime(snapshot.season.registration_closes_at)}</div>
            </div>
            <div className="ev-meta-card">
              <div className="ev-meta-label">Season starts</div>
              <div className="ev-meta-value text-base">{formatDateTime(snapshot.season.season_starts_at)}</div>
            </div>
            <div className="ev-meta-card">
              <div className="ev-meta-label">Season ends</div>
              <div className="ev-meta-value text-base">{formatDateTime(snapshot.season.season_ends_at)}</div>
            </div>
          </div>
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6">
            <div className="text-[11px] uppercase tracking-[0.22em] text-[#caa7ff]">Season state</div>
            <div className="mt-3 text-2xl font-black text-white capitalize">{snapshot.season.status}</div>
            <p className="mt-3 text-sm leading-6 text-white/66">
              {snapshot.season.production_message || "League production messaging is active and routed through the season record."}
            </p>
          </div>
          <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6">
            <div className="text-[11px] uppercase tracking-[0.22em] text-[#caa7ff]">Draft state</div>
            <div className="mt-3 text-2xl font-black text-white capitalize">{snapshot.season.draft_state.replace(/_/g, " ")}</div>
            <p className="mt-3 text-sm leading-6 text-white/66">
              {snapshot.season.draft_event_title || "Season 1 Draft"} stays tied to the live draft console and public draftboard.
            </p>
          </div>
          <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6">
            <div className="text-[11px] uppercase tracking-[0.22em] text-[#caa7ff]">Paid registrations</div>
            <div className="mt-3 text-2xl font-black text-white">{snapshot.stats.paidCount}</div>
            <p className="mt-3 text-sm leading-6 text-white/66">
              {snapshot.stats.registrationCount} total registrations are currently in the league pipeline.
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
            <div className="ev-section-kicker">Draft operations</div>
            <div className="mt-5 grid gap-4">
              {snapshot.draftSessions.length ? (
                snapshot.draftSessions.map((session) => (
                  <div key={session.draft_session_id} className="rounded-[24px] border border-white/10 bg-black/25 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-lg font-black text-white">{session.title}</div>
                        <div className="mt-2 text-sm text-white/60">
                          Status: {session.status.replace(/_/g, " ")} · pick {session.current_pick_number || 0} of {session.total_picks || 0}
                        </div>
                      </div>
                      <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#d7c0ff]">
                        {session.production_state || "presentation"}
                      </div>
                    </div>
                    {(session.production_message || session.sponsor_message) ? (
                      <p className="mt-3 text-sm leading-6 text-white/68">
                        {session.production_message || session.sponsor_message}
                      </p>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="rounded-[24px] border border-dashed border-white/10 bg-black/20 p-5 text-sm leading-6 text-white/60">
                  No draft sessions are published yet. Registration and player-pool intake remain live.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
            <div className="ev-section-kicker">Upcoming EPL events</div>
            <div className="mt-5 grid gap-4">
              {upcomingEvents.length ? (
                upcomingEvents.map((event) => (
                  <Link key={event.id} href={`/events/${event.slug}`} className="rounded-[24px] border border-white/10 bg-black/25 p-5 transition hover:border-white/20 hover:bg-white/[0.06]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-lg font-black text-white">{event.title}</div>
                        <div className="mt-2 text-sm text-white/60">
                          {formatDateTime(event.startAt)} · {[event.city, event.state].filter(Boolean).join(", ")}
                        </div>
                      </div>
                      {event.homeSideLabel || event.awaySideLabel ? (
                        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/72">
                          {[event.homeSideLabel, event.awaySideLabel].filter(Boolean).join(" vs ")}
                        </div>
                      ) : null}
                    </div>
                    {event.subtitle ? <p className="mt-3 text-sm leading-6 text-white/68">{event.subtitle}</p> : null}
                  </Link>
                ))
              ) : (
                <div className="rounded-[24px] border border-dashed border-white/10 bg-black/20 p-5 text-sm leading-6 text-white/60">
                  The public game-night slate has not been published yet. Season timing, registration, and draft operations are still active now.
                </div>
              )}
            </div>
          </div>
        </section>

        {completedEvents.length ? (
          <section className="mt-8 rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
            <div className="ev-section-kicker">Recent league activity</div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {completedEvents.map((event) => (
                <Link key={event.id} href={`/events/${event.slug}`} className="rounded-[24px] border border-white/10 bg-black/25 p-5 transition hover:border-white/20 hover:bg-white/[0.06]">
                  <div className="text-lg font-black text-white">{event.title}</div>
                  <div className="mt-2 text-sm text-white/60">{formatDateTime(event.startAt)}</div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="ev-panel p-5">
            <div className="ev-section-kicker">Need the club table?</div>
            <p className="mt-3 text-sm leading-6 text-white/72">
              The standings route now reflects actual roster and draft-readiness pressure rather than fake scores.
            </p>
            <Link href="/epl/standings" className="ev-button-secondary mt-5">Open club table</Link>
          </div>
          <div className="ev-panel p-5">
            <div className="ev-section-kicker">Need to enter the season?</div>
            <p className="mt-3 text-sm leading-6 text-white/72">
              Registration, waiver, payment, and player-pool entry stay in one guided flow.
            </p>
            <Link href="/epl/season-1/register" className="ev-button-primary mt-5">Register now</Link>
          </div>
        </section>
      </section>
      <PublicFooter />
    </main>
  );
}
