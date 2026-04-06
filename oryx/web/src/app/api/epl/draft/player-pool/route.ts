import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/epl/supabase-admin";

export async function GET(req: NextRequest) {
  const seasonSlug = req.nextUrl.searchParams.get("seasonSlug") || "season-1";
  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  const status = (req.nextUrl.searchParams.get("status") || "").trim();
  const position = (req.nextUrl.searchParams.get("position") || "").trim();

  const supabase = getSupabaseAdmin();

  let query = supabase
    .from("epl_v_admin_player_pool")
    .select("*")
    .eq("season_slug", seasonSlug)
    .order("registration_updated_at", { ascending: false });

  if (q) {
    query = query.or(
      `player_name.ilike.%${q}%,email.ilike.%${q}%,jersey_name.ilike.%${q}%`
    );
  }

  if (status === "draftable") {
    query = query.or("registration_status.eq.paid,and(registration_status.eq.approved,waived_fee.eq.true)");
  } else if (status === "assigned") {
    query = query.eq("assigned_to_team", true);
  } else if (status === "unassigned") {
    query = query.eq("assigned_to_team", false);
  }

  if (position) {
    query = query.or(`preferred_position.eq.${position},secondary_position.eq.${position}`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ players: data || [] });
}
