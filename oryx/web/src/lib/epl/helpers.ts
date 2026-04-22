import { getSupabaseAdmin } from "./supabase-admin";
import { EPL_LEAGUE_SLUG, EPL_SEASON_SLUG } from "./constants";
import { getCanonicalUrl } from "@/lib/domains";
import { getSupabasePublicServerClient } from "@/lib/supabase-public-server";
import { isSupabaseCredentialError } from "@/lib/runtime-env";

type SeasonContextRow = {
  id: string;
  league_id: string;
  slug: string;
  name: string;
  player_fee_usd: number;
};

type LeagueContextRow = {
  id: string;
  slug: string;
  name: string;
};

export async function getSeasonContext() {
  const runSeasonQuery = async (supabase: ReturnType<typeof getSupabaseAdmin>) =>
    supabase
      .schema("epl")
      .from("seasons")
      .select("id, league_id, slug, name, player_fee_usd")
      .eq("slug", EPL_SEASON_SLUG)
      .maybeSingle();

  const runLeagueQuery = async (supabase: ReturnType<typeof getSupabaseAdmin>, leagueId: string) =>
    supabase
      .schema("epl")
      .from("leagues")
      .select("id, slug, name")
      .eq("id", leagueId)
      .eq("slug", EPL_LEAGUE_SLUG)
      .maybeSingle();

  let supabase = getSupabaseAdmin();
  let { data: seasonRow, error: seasonError } = await runSeasonQuery(supabase);
  if (seasonError && isSupabaseCredentialError(seasonError)) {
    supabase = getSupabasePublicServerClient() as ReturnType<typeof getSupabaseAdmin>;
    const fallback = await runSeasonQuery(supabase);
    seasonRow = fallback.data;
    seasonError = fallback.error;
  }

  if (seasonError) {
    throw new Error(`Could not query EPL Season 1: ${seasonError.message}`);
  }

  if (!seasonRow) {
    throw new Error("Could not find EPL Season 1 in epl.seasons");
  }

  const row = seasonRow as SeasonContextRow;
  let { data: leagueRow, error: leagueError } = await runLeagueQuery(supabase, row.league_id);
  if (leagueError && isSupabaseCredentialError(leagueError)) {
    const fallback = await runLeagueQuery(getSupabasePublicServerClient() as ReturnType<typeof getSupabaseAdmin>, row.league_id);
    leagueRow = fallback.data;
    leagueError = fallback.error;
  }

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
    feeUsd: Number(row.player_fee_usd || 0),
  };
}

export function absoluteUrl(path: string, runtimeHost?: string) {
  return getCanonicalUrl(path, "epl", runtimeHost);
}
