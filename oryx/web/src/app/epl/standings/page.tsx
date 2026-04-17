import type { Metadata } from "next";
import Link from "next/link";
import EplNav from "@/components/epl/EplNav";
import PublicFooter from "@/components/public/PublicFooter";
import { getEplOrigin } from "@/lib/domains";
import { getEplPublicContent } from "@/lib/site-content";
import { getEplPublicSnapshot } from "@/lib/epl/public";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "EPL Club Table",
  description: "Track EPL club readiness, draft depth, roster buildout, and the current public Season 1 league table.",
  alternates: {
    canonical: `${getEplOrigin()}/standings`,
  },
};

export default async function EplStandingsPage() {
  const [content, snapshot] = await Promise.all([getEplPublicContent(), getEplPublicSnapshot()]);
  const conferenceLeaders = [
    ["Baltimore", snapshot.teams.find((team) => team.conference === "Baltimore") || null],
    ["Coastal", snapshot.teams.find((team) => team.conference === "Coastal") || null],
  ] as const;

  return (
    <main className="min-h-screen bg-black text-white">
      <EplNav menu={content.menu} />
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="ev-kicker">Season 1 club table</div>
            <h1 className="ev-title">Follow the league exactly where it stands today.</h1>
            <p className="ev-subtitle max-w-3xl">
              EPL is still in live roster-build and draft operations. Until official game results exist, the public table ranks clubs by roster strength, draft progress, and position-need pressure instead of publishing fake win-loss records.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="ev-meta-card">
              <div className="ev-meta-label">Draft-ready players</div>
              <div className="ev-meta-value">{snapshot.stats.draftEligibleCount}</div>
            </div>
            <div className="ev-meta-card">
              <div className="ev-meta-label">Rostered players</div>
              <div className="ev-meta-value">{snapshot.stats.assignedCount}</div>
            </div>
            <div className="ev-meta-card">
              <div className="ev-meta-label">Paid registrations</div>
              <div className="ev-meta-value">{snapshot.stats.paidCount}</div>
            </div>
            <div className="ev-meta-card">
              <div className="ev-meta-label">League events</div>
              <div className="ev-meta-value">{snapshot.stats.eventCount}</div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {conferenceLeaders.map(([conference, leader]) => (
            <div key={conference} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
              <div className="text-[11px] uppercase tracking-[0.22em] text-[#caa7ff]">{conference} leader</div>
              {leader ? (
                <>
                  <div className="mt-3 text-2xl font-black text-white">{leader.name}</div>
                  <div className="mt-2 text-sm text-white/62">{leader.headline}</div>
                  <div className="mt-4 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em] text-white/55">
                    <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1">Roster {leader.rosterSize}</span>
                    <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1">Need {leader.totalNeed}</span>
                    <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1">{leader.readinessLabel}</span>
                  </div>
                </>
              ) : (
                <div className="mt-3 text-sm text-white/60">No club data yet.</div>
              )}
            </div>
          ))}
        </div>

        <div className="ev-panel mt-8 overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 text-left">
              <thead className="bg-white/[0.04] text-[11px] uppercase tracking-[0.22em] text-white/45">
                <tr>
                  <th className="px-4 py-4">Rank</th>
                  <th className="px-4 py-4">Club</th>
                  <th className="px-4 py-4">Conference</th>
                  <th className="px-4 py-4">Roster</th>
                  <th className="px-4 py-4">Need</th>
                  <th className="px-4 py-4">Draft Order</th>
                  <th className="px-4 py-4">Readiness</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {snapshot.teams.map((team, index) => (
                  <tr key={team.id}>
                    <td className="px-4 py-4 text-white/75">{index + 1}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {team.logoUrl ? (
                          <img src={team.logoUrl} alt={team.name} className="h-12 w-12 rounded-2xl border border-white/10 object-cover" />
                        ) : null}
                        <div>
                          <Link href={`/epl/teams/${team.slug}`} className="font-semibold text-white hover:text-[#d5c0ff]">
                            {team.name}
                          </Link>
                          <div className="mt-1 text-sm text-white/52">{team.headline}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-white/60">{team.conference}</td>
                    <td className="px-4 py-4 text-white/80">{team.rosterSize}</td>
                    <td className="px-4 py-4 text-white/60">
                      QB {team.qbNeed} · WR {team.receiverNeed} · DEF {team.defenseNeed}
                    </td>
                    <td className="px-4 py-4 text-white/60">{team.draftOrder || "—"}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-white/85">{team.readinessScore}</span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#d7c0ff]">
                          {team.readinessLabel}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="ev-panel p-5">
            <div className="ev-section-kicker">How this table works</div>
            <p className="mt-3 text-sm leading-6 text-white/72">
              The public table ranks clubs by actual roster buildout, draft needs, and draft-position leverage until official score reporting begins. Once game results enter the operating system, this page can switch to a standard standings table without changing the public route.
            </p>
          </div>
          <div className="ev-panel p-5">
            <div className="ev-section-kicker">Next moves</div>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link href="/epl/schedule" className="ev-button-secondary">View schedule</Link>
              <Link href="/epl/season-1/register" className="ev-button-primary">Register for Season 1</Link>
            </div>
          </div>
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
