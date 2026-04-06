import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/epl/supabase-admin";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const supabase = getSupabaseAdmin();

  const action = body.action;

  if (action === "setEligibility") {
    const { seasonSlug, playerProfileId, isEligible, reason } = body;

    const { error } = await supabase.rpc("epl_set_player_draft_eligibility", {
      p_season_slug: seasonSlug,
      p_player_profile_id: playerProfileId,
      p_is_eligible: isEligible,
      p_reason: reason || null,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  if (action === "manualAssign") {
    const { draftPickId, playerProfileId, note } = body;

    const { error } = await supabase.rpc("epl_manual_assign_pick_player", {
      p_draft_pick_id: draftPickId,
      p_player_profile_id: playerProfileId,
      p_note: note || null,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  if (action === "swapPicks") {
    const { pickA, pickB, note } = body;

    const { error } = await supabase.rpc("epl_swap_draft_picks", {
      p_pick_a: pickA,
      p_pick_b: pickB,
      p_note: note || null,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unsupported override action." }, { status: 400 });
}
