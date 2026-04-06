import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/epl/supabase-admin";

export async function GET(req: NextRequest) {
  const seasonSlug = req.nextUrl.searchParams.get("seasonSlug") || "season-1";
  const type = req.nextUrl.searchParams.get("type") || "team";
  const supabase = getSupabaseAdmin();

  if (type === "team") {
    const { data, error } = await supabase
      .from("epl_v_admin_team_war_room_notes")
      .select("*")
      .eq("season_slug", seasonSlug)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ notes: data || [] });
  }

  const { data, error } = await supabase
    .from("epl_v_admin_player_scouting_notes")
    .select("*")
    .eq("season_slug", seasonSlug)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ notes: data || [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const supabase = getSupabaseAdmin();

  if (body.type === "team") {
    const { error } = await supabase.rpc("epl_add_team_war_room_note", {
      p_season_slug: body.seasonSlug,
      p_team_id: body.teamId,
      p_note: body.note,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const { error } = await supabase.rpc("epl_add_player_scouting_note", {
    p_season_slug: body.seasonSlug,
    p_player_profile_id: body.playerProfileId,
    p_note: body.note,
    p_grade: body.grade || null,
    p_tags: body.tags || [],
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
