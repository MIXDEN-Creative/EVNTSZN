import type { Metadata } from "next";
import Link from "next/link";
import EplNav from "@/components/epl/EplNav";
import { getEplOrigin } from "@/lib/domains";
import { EPL_TEAM_PROFILES, resolveEplTeamProfile } from "@/lib/epl-teams";
import { getEplPublicContent } from "@/lib/site-content";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const metadata: Metadata = {
  title: "EPL Standings",
  description:
    "Follow the EVNTSZN Prime League table, club order, and the Season 1 standings race.",
  alternates: {
    canonical: `${getEplOrigin()}/standings`,
  },
  openGraph: {
    title: "EPL Standings",
    description:
      "Follow the EVNTSZN Prime League table, club order, and the Season 1 standings race.",
    url: `${getEplOrigin()}/standings`,
    siteName: "EVNTSZN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EPL Standings",
    description:
      "Follow the EVNTSZN Prime League table, club order, and the Season 1 standings race.",
  },
};

type TeamRow = {
  slug: string;
  team_name: string;
  draft_order: number | null;
};

export default async function EplStandingsPage() {
  const [content, seasonRes, teamsRes] = await Promise.all([
    getEplPublicContent(),
    supabaseAdmin.schema("epl").from("seasons").select("id").eq("slug", "season-1").maybeSingle(),
    supabaseAdmin.schema("epl").from("teams").select("slug, team_name, draft_order, season_id").eq("is_active", true).order("draft_order", { ascending: true }),
  ]);

  const seasonId = seasonRes.data?.id || null;
  const teams = ((teamsRes.data || []) as Array<TeamRow & { season_id?: string | null }>).filter(
    (team) => !seasonId || team.season_id === seasonId,
  );
  const bySlug = new Map(teams.map((team) => [resolveEplTeamProfile({ slug: team.slug, teamName: team.team_name })?.slug || team.slug, team]));
  const activeRows = EPL_TEAM_PROFILES.map((profile, index) => {
    const team = bySlug.get(profile.slug);
    return {
      rank: index + 1,
      name: team?.team_name || profile.name,
      slug: profile.slug,
      note: profile.headline,
      hasLiveRecord: Boolean(team),
    };
  });
  const hasSeasonRows = teams.length > 0;

  return (
    <main className="min-h-screen bg-black text-white">
      <EplNav menu={content.menu} />
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 lg:px-8 lg:py-20">
        <div className="ev-kicker">Standings</div>
        <h1 className="ev-title">Season 1 standings and league table.</h1>
        <p className="ev-subtitle max-w-3xl">
          Follow the official Season 1 table here. Once score reporting opens, wins, losses, scoring, and weekly movement will publish in the same league view players and supporters are already using.
        </p>

        {!hasSeasonRows ? (
          <div className="ev-panel mt-10 p-7">
            <div className="ev-section-kicker">Table opens soon</div>
            <h2 className="mt-3 text-2xl font-black text-white">The clubs are set. The standings go live after the first whistle.</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/72">
              Season 1 teams are locked in below, and the public table is ready. Match results will start populating as soon as opening-night scores are reported.
            </p>
          </div>
        ) : null}

        <div className="ev-panel mt-8 overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 text-left">
              <thead className="bg-white/[0.04] text-[11px] uppercase tracking-[0.22em] text-white/45">
                <tr>
                  <th className="px-4 py-4">Rank</th>
                  <th className="px-4 py-4">Club</th>
                  <th className="px-4 py-4">W</th>
                  <th className="px-4 py-4">L</th>
                  <th className="px-4 py-4">Win %</th>
                  <th className="px-4 py-4">PF</th>
                  <th className="px-4 py-4">PA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {activeRows.map((row) => (
                  <tr key={row.slug}>
                    <td className="px-4 py-4 text-white/75">{row.rank}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={EPL_TEAM_PROFILES.find((team) => team.slug === row.slug)?.logoUrl}
                          alt={row.name}
                          className="h-12 w-12 rounded-2xl border border-white/10 object-cover"
                        />
                        <div>
                          <Link href={`/epl/teams/${row.slug}`} className="font-semibold text-white hover:text-[#d5c0ff]">
                            {row.name}
                          </Link>
                          <div className="mt-1 text-sm text-white/52">{row.note}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-white/55">{row.hasLiveRecord ? "—" : "—"}</td>
                    <td className="px-4 py-4 text-white/55">{row.hasLiveRecord ? "—" : "—"}</td>
                    <td className="px-4 py-4 text-white/55">{row.hasLiveRecord ? "—" : "—"}</td>
                    <td className="px-4 py-4 text-white/55">{row.hasLiveRecord ? "—" : "—"}</td>
                    <td className="px-4 py-4 text-white/55">{row.hasLiveRecord ? "—" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="ev-panel p-5">
            <div className="ev-section-kicker">Preseason state</div>
            <p className="mt-3 text-sm leading-6 text-white/72">
              This table is already set for the season. Once scores go official, the same page carries every weekly move without dumping seeded leftovers into public view.
            </p>
          </div>
          <div className="ev-panel p-5">
            <div className="ev-section-kicker">What to expect</div>
            <p className="mt-3 text-sm leading-6 text-white/72">
              Expect win-loss order, scoring totals, and team pages to stay linked so players and supporters can move from the table straight into the clubs driving the season.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
