import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import EplNav from "@/components/epl/EplNav";
import { getEplTeamProfile, EPL_TEAM_PROFILES } from "@/lib/epl-teams";
import { getEplPublicContent } from "@/lib/site-content";
import { getEplOrigin } from "@/lib/domains";

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
    title: `${team.name} | EPL`,
    description: `${team.name} public profile, schedule rhythm, roster context, and league identity within EVNTSZN Prime League.`,
    alternates: {
      canonical: `${getEplOrigin()}/teams/${team.slug}`,
    },
  };
}

export default async function EplTeamPage({ params }: TeamPageProps) {
  const { teamSlug } = await params;
  const team = getEplTeamProfile(teamSlug);

  if (!team) {
    notFound();
  }

  const content = await getEplPublicContent();

  return (
    <main className="min-h-screen bg-black text-white">
      <EplNav menu={content.menu} />
      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:px-8">
        <div className="ev-kicker">{team.neighborhood}</div>
        <h1 className="ev-title">{team.name}</h1>
        <p className="ev-subtitle max-w-3xl">{team.description}</p>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
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
            <div className="ev-section-kicker">Season rhythm</div>
            <div className="mt-4 space-y-4 text-sm leading-6 text-white/74">
              <p>Schedule, roster movement, and match-week announcements will publish here as Season 1 cadence locks in.</p>
              <p>When live match data is not available yet, this page still anchors team identity, league context, and a clean path back into the wider EPL public surface.</p>
            </div>
          </section>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {[
            {
              title: "Team schedule",
              body: "Fixtures will surface here as the official slate is published and weekly matchups lock.",
            },
            {
              title: "Roster",
              body: "Roster visibility lands after draft results and final registration confirmations are complete.",
            },
            {
              title: "Announcements",
              body: "Team news, match-day notes, and league updates will stack here once the club cycle is live.",
            },
          ].map((section) => (
            <section key={section.title} className="ev-panel p-5">
              <div className="text-xl font-bold text-white">{section.title}</div>
              <p className="mt-3 text-sm leading-6 text-white/72">{section.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/epl" className="ev-button-primary">
            Back to EPL
          </Link>
          <Link href="/epl/season-1/register" className="ev-button-secondary">
            Register for Season 1
          </Link>
        </div>
      </section>
    </main>
  );
}
