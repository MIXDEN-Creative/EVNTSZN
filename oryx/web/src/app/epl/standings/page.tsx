import type { Metadata } from "next";
import Link from "next/link";
import EplNav from "@/components/epl/EplNav";
import { getEplOrigin } from "@/lib/domains";
import { resolveEplTeamProfile } from "@/lib/epl-teams";
import { getEplPublicContent } from "@/lib/site-content";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const metadata: Metadata = {
  title: "EPL Standings",
  description:
    "Follow the EVNTSZN Prime League table, club order, and official standings publication state for Season 1.",
  alternates: {
    canonical: `${getEplOrigin()}/standings`,
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

  const rows = teams.map((team, index) => {
    const profile = resolveEplTeamProfile({
      slug: team.slug,
      teamName: team.team_name,
    });
    return {
      rank: index + 1,
      name: team.team_name,
      slug: profile?.slug || team.slug,
      note: profile?.headline || "Season 1 club",
    };
  });

  return (
    <main className="min-h-screen bg-black text-white">
      <EplNav menu={content.menu} />
      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:px-8">
        <div className="ev-kicker">Standings</div>
        <h1 className="ev-title">Season 1 table and club order.</h1>
        <p className="ev-subtitle max-w-3xl">
          Official win-loss and points data will publish here once match results are recorded into the live league layer. Until then, the standings surface stays public, stable, and ready instead of returning a dead route.
        </p>

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
                {rows.map((row) => (
                  <tr key={row.slug}>
                    <td className="px-4 py-4 text-white/75">{row.rank}</td>
                    <td className="px-4 py-4">
                      <Link href={`/epl/teams/${row.slug}`} className="font-semibold text-white hover:text-[#d5c0ff]">
                        {row.name}
                      </Link>
                      <div className="mt-1 text-sm text-white/52">{row.note}</div>
                    </td>
                    <td className="px-4 py-4 text-white/55">—</td>
                    <td className="px-4 py-4 text-white/55">—</td>
                    <td className="px-4 py-4 text-white/55">—</td>
                    <td className="px-4 py-4 text-white/55">—</td>
                    <td className="px-4 py-4 text-white/55">—</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="ev-panel p-5">
            <div className="ev-section-kicker">Publication state</div>
            <p className="mt-3 text-sm leading-6 text-white/72">
              This page is live-ready now. Once official results are available, wins, losses, win percentage, and scoring columns can populate without changing the public route structure.
            </p>
          </div>
          <div className="ev-panel p-5">
            <div className="ev-section-kicker">Tie-breaker notes</div>
            <p className="mt-3 text-sm leading-6 text-white/72">
              Tie-breaker guidance, points logic, and additional table notes should be published here when league administration finalizes the official competition rules.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
