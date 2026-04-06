import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/epl/supabase-admin";

export async function GET(req: NextRequest) {
  const seasonSlug = req.nextUrl.searchParams.get("seasonSlug") || "season-1";
  const supabase = getSupabaseAdmin();

  const { data: session, error: sessionError } = await supabase
    .from("epl_v_draft_sessions")
    .select("*")
    .eq("season_slug", seasonSlug)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (sessionError) {
    return NextResponse.json({ error: sessionError.message }, { status: 500 });
  }

  if (!session) {
    return NextResponse.json({ session: null, picks: [], currentPick: null, nextPick: null, revealedPicks: [] });
  }

  const { data: picks, error: picksError } = await supabase
    .from("epl_v_draft_presentation_picks")
    .select("*")
    .eq("draft_session_id", session.draft_session_id)
    .order("overall_pick_number", { ascending: true });

  if (picksError) {
    return NextResponse.json({ error: picksError.message }, { status: 500 });
  }

  const allPicks = picks || [];
  const currentPick =
    allPicks.find((pick) => pick.overall_pick_number === session.current_pick_number) || null;
  const nextPick =
    allPicks.find((pick) => pick.overall_pick_number === session.current_pick_number + 1) || null;
  const revealedPicks = allPicks.filter(
    (pick) => pick.overall_pick_number <= session.current_pick_number
  );

  return NextResponse.json({
    session,
    picks: allPicks,
    currentPick,
    nextPick,
    revealedPicks,
  });
}
