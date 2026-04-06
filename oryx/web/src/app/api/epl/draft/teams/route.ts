import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/epl/supabase-admin";

export async function GET(req: NextRequest) {
  const seasonSlug = req.nextUrl.searchParams.get("seasonSlug") || "season-1";
  const supabase = getSupabaseAdmin();

  const [{ data: teams, error: teamsError }, { data: needs, error: needsError }, { data: board, error: boardError }] =
    await Promise.all([
      supabase
        .from("epl_v_admin_team_roster_summary")
        .select("*")
        .eq("season_slug", seasonSlug)
        .order("team_name"),
      supabase
        .from("epl_v_admin_team_draft_needs")
        .select("*")
        .eq("season_slug", seasonSlug)
        .eq("is_active", true)
        .order("team_name")
        .order("need_rank"),
      supabase
        .from("epl_v_admin_full_draft_board")
        .select("*")
        .eq("season_slug", seasonSlug)
        .order("overall_pick_number"),
    ]);

  if (teamsError || needsError || boardError) {
    return NextResponse.json(
      { error: teamsError?.message || needsError?.message || boardError?.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    teams: teams || [],
    needs: needs || [],
    board: board || [],
  });
}
