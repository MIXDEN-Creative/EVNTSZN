import Image from "next/image";
import Link from "next/link";
import PublicFooter from "@/components/public/PublicFooter";
import EplNav from "@/components/epl/EplNav";
import { DEFAULT_EPL_PUBLIC_CONTENT } from "@/lib/site-content";
import { EPL_TEAM_PROFILES } from "@/lib/epl-teams";
import { getEplPublicSnapshot } from "@/lib/epl/public";

const conferenceCounts = EPL_TEAM_PROFILES.reduce(
  (acc, team) => {
    acc[team.conference] += 1;
    return acc;
  },
  { Baltimore: 0, Coastal: 0 },
);

export const dynamic = "force-dynamic";

export default async function EPLPage() {
  const snapshot = await getEplPublicSnapshot();
  const nextEvent = snapshot.events.find((event) => new Date(event.startAt).getTime() >= Date.now()) || null;

  return (
    <main className="min-h-screen bg-black text-white">
      <EplNav menu={DEFAULT_EPL_PUBLIC_CONTENT.menu} />
      <section className="relative overflow-hidden border-b border-white/10 pt-20">
        <div className="absolute inset-0">
          <Image
            src="/brand/eplhero.png"
            alt="Flag football under lights"
            fill
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/55 to-black" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-14 md:px-6 lg:px-8 lg:py-18">
          <div className="ev-kicker">EVNTSZN Prime League</div>
          <h1 className="mt-4 max-w-5xl text-5xl font-black tracking-[-0.05em] text-white md:text-7xl lg:text-[5.5rem] lg:leading-[0.9]">
            Flag football built for city pride, real competition, and live game-night energy.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/74">
            EPL is EVNTSZN’s city-based flag football league with Baltimore and Coastal conferences, twelve teams, live operations, registration, staffing, and game-night infrastructure.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/epl/season-1/register" className="ev-button-primary">Register</Link>
            <Link href="/epl/teams" className="ev-button-secondary">Meet the teams</Link>
            <Link href="/epl/opportunities" className="ev-button-secondary">Work EPL</Link>
          </div>
          <div className="mt-10 grid gap-3 md:max-w-4xl md:grid-cols-3">
            {[
              ["League status", nextEvent ? "Live season flow" : "Season setup active"],
              ["Next priority", nextEvent ? "Show up for the next kickoff" : "Registration and club buildout"],
              ["Why it lands", "Teams, standings, staffing, and game-night ops in one product"],
            ].map(([label, value]) => (
              <div key={label} className="ev-feature-card bg-black/30">
                <div className="ev-card-label">{label}</div>
                <div className="mt-3 text-xl font-black tracking-tight text-white">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="ev-feature-card">
            <div className="text-[11px] uppercase tracking-[0.22em] text-white/45">Teams</div>
            <div className="mt-3 text-3xl font-black text-white">{EPL_TEAM_PROFILES.length}</div>
          </div>
          <div className="ev-feature-card">
            <div className="text-[11px] uppercase tracking-[0.22em] text-white/45">Baltimore conference</div>
            <div className="mt-3 text-3xl font-black text-white">{conferenceCounts.Baltimore}</div>
          </div>
          <div className="ev-feature-card">
            <div className="text-[11px] uppercase tracking-[0.22em] text-white/45">Coastal conference</div>
            <div className="mt-3 text-3xl font-black text-white">{conferenceCounts.Coastal}</div>
          </div>
          <div className="ev-feature-card">
            <div className="text-[11px] uppercase tracking-[0.22em] text-white/45">Format</div>
            <div className="mt-3 text-3xl font-black text-white">7v7</div>
          </div>
          <div className="ev-feature-card">
            <div className="text-[11px] uppercase tracking-[0.22em] text-white/45">Registrations</div>
            <div className="mt-3 text-3xl font-black text-white">{snapshot.stats.registrationCount}</div>
          </div>
          <div className="ev-feature-card">
            <div className="text-[11px] uppercase tracking-[0.22em] text-white/45">Paid players</div>
            <div className="mt-3 text-3xl font-black text-white">{snapshot.stats.paidCount}</div>
          </div>
          <div className="ev-feature-card md:col-span-2">
            <div className="text-[11px] uppercase tracking-[0.22em] text-white/45">Next live league moment</div>
            <div className="mt-3 text-xl font-black text-white">
              {nextEvent ? nextEvent.title : snapshot.season.draft_event_title || "Season 1 operations"}
            </div>
            <div className="mt-2 text-sm text-white/60">
              {nextEvent
                ? new Date(nextEvent.startAt).toLocaleString()
                : snapshot.season.season_starts_at
                  ? `Season starts ${new Date(snapshot.season.season_starts_at).toLocaleDateString()}`
                  : "League timeline is active."}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-4 md:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {[
            {
              title: "Baltimore conference",
              teams: EPL_TEAM_PROFILES.filter((team) => team.conference === "Baltimore"),
            },
            {
              title: "Coastal conference",
              teams: EPL_TEAM_PROFILES.filter((team) => team.conference === "Coastal"),
            },
          ].map((conference) => (
            <div key={conference.title} className="ev-section-frame ev-section-frame--muted">
              <div className="ev-section-inner">
              <div className="ev-section-kicker">{conference.title}</div>
              <div className="mt-5 grid gap-3">
                {conference.teams.map((team) => (
                  <Link key={team.slug} href={`/epl/teams/${team.slug}`} className="ev-list-card transition hover:bg-white/[0.06]">
                    <div className="text-lg font-black text-white">{team.name}</div>
                    <div className="mt-1 text-sm text-white/58">{team.neighborhood} · {team.city}</div>
                  </Link>
                ))}
              </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:px-8 lg:pb-14">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            ["Schedule", "/epl/schedule", "Matchups, kickoff times, and season rhythm."],
            ["Standings", "/epl/standings", "Conference movement, records, and pressure points."],
            ["Opportunities", "/epl/opportunities", "Join league staffing, operations, or event-day coverage."],
          ].map(([title, href, body]) => (
            <Link key={href} href={href} className="ev-feature-card transition hover:bg-white/[0.06]">
              <div className="text-2xl font-black text-white">{title}</div>
              <div className="mt-3 text-sm leading-6 text-white/65">{body}</div>
            </Link>
          ))}
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
