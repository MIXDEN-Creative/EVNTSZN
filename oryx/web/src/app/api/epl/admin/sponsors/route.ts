import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/epl/supabase-admin";

export async function GET(req: NextRequest) {
  const seasonSlug = req.nextUrl.searchParams.get("seasonSlug") || "season-1";
  const supabase = getSupabaseAdmin();

  const { data: seasonRow, error: seasonError } = await supabase
    .schema("epl")
    .from("seasons")
    .select("id")
    .eq("slug", seasonSlug)
    .single();

  if (seasonError) return NextResponse.json({ error: seasonError.message }, { status: 500 });

  const { data, error } = await supabase
    .schema("epl")
    .from("sponsor_partners")
    .select("*")
    .eq("season_id", seasonRow.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sponsors: data || [] });
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
    company_name: body.companyName,
    contact_name: body.contactName || null,
    contact_email: body.contactEmail || null,
    package_name: body.packageName || null,
    partner_status: body.partnerStatus || "lead",
    cash_value_cents: Number(body.cashValueCents || 0),
    in_kind_value_cents: Number(body.inKindValueCents || 0),
    notes: body.notes || null,
  };

  if (body.id) {
    const { error } = await supabase
      .schema("epl")
      .from("sponsor_partners")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, updated: true });
  }

  const { error } = await supabase.schema("epl").from("sponsor_partners").insert(payload);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, created: true });
}
