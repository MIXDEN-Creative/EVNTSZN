import Link from "next/link";
import EplNav from "@/components/epl/EplNav";
import DraftCountdown from "@/components/epl/DraftCountdown";
import PublicFooter from "@/components/public/PublicFooter";
import { EPL_TEAM_PROFILES } from "@/lib/epl-teams";
import { getEplPublicContent } from "@/lib/site-content";
import {
  EPL_SCHEDULE_BLOCKS,
  ORGANIZER_PLANS,
  RESERVE_PLANS,
  VENUE_PLANS,
} from "@/lib/evntszn-business";

function renderTeamList(conference: "Baltimore" | "Coastal") {
  return (
    <div className="space-y-4">
      {EPL_TEAM_PROFILES.filter((team) => team.conference === conference).map((team) => (
        <Link
          key={team.slug}
          href={`/epl/teams/${team.slug}`}
          className="flex items-center gap-4 rounded-[22px] border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.08]"
        >
          <img src={team.logoUrl} alt={team.name} className="h-14 w-14 rounded-2xl border border-white/10 object-cover" />
          <div>
            <div className="text-lg font-bold text-white">{team.name}</div>
            <div className="text-sm text-white/60">{team.headline}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default async function EPLPage() {
  const content = await getEplPublicContent();
  return (
    <main className="min-h-screen bg-black text-white">
      <EplNav menu={content.menu} />
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 lg:px-8 lg:py-20">
        <div className="ev-kicker">Prime League</div>
        <h1 className="ev-title max-w-5xl">Coed adult flag football, fully wired from draft night to Prime Bowl.</h1>
        <p className="ev-subtitle max-w-3xl">
          EPL runs Baltimore and the coast through one league operating system: player registration, draft control, season schedule, playoff routing, and a real public home for supporters.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/epl/season-1/register" className="ev-button-primary">Register for Season 1</Link>
          <Link href="/epl/schedule" className="ev-button-secondary">See the schedule</Link>
          <Link href="/epl/teams" className="ev-button-secondary">Meet the clubs</Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-8 md:px-6 lg:px-8">
        <DraftCountdown />
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 md:px-6 lg:grid-cols-2 lg:px-8">
        <div className="ev-panel p-6">
          <div className="ev-section-kicker">League flow</div>
          <div className="mt-3 space-y-4 text-sm leading-6 text-white/74">
            {EPL_SCHEDULE_BLOCKS.draftNights.map((window) => (
              <div key={window.title} className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                <div className="text-lg font-bold text-white">{window.title}</div>
                <div className="mt-1 text-white/65">{window.label} · {window.timing}</div>
                <p className="mt-2">{window.body}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="ev-panel p-6">
          <div className="ev-section-kicker">Season structure</div>
          <div className="mt-3 space-y-3 text-sm leading-6 text-white/74">
            {EPL_SCHEDULE_BLOCKS.seasonFramework.map((note) => (
              <div key={note} className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">{note}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <h2 className="text-4xl font-black tracking-tight text-white">All 12 clubs are live.</h2>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="ev-panel p-6">
            <div className="ev-section-kicker">Baltimore conference</div>
            <div className="mt-4">{renderTeamList("Baltimore")}</div>
          </div>
          <div className="ev-panel p-6">
            <div className="ev-section-kicker">Coastal conference</div>
            <div className="mt-4">{renderTeamList("Coastal")}</div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="ev-panel p-6">
            <div className="ev-section-kicker">Player fee</div>
            <div className="mt-3 text-3xl font-black text-white">$95</div>
            <p className="mt-2 text-sm text-white/70">Season 1 registration, routed into waiver, draft intake, and payment tracking.</p>
          </div>
          <div className="ev-panel p-6">
            <div className="ev-section-kicker">Venue operating lane</div>
            <div className="mt-3 text-sm leading-6 text-white/74">{VENUE_PLANS[2].priceLabel}</div>
            <p className="mt-2 text-sm text-white/70">{VENUE_PLANS[2].note}</p>
          </div>
          <div className="ev-panel p-6">
            <div className="ev-section-kicker">Partner lane</div>
            <div className="mt-3 text-sm leading-6 text-white/74">{ORGANIZER_PLANS[1].priceLabel}</div>
            <p className="mt-2 text-sm text-white/70">Link Pro, premium conversion controls, and routing into the wider EVNTSZN system.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        <div className="ev-panel rounded-[32px] p-8">
          <div className="ev-section-kicker">Reserve and partner routing</div>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white">EPL is connected to the wider operating system.</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-5">
              <div className="text-lg font-bold text-white">{RESERVE_PLANS[0].label}</div>
              <div className="mt-2 text-sm text-white/70">{RESERVE_PLANS[0].priceLabel}</div>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-5">
              <div className="text-lg font-bold text-white">Prime Bowl partners</div>
              <div className="mt-2 text-sm text-white/70">Sponsorship packages, deliverables, and revenue tracking flow into the EPL admin operating layer.</div>
            </div>
          </div>
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
