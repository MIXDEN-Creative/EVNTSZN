import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/epl/supabase-admin";

export async function GET(req: NextRequest) {
  const seasonSlug = req.nextUrl.searchParams.get("seasonSlug") || "season-1";
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("epl_v_admin_draft_trades")
    .select("*")
    .eq("season_slug", seasonSlug)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ trades: data || [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const supabase = getSupabaseAdmin();

  if (body.action === "propose") {
    const { data, error } = await supabase.rpc("epl_propose_trade", {
      p_season_slug: body.seasonSlug,
      p_draft_session_id: body.draftSessionId,
      p_from_team_id: body.fromTeamId,
      p_to_team_id: body.toTeamId,
      p_from_pick_id: body.fromPickId,
      p_to_pick_id: body.toPickId,
      p_notes: body.notes || null,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, tradeId: data });
  }

  if (body.action === "resolve") {
    const { error } = await supabase.rpc("epl_resolve_trade", {
      p_trade_id: body.tradeId,
      p_resolution: body.resolution,
      p_note: body.note || null,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unsupported trade action." }, { status: 400 });
}
