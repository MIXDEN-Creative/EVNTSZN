import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/epl/supabase-admin";

export async function GET(req: NextRequest) {
  const seasonSlug = req.nextUrl.searchParams.get("seasonSlug") || "season-1";
  const supabase = getSupabaseAdmin();

  const [boardRes, poolRes, logRes, teamsRes, teamNotesRes, scoutNotesRes, tradesRes] =
    await Promise.all([
      supabase.from("epl_v_admin_full_draft_board").select("*").eq("season_slug", seasonSlug).order("overall_pick_number"),
      supabase.from("epl_v_admin_player_pool").select("*").eq("season_slug", seasonSlug).order("player_name"),
      supabase.from("epl_v_admin_draft_action_log").select("*").eq("season_slug", seasonSlug).order("created_at", { ascending: false }),
      supabase.from("epl_v_admin_team_roster_summary").select("*").eq("season_slug", seasonSlug).order("team_name"),
      supabase.from("epl_v_admin_team_war_room_notes").select("*").eq("season_slug", seasonSlug).order("created_at", { ascending: false }),
      supabase.from("epl_v_admin_player_scouting_notes").select("*").eq("season_slug", seasonSlug).order("created_at", { ascending: false }),
      supabase.from("epl_v_admin_draft_trades").select("*").eq("season_slug", seasonSlug).order("created_at", { ascending: false }),
    ]);

  const error =
    boardRes.error ||
    poolRes.error ||
    logRes.error ||
    teamsRes.error ||
    teamNotesRes.error ||
    scoutNotesRes.error ||
    tradesRes.error;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    seasonSlug,
    exportedAt: new Date().toISOString(),
    board: boardRes.data || [],
    playerPool: poolRes.data || [],
    actionLog: logRes.data || [],
    teams: teamsRes.data || [],
    teamNotes: teamNotesRes.data || [],
    scoutingNotes: scoutNotesRes.data || [],
    trades: tradesRes.data || [],
  });
}
