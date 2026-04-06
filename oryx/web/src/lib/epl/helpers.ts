import { getSupabaseAdmin } from "./supabase-admin";
import { EPL_LEAGUE_SLUG, EPL_SEASON_SLUG } from "./constants";
import { getCanonicalUrl } from "@/lib/domains";

type SeasonContextRow = {
  id: string;
  league_id: string;
  slug: string;
  name: string;
  player_fee_cents: number;
};

type LeagueContextRow = {
  id: string;
  slug: string;
  name: string;
};

export async function getSeasonContext() {
  const supabase = getSupabaseAdmin();

  const { data: seasonRow, error: seasonError } = await supabase
    .schema("epl")
    .from("seasons")
    .select("id, league_id, slug, name, player_fee_cents")
    .eq("slug", EPL_SEASON_SLUG)
    .maybeSingle();

  if (seasonError) {
    throw new Error(`Could not query EPL Season 1: ${seasonError.message}`);
  }

  if (!seasonRow) {
    throw new Error("Could not find EPL Season 1 in epl.seasons");
  }

  const row = seasonRow as SeasonContextRow;
  const { data: leagueRow, error: leagueError } = await supabase
    .schema("epl")
    .from("leagues")
    .select("id, slug, name")
    .eq("id", row.league_id)
    .eq("slug", EPL_LEAGUE_SLUG)
    .maybeSingle();

  if (leagueError) {
    throw new Error(`Could not query EPL league for Season 1: ${leagueError.message}`);
  }

  if (!leagueRow) {
    throw new Error("Could not find EPL league for Season 1");
  }

  const league = leagueRow as LeagueContextRow;

  return {
    seasonId: row.id,
    seasonName: row.name,
    leagueId: row.league_id,
    leagueName: league.name,
    feeCents: row.player_fee_cents,
  };
}

export function absoluteUrl(path: string, runtimeHost?: string) {
  return getCanonicalUrl(path, "epl", runtimeHost);
}
