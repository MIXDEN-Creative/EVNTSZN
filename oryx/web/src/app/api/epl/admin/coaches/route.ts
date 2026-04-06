import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/epl/supabase-admin";

export async function GET() {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("epl_v_admin_coaches")
    .select("*");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ coaches: data || [] });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const supabase = getSupabaseAdmin();

  const [{ data: leagueRow, error: leagueError }, { data: seasonRow, error: seasonError }] = await Promise.all([
    supabase.schema("epl").from("leagues").select("id").eq("slug", "epl").single(),
    supabase.schema("epl").from("seasons").select("id").eq("slug", body.seasonSlug || "season-1").single(),
  ]);

  if (leagueError || seasonError) {
    return NextResponse.json({ error: leagueError?.message || seasonError?.message }, { status: 500 });
  }

  const payload = {
    league_id: leagueRow.id,
    season_id: seasonRow.id,
    first_name: body.firstName,
    last_name: body.lastName,
    email: body.email,
    phone: body.phone || null,
    coach_type: body.coachType || "head_coach",
    status: body.status || "active",
    assigned_team_id: body.assignedTeamId || null,
    bio: body.bio || null,
    years_experience: body.yearsExperience ? Number(body.yearsExperience) : null,
    specialties: body.specialties || [],
    is_archived: !!body.isArchived,
  };

  if (body.id) {
    const { error } = await supabase
      .schema("epl")
      .from("coach_profiles")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", body.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, updated: true });
  }

  const { error } = await supabase.schema("epl").from("coach_profiles").insert(payload);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, created: true });
}
