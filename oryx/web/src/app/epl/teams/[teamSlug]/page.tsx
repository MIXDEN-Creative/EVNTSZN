import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import EplNav from "@/components/epl/EplNav";
import SponsorPlacementStrip from "@/components/public/SponsorPlacementStrip";
import PublicFooter from "@/components/public/PublicFooter";
import { getEplTeamProfile, EPL_TEAM_PROFILES } from "@/lib/epl-teams";
import { getEplPublicContent, getPublicModulesContent } from "@/lib/site-content";
import { getEplOrigin } from "@/lib/domains";
import { getPublicSponsorPlacements } from "@/lib/sponsor-placements";

type TeamPageProps = {
  params: Promise<{ teamSlug: string }>;
};

export async function generateStaticParams() {
  return EPL_TEAM_PROFILES.map((team) => ({ teamSlug: team.slug }));
}

export async function generateMetadata({ params }: TeamPageProps): Promise<Metadata> {
  const { teamSlug } = await params;
  const team = getEplTeamProfile(teamSlug);

  if (!team) return {};

  return {
    title: `${team.name}`,
    description: `${team.name} team page with club identity, Season 1 storylines, and a clean path back into EVNTSZN Prime League.`,
    alternates: {
      canonical: `${getEplOrigin()}/teams/${team.slug}`,
    },
    openGraph: {
      title: `${team.name}`,
      description: `${team.name} team page with club identity, Season 1 storylines, and a clean path back into EVNTSZN Prime League.`,
      url: `${getEplOrigin()}/teams/${team.slug}`,
      siteName: "EVNTSZN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${team.name}`,
      description: `${team.name} team page with club identity, Season 1 storylines, and a clean path back into EVNTSZN Prime League.`,
    },
  };
}

export default async function EplTeamPage({ params }: TeamPageProps) {
  const { teamSlug } = await params;
  const team = getEplTeamProfile(teamSlug);

  if (!team) {
    notFound();
  }

  const [content, modules, sponsorPlacements] = await Promise.all([
    getEplPublicContent(),
    getPublicModulesContent(),
    getPublicSponsorPlacements([`team:${team.slug}`, "team", "epl"]),
  ]);

  return (
    <main className="min-h-screen bg-black text-white">
      <EplNav menu={content.menu} />
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 lg:px-8 lg:py-20">
        <div className="ev-kicker">{team.neighborhood}</div>
        <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="ev-title">{team.name}</h1>
            <p className="ev-subtitle max-w-3xl">{team.description}</p>
          </div>
          <img src={team.logoUrl} alt={team.name} className="h-32 w-32 rounded-[28px] border border-white/10 object-cover" />
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="ev-panel p-6">
            <div className="ev-section-kicker">Identity</div>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white">{team.headline}</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {team.notes.map((note) => (
                <div key={note} className="rounded-[22px] border border-white/10 bg-white/5 p-4 text-sm leading-6 text-white/74">
                  {note}
                </div>
              ))}
            </div>
          </section>

          <section className="ev-panel p-6">
            <div className="ev-section-kicker">Season 1 focus</div>
            <div className="mt-4 space-y-4 text-sm leading-6 text-white/74">
              <p>Use this page to keep up with the club identity, follow the standings race, and jump back into registration or the league table without losing the thread.</p>
              <p>As weekly results land, this page becomes the fastest way to move from one club into the wider EPL race.</p>
            </div>
          </section>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {[
            {
              title: modules.teamBlocks.scheduleHeadline,
              body: modules.teamBlocks.scheduleBody,
            },
            {
              title: modules.teamBlocks.rosterHeadline,
              body: modules.teamBlocks.rosterBody,
            },
            {
              title: modules.teamBlocks.announcementsHeadline,
              body: modules.teamBlocks.announcementsBody,
            },
          ].map((section) => (
            <section key={section.title} className="ev-panel p-5">
              <div className="text-xl font-bold text-white">{section.title}</div>
              <p className="mt-3 text-sm leading-6 text-white/72">{section.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/epl/season-1/register" className="ev-button-primary">
            Register for Season 1
          </Link>
          <Link href="/epl/standings" className="ev-button-secondary">
            Check standings
          </Link>
          <Link href="/epl/teams" className="ev-button-secondary">
            Back to teams
          </Link>
        </div>

        {sponsorPlacements.length ? (
          <div className="mt-10">
            <SponsorPlacementStrip
              placements={sponsorPlacements}
              eyebrow={modules.sponsorBlock.eyebrow}
              headline={`${team.name} sponsor placements`}
              body={modules.sponsorBlock.body}
              compact
            />
          </div>
        ) : null}
      </section>
      <PublicFooter />
    </main>
  );
}
