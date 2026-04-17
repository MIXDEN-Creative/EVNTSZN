import { supabaseAdmin } from "@/lib/supabase-admin";
import { resolveEplTeamProfile } from "@/lib/epl-teams";
import { getSeasonContext } from "@/lib/epl/helpers";

type SeasonRow = {
  id: string;
  slug: string;
  name: string;
  status: string;
  player_fee_usd: number;
  registration_opens_at: string | null;
  registration_closes_at: string | null;
  season_starts_at: string | null;
  season_ends_at: string | null;
  draft_event_title: string | null;
  draft_state: string;
  production_message: string | null;
  sponsor_message: string | null;
};

type TeamRow = {
  id: string;
  slug: string;
  team_name: string;
  team_code: string | null;
  team_logo_url: string | null;
  draft_order: number | null;
  captain_name: string | null;
  season_id: string;
};

type TeamRosterSummaryRow = {
  team_id: string;
  season_slug: string;
  team_name: string;
  team_logo_url: string | null;
  roster_size: number | null;
  drafted_players: string | null;
};

type TeamDraftNeedRow = {
  team_id: string;
  season_slug: string;
  team_name: string;
  team_logo_url: string | null;
  qb_need: number | null;
  receiver_need: number | null;
  defense_need: number | null;
};

type DraftSessionRow = {
  draft_session_id: string;
  season_slug: string;
  title: string;
  status: string;
  current_pick_number: number | null;
  total_picks: number | null;
  production_state: string | null;
  production_message: string | null;
  sponsor_message: string | null;
  created_at: string;
  updated_at: string;
};

type PlayerPoolRow = {
  registration_id: string;
  season_slug: string;
  registration_status: string | null;
  player_status: string | null;
  paid_at: string | null;
  is_draft_eligible: boolean | null;
};

type LeagueEventRow = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  city: string | null;
  state: string | null;
  start_at: string;
  end_at: string | null;
  status: string;
  visibility: string;
  event_collection: string | null;
  home_side_label: string | null;
  away_side_label: string | null;
};

export type EplPublicTeamSnapshot = {
  id: string;
  slug: string;
  name: string;
  teamCode: string;
  logoUrl: string;
  city: string;
  conference: "Baltimore" | "Coastal";
  headline: string;
  description: string;
  notes: string[];
  draftOrder: number | null;
  captainName: string | null;
  rosterSize: number;
  draftedPlayers: string[];
  qbNeed: number;
  receiverNeed: number;
  defenseNeed: number;
  totalNeed: number;
  readinessScore: number;
  readinessLabel: string;
};

export type EplPublicEventSnapshot = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  city: string | null;
  state: string | null;
  startAt: string;
  endAt: string | null;
  status: string;
  eventCollection: string | null;
  homeSideLabel: string | null;
  awaySideLabel: string | null;
};

export async function getEplPublicSnapshot() {
  const context = await getSeasonContext();
  const [{ data: season }, { data: teams }, { data: rosterSummary }, { data: draftNeeds }, { data: draftSessions }, { data: playerPool }, { data: leagueEvents }] =
    await Promise.all([
      supabaseAdmin
        .schema("epl")
        .from("seasons")
        .select("id, slug, name, status, player_fee_usd, registration_opens_at, registration_closes_at, season_starts_at, season_ends_at, draft_event_title, draft_state, production_message, sponsor_message")
        .eq("id", context.seasonId)
        .single(),
      supabaseAdmin
        .schema("epl")
        .from("teams")
        .select("id, slug, team_name, team_code, team_logo_url, draft_order, captain_name, season_id")
        .eq("season_id", context.seasonId)
        .eq("is_active", true)
        .order("draft_order", { ascending: true }),
      supabaseAdmin
        .from("epl_v_admin_team_roster_summary")
        .select("team_id, season_slug, team_name, team_logo_url, roster_size, drafted_players")
        .eq("season_slug", "season-1"),
      supabaseAdmin
        .from("epl_v_admin_team_draft_needs")
        .select("team_id, season_slug, team_name, team_logo_url, qb_need, receiver_need, defense_need")
        .eq("season_slug", "season-1"),
      supabaseAdmin
        .from("epl_v_draft_sessions")
        .select("draft_session_id, season_slug, title, status, current_pick_number, total_picks, production_state, production_message, sponsor_message, created_at, updated_at")
        .eq("season_slug", "season-1")
        .order("created_at", { ascending: true }),
      supabaseAdmin
        .from("epl_v_admin_player_pool")
        .select("registration_id, season_slug, registration_status, player_status, paid_at, is_draft_eligible")
        .eq("season_slug", "season-1"),
      supabaseAdmin
        .from("evntszn_events")
        .select("id, slug, title, subtitle, city, state, start_at, end_at, status, visibility, event_collection, home_side_label, away_side_label")
        .eq("event_vertical", "epl")
        .eq("visibility", "published")
        .order("start_at", { ascending: true }),
    ]);

  const teamRows = (teams || []) as TeamRow[];
  const rosterRows = new Map(((rosterSummary || []) as TeamRosterSummaryRow[]).map((row) => [row.team_id, row]));
  const needRows = new Map(((draftNeeds || []) as TeamDraftNeedRow[]).map((row) => [row.team_id, row]));
  const maxDraftOrder = Math.max(...teamRows.map((team) => Number(team.draft_order || 0)), 1);
  const teamSnapshots = teamRows
    .map((team) => {
      const profile = resolveEplTeamProfile({ slug: team.slug, teamName: team.team_name });
      const roster = rosterRows.get(team.id);
      const needs = needRows.get(team.id);
      const rosterSize = Number(roster?.roster_size || 0);
      const qbNeed = Number(needs?.qb_need || 0);
      const receiverNeed = Number(needs?.receiver_need || 0);
      const defenseNeed = Number(needs?.defense_need || 0);
      const totalNeed = qbNeed + receiverNeed + defenseNeed;
      const draftOrder = Number(team.draft_order || maxDraftOrder);
      const readinessScore = Math.max(
        0,
        Math.min(
          100,
          Math.round(
            rosterSize * 6 +
              Math.max(0, 24 - totalNeed * 5) +
              Math.max(0, (maxDraftOrder - draftOrder + 1) * 3),
          ),
        ),
      );
      const readinessLabel =
        readinessScore >= 80
          ? "Game-night ready"
          : readinessScore >= 60
            ? "Closing gaps"
            : readinessScore >= 40
              ? "Still building"
              : "Needs roster work";

      return {
        id: team.id,
        slug: profile?.slug || team.slug,
        name: profile?.name || team.team_name,
        teamCode: profile?.teamCode || team.team_code || "EPL",
        logoUrl: profile?.logoUrl || team.team_logo_url || "",
        city: profile?.city || "EPL City",
        conference: profile?.conference || "Baltimore",
        headline: profile?.headline || "League club",
        description: profile?.description || "EPL club profile",
        notes: profile?.notes || [],
        draftOrder: team.draft_order,
        captainName: team.captain_name,
        rosterSize,
        draftedPlayers: roster?.drafted_players
          ? roster.drafted_players.split(",").map((value) => value.trim()).filter(Boolean)
          : [],
        qbNeed,
        receiverNeed,
        defenseNeed,
        totalNeed,
        readinessScore,
        readinessLabel,
      } satisfies EplPublicTeamSnapshot;
    })
    .sort((left, right) => right.readinessScore - left.readinessScore || left.totalNeed - right.totalNeed || (left.draftOrder || 99) - (right.draftOrder || 99));

  const eventSnapshots = ((leagueEvents || []) as LeagueEventRow[]).map((event) => ({
    id: event.id,
    slug: event.slug,
    title: event.title,
    subtitle: event.subtitle,
    city: event.city,
    state: event.state,
    startAt: event.start_at,
    endAt: event.end_at,
    status: event.status,
    eventCollection: event.event_collection,
    homeSideLabel: event.home_side_label,
    awaySideLabel: event.away_side_label,
  })) satisfies EplPublicEventSnapshot[];

  const playerRows = (playerPool || []) as PlayerPoolRow[];
  const seasonStats = {
    registrationCount: playerRows.length,
    paidCount: playerRows.filter((row) => row.registration_status === "paid" || Boolean(row.paid_at)).length,
    draftEligibleCount: playerRows.filter((row) => row.is_draft_eligible).length,
    assignedCount: teamSnapshots.reduce((sum, team) => sum + team.rosterSize, 0),
    eventCount: eventSnapshots.length,
  };

  return {
    season: season as SeasonRow,
    teams: teamSnapshots,
    draftSessions: (draftSessions || []) as DraftSessionRow[],
    events: eventSnapshots,
    stats: seasonStats,
  };
}
