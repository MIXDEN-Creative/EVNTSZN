import type { Metadata } from "next";
import Link from "next/link";
import EplNav from "@/components/epl/EplNav";
import PublicFooter from "@/components/public/PublicFooter";
import { getEplOrigin } from "@/lib/domains";
import { EPL_TEAM_PROFILES } from "@/lib/epl-teams";
import { getEplPublicContent } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "EPL Teams",
  description:
    "Meet the Season 1 clubs in EVNTSZN Prime League and follow the teams carrying coed adult flag football into draft night and game-day competition.",
  alternates: {
    canonical: `${getEplOrigin()}/teams`,
  },
  openGraph: {
    title: "EPL Teams",
    description:
      "Meet the Season 1 clubs in EVNTSZN Prime League and follow the teams carrying coed adult flag football into draft night and game-day competition.",
    url: `${getEplOrigin()}/teams`,
    siteName: "EVNTSZN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EPL Teams",
    description:
      "Meet the Season 1 clubs in EVNTSZN Prime League and follow the teams carrying coed adult flag football into draft night and game-day competition.",
  },
};

export default async function EplTeamsPage() {
  const content = await getEplPublicContent();

  return (
    <main className="min-h-screen bg-black text-white">
      <EplNav menu={content.menu} />
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 lg:px-8 lg:py-20">
        <div className="ev-kicker">Season 1 clubs</div>
        <h1 className="ev-title">Six teams. One league. Real flag football identity.</h1>
        <p className="ev-subtitle max-w-3xl">
          EPL teams are built to be followed all season: draft-night storylines, city pride, sideline energy, and clubs worth showing up for on game day.
        </p>

        <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {EPL_TEAM_PROFILES.map((team) => (
            <Link
              key={team.slug}
              href={`/epl/teams/${team.slug}`}
              className="ev-panel block p-6 transition hover:border-white/20 hover:bg-white/[0.08]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#b899ff]">
                    {team.neighborhood}
                  </div>
                  <h2 className="mt-3 text-2xl font-black text-white">{team.name}</h2>
                </div>
                <img src={team.logoUrl} alt={team.name} className="h-16 w-16 rounded-2xl border border-white/10 object-cover" />
              </div>
              <p className="mt-3 text-sm leading-6 text-white/72">{team.headline}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {team.notes.map((note) => (
                  <span key={note} className="ev-chip ev-chip--external">
                    {note}
                  </span>
                ))}
              </div>
              <div className="mt-6 text-sm font-semibold text-white">Open team page</div>
            </Link>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/epl/standings" className="ev-button-primary">
            View standings
          </Link>
          <Link href="/epl/season-1/register" className="ev-button-secondary">
            Register for Season 1
          </Link>
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
