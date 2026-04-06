import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/epl/supabase-admin";

export async function GET() {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("epl_v_public_opportunities")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ opportunities: data || [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const supabase = getSupabaseAdmin();

  const {
    seasonSlug,
    opportunityId,
    firstName,
    lastName,
    email,
    phone,
    city,
    state,
    preferredRoles,
    experienceSummary,
    availabilitySummary,
    whyJoin,
  } = body;

  const { data: leagueRow, error: leagueError } = await supabase
    .schema("epl")
    .from("leagues")
    .select("id")
    .eq("slug", "epl")
    .single();

  if (leagueError) {
    return NextResponse.json({ error: leagueError.message }, { status: 500 });
  }

  let seasonId: string | null = null;

  if (seasonSlug) {
    const { data: seasonRow, error: seasonError } = await supabase
      .schema("epl")
      .from("seasons")
      .select("id")
      .eq("slug", seasonSlug)
      .maybeSingle();

    if (seasonError) {
      return NextResponse.json({ error: seasonError.message }, { status: 500 });
    }

    seasonId = seasonRow?.id || null;
  }

  const { error } = await supabase
    .schema("epl")
    .from("staff_applications")
    .insert({
      league_id: leagueRow.id,
      season_id: seasonId,
      opportunity_id: opportunityId || null,
      first_name: firstName,
      last_name: lastName,
      email,
      phone: phone || null,
      city: city || null,
      state: state || null,
      preferred_roles: preferredRoles || [],
      experience_summary: experienceSummary || null,
      availability_summary: availabilitySummary || null,
      why_join: whyJoin || null,
      status: "submitted",
      source: "evntszn_jobs_volunteer_page",
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
