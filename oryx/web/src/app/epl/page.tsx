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
    "Explore EVNTSZN Prime League, a coed adult flag football league with real clubs, draft-night energy, and a standings race worth following.",
  alternates: {
    canonical: "https://epl.evntszn.com",
  },
  openGraph: {
    title: "EPL | EVNTSZN Prime League",
    description:
      "Explore EVNTSZN Prime League, a coed adult flag football league with real clubs, draft-night energy, and a standings race worth following.",
    url: "https://epl.evntszn.com",
    siteName: "EVNTSZN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EPL | EVNTSZN Prime League",
    description:
      "Explore EVNTSZN Prime League, a coed adult flag football league with real clubs, draft-night energy, and a standings race worth following.",
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
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(162,89,255,0.35),transparent_45%),linear-gradient(180deg,rgba(0,0,0,0.30),rgba(0,0,0,0.92))]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-24 md:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:px-8 lg:py-36">
          <div className="flex flex-col justify-center">
            <div className="inline-flex w-fit rounded-full border border-white/15 bg-white/8 px-5 py-2 text-xs font-bold uppercase tracking-[0.24em] text-white/90">
              {content.hero.eyebrow}
            </div>

            <h1 className="mt-8 max-w-4xl text-6xl font-black leading-[0.9] tracking-[-0.05em] text-white md:text-8xl">
              {content.hero.title}
            </h1>

            <p className="mt-8 max-w-2xl text-lg leading-8 text-white/80 md:text-xl">
              {content.hero.description}
            </p>

            <div className="mt-12 flex flex-wrap gap-4">
              {content.menu.showRegister ? (
                <a
                  href={content.hero.primaryCtaHref}
                  className="rounded-full bg-white px-8 py-4 text-sm font-black uppercase tracking-widest text-black transition hover:opacity-90 active:scale-95"
                >
                  {content.hero.primaryCtaLabel}
                </a>
              ) : null}
              {content.menu.showSchedule ? (
                <a
                  href={content.hero.secondaryCtaHref}
                  className="rounded-full border border-white/20 bg-white/5 px-8 py-4 text-sm font-black uppercase tracking-widest text-white backdrop-blur-xl transition hover:bg-white/10 active:scale-95"
                >
                  {content.hero.secondaryCtaLabel}
                </a>
              ) : null}
            </div>
          </div>

          <div className="grid gap-6">
            {[
              {
                label: "League feel",
                body: "Draft night, flag pulls, quarterback pressure, and sideline momentum all live in one public league built to feel alive every week.",
              },
              {
                label: "Why people come back",
                body: "Players can register, supporters can follow the table, and every club has enough identity to keep people checking in between game nights.",
              },
              {
                label: "Built to travel city to city",
                body: "EPL keeps the same coed adult flag football standard across every market: club identity, organized competition, and game-day energy that feels worth following.",
              },
            ].map((item) => (
              <div key={item.label} className="rounded-[32px] border border-white/10 bg-black/40 p-8 backdrop-blur-2xl">
                <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/40">
                  {item.label}
                </div>
                <p className="mt-4 text-lg leading-8 text-white/90">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-20 md:px-6 lg:px-8 lg:py-32">
        {content.menu.showDraftCountdown ? <DraftCountdown /> : null}

        <section className="mt-24 rounded-[48px] border border-white/10 bg-[#0c0c15] p-10 md:p-16 lg:p-18">
          <div className="text-xs font-bold uppercase tracking-[0.24em] text-[#b899ff]">
            Season overview
          </div>
          <h2 className="mt-6 text-4xl font-black tracking-tight text-white md:text-7xl">
            {content.sections.seasonHeadline}
          </h2>
          <p className="mt-8 max-w-4xl text-lg leading-8 text-white/70">
            {content.sections.seasonBody}
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              "Coed league structure",
              "Saturday, June 6 draft night",
              "City-rooted competition with real team identity",
            ].map((text) => (
              <div key={text} className="rounded-[32px] border border-white/10 bg-white/5 p-8">
                <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/40">
                  Season 1
                </div>
                <div className="mt-4 text-2xl font-black text-white">{text}</div>
              </div>
            ))}
          </div>
        </section>

        {content.menu.showSchedule ? (
          <section id="schedule" className="mt-24 rounded-[48px] border border-white/10 bg-[#0c0c15] p-10 md:p-16 lg:p-18">
            <div className="text-xs font-bold uppercase tracking-[0.24em] text-[#b899ff]">
              Schedule
            </div>
            <h2 className="mt-6 text-4xl font-black tracking-tight text-white md:text-7xl">
              {content.sections.scheduleHeadline}
            </h2>
            <p className="mt-8 max-w-4xl text-lg leading-8 text-white/70">
              {content.sections.scheduleBody}
            </p>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                "Opening-night matchups and statement starts",
                "Rivalry weeks that tighten the table",
                "Stretch-run games that change playoff pressure",
              ].map((text) => (
                <div key={text} className="rounded-[32px] border border-white/10 bg-white/5 p-8">
                  <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/40">
                    League rhythm
                  </div>
                  <div className="mt-4 text-2xl font-black text-white">{text}</div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {content.menu.showTeams ? (
          <section id="teams" className="mt-24 rounded-[48px] border border-white/10 bg-[#0c0c15] p-10 md:p-16 lg:p-18">
            <div className="text-xs font-bold uppercase tracking-[0.24em] text-[#b899ff]">
              Teams
            </div>
            <h2 className="mt-6 text-4xl font-black tracking-tight text-white md:text-7xl">
              {content.sections.teamsHeadline}
            </h2>
            <p className="mt-8 max-w-4xl text-lg leading-8 text-white/70">
              {content.sections.teamsBody}
            </p>

            <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {EPL_TEAM_PROFILES.map((team) => (
                <Link key={team.slug} href={`/epl/teams/${team.slug}`} className="group rounded-[32px] border border-white/10 bg-white/5 p-8 transition-all hover:-translate-y-1 hover:bg-white/[0.08]">
                  <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/40">
                    Season 1 Team
                  </div>
                  <div className="mt-5 text-3xl font-black text-white">{team.name}</div>
                  <p className="mt-4 text-base leading-7 text-white/60">{team.headline}</p>
                  <div className="mt-8 inline-flex text-sm font-bold text-white/80 group-hover:text-white">
                    Open team page →
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-10">
              <Link href="/epl/teams" className="ev-button-secondary">
                View all teams
              </Link>
            </div>
          </section>
        ) : null}

        {content.menu.showStandings ? (
          <section id="standings" className="mt-14 rounded-[36px] border border-white/10 bg-[#0c0c15] p-8 md:p-10">
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
          <section id="opportunities" className="mt-14 rounded-[36px] border border-white/10 bg-[#0c0c15] p-8 md:p-10">
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
              <Link href="/epl/opportunities#roles" className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                View open roles
              </Link>
            </div>
          </section>
        ) : null}

        {content.menu.showStore ? (
          <section id="store" className="mt-14 rounded-[36px] border border-white/10 bg-[#0c0c15] p-8 md:p-10">
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
          <section className="mt-14 rounded-[36px] border border-white/10 bg-[#0c0c15] p-8 md:p-10">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b899ff]">
              How it works
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {[
                {
                  title: "Register",
                  body: "Players lock in their spot, build a player profile, and enter the league with a clean path into Season 1.",
                },
                {
                  title: "Draft night",
                  body: "Draft night sets the clubs, sharpens the storylines, and gives every team its opening shape.",
                },
                {
                  title: "Follow the table",
                  body: "Check the schedule, watch the standings move, and keep up with the clubs carrying the season.",
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
