import type { Metadata } from "next";
import EplNav from "@/components/epl/EplNav";
import DraftCountdown from "@/components/epl/DraftCountdown";
import Link from "next/link";
import { EPL_TEAM_PROFILES } from "@/lib/epl-teams";
import {
  DEFAULT_EPL_PUBLIC_CONTENT,
  DEFAULT_PUBLIC_MODULES,
  getEplPublicContent,
  getPublicModulesContent,
} from "@/lib/site-content";
import { getPublicSponsorPlacements } from "@/lib/sponsor-placements";
import SponsorPlacementStrip from "@/components/public/SponsorPlacementStrip";
import { safePublicLoad } from "@/lib/public-safe-load";
import PublicFooter from "@/components/public/PublicFooter";

export const metadata: Metadata = {
  title: "EPL | EVNTSZN Prime League",
  description:
    "Explore EVNTSZN Prime League, a premium coed city-built league with registration, draft-night energy, team identity, standings movement, and public schedule momentum.",
  alternates: {
    canonical: "https://epl.evntszn.com",
  },
};

export default async function EplPage() {
  const [content, modules, placements] = await Promise.all([
    safePublicLoad("epl-public-content", () => getEplPublicContent(), {
      ...DEFAULT_EPL_PUBLIC_CONTENT,
      storageReady: false,
    }),
    safePublicLoad("epl-public-modules", () => getPublicModulesContent(), {
      ...DEFAULT_PUBLIC_MODULES,
      storageReady: false,
    }),
    safePublicLoad("epl-sponsor-placements", () => getPublicSponsorPlacements("epl"), []),
  ]);

  return (
    <main className="min-h-screen bg-black text-white">
      <EplNav menu={content.menu} />

      <section className="relative overflow-hidden border-b border-white/10">
        <img
          src="https://images.unsplash.com/photo-1518604666860-9ed391f76460?auto=format&fit=crop&w=1800&q=80"
          alt="EVNTSZN Prime League flag football"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(162,89,255,0.30),transparent_35%),linear-gradient(180deg,rgba(0,0,0,0.40),rgba(0,0,0,0.84))]" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-16 md:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-24">
          <div>
            <div className="inline-flex rounded-full border border-white/15 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/90">
              {content.hero.eyebrow}
            </div>

            <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[0.93] tracking-[-0.05em] text-white md:text-7xl">
              {content.hero.title}
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-white/80 md:text-lg">
              {content.hero.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {content.menu.showRegister ? (
                <a
                  href={content.hero.primaryCtaHref}
                  className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90"
                >
                  {content.hero.primaryCtaLabel}
                </a>
              ) : null}
              {content.menu.showSchedule ? (
                <a
                  href="#schedule"
                  className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  {content.hero.secondaryCtaLabel}
                </a>
              ) : null}
              {content.menu.showDraftCountdown ? (
                <a
                  href="#countdown"
                  className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Draft Countdown
                </a>
              ) : null}
              <a
                href="https://evntszn.com"
                className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Back to EVNTSZN
              </a>
            </div>
          </div>

          <div className="grid gap-4">
            {[
              {
                label: "League shape",
                body: "Registration, rosters, quarterback pressure, flag pulls, and standings pressure all belong in one public-facing league surface.",
              },
              {
                label: "Why it matters",
                body: "EPL gives EVNTSZN a flag football vertical people can actually discover, follow, and join instead of a one-off registration page with no momentum.",
              },
              {
                label: "Built for pull",
                body: "Players, team communities, and curious city traffic should all have a reason to come back before, during, and after the season.",
              },
            ].map((item) => (
              <div key={item.label} className="rounded-[24px] border border-white/10 bg-white/8 p-5 backdrop-blur-xl">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/55">
                  {item.label}
                </div>
                <p className="mt-2 text-base leading-7 text-white/82">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:px-8">
        {content.menu.showDraftCountdown ? <DraftCountdown /> : null}

        <section className="mt-10 rounded-[32px] border border-white/10 bg-[#0c0c15] p-6 md:p-8">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b899ff]">
            Season overview
          </div>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white md:text-5xl">
            {content.sections.seasonHeadline}
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/72">
            {content.sections.seasonBody}
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              "Coed league structure",
              "Saturday, June 6 draft night",
              "City-rooted competition with real team identity",
            ].map((text) => (
              <div key={text} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/55">
                  Season 1
                </div>
                <div className="mt-2 text-xl font-bold text-white">{text}</div>
              </div>
            ))}
          </div>
        </section>

        {content.menu.showSchedule ? (
          <section id="schedule" className="mt-10 rounded-[32px] border border-white/10 bg-[#0c0c15] p-6 md:p-8">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b899ff]">
              Schedule
            </div>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white md:text-5xl">
              {content.sections.scheduleHeadline}
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-white/72">
              {content.sections.scheduleBody}
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                "Season opener and statement nights",
                "Mid-table pressure and rivalry fixtures",
                "Stretch-run matchups that move the standings",
              ].map((text) => (
                <div key={text} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/55">
                    League rhythm
                  </div>
                  <div className="mt-2 text-xl font-bold text-white">{text}</div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {content.menu.showTeams ? (
          <section id="teams" className="mt-10 rounded-[32px] border border-white/10 bg-[#0c0c15] p-6 md:p-8">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b899ff]">
              Teams
            </div>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white md:text-5xl">
              {content.sections.teamsHeadline}
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-white/72">
              {content.sections.teamsBody}
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {EPL_TEAM_PROFILES.map((team) => (
                <Link key={team.slug} href={`/epl/teams/${team.slug}`} className="rounded-[24px] border border-white/10 bg-white/5 p-5 hover:bg-white/[0.08]">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/55">
                    Season 1 Club
                  </div>
                  <div className="mt-2 text-2xl font-bold text-white">{team.name}</div>
                  <p className="mt-2 text-sm leading-6 text-white/72">{team.headline}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {content.menu.showStandings ? (
          <section id="standings" className="mt-10 rounded-[32px] border border-white/10 bg-[#0c0c15] p-6 md:p-8">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b899ff]">
              Standings
            </div>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white md:text-5xl">
              {content.sections.standingsHeadline}
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-white/72">
              {content.sections.standingsBody}
            </p>
            <div className="mt-6">
              <Link href="/epl/standings" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90">
                Open standings
              </Link>
            </div>
          </section>
        ) : null}

        {content.menu.showOpportunities ? (
          <section id="opportunities" className="mt-10 rounded-[32px] border border-white/10 bg-[#0c0c15] p-6 md:p-8">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b899ff]">
              {modules.opportunitiesBlock.eyebrow}
            </div>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white md:text-5xl">
              {modules.opportunitiesBlock.headline}
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-white/72">
              {modules.opportunitiesBlock.body}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/epl/opportunities" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90">
                Explore opportunities
              </Link>
              <Link href="/epl/opportunities#application" className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                Start an application
              </Link>
            </div>
          </section>
        ) : null}

        {content.menu.showStore ? (
          <section id="store" className="mt-10 rounded-[32px] border border-white/10 bg-[#0c0c15] p-6 md:p-8">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b899ff]">
              {modules.storePromo.eyebrow}
            </div>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white md:text-5xl">
              {modules.storePromo.headline || content.sections.storeHeadline}
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-white/72">
              {modules.storePromo.body || content.sections.storeBody}
            </p>
            <div className="mt-6">
              <Link href={modules.storePromo.ctaHref || "/epl/store"} className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90">
                {modules.storePromo.ctaLabel || "Shop EPL Store"}
              </Link>
            </div>
          </section>
        ) : null}

        {placements.length ? (
          <div className="mt-10">
            <SponsorPlacementStrip
              placements={placements}
              eyebrow={modules.sponsorBlock.eyebrow}
              headline={modules.sponsorBlock.headline}
              body={modules.sponsorBlock.body}
            />
          </div>
        ) : null}

        {content.menu.showFaq ? (
          <section className="mt-10 rounded-[32px] border border-white/10 bg-[#0c0c15] p-6 md:p-8">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b899ff]">
              How it works
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {[
                {
                  title: "Register",
                  body: "Players enter through the public registration flow with clear next steps and a clean path into the league.",
                },
                {
                  title: "Draft night",
                  body: "Saturday, June 6 sets the roster picture and locks in the clubs that define Season 1.",
                },
                {
                  title: "Follow the table",
                  body: "Schedule, team identity, and standings movement keep the season alive week after week.",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <div className="text-xl font-bold text-white">{item.title}</div>
                  <p className="mt-2 text-sm leading-6 text-white/72">{item.body}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <PublicFooter />
    </main>
  );
}
