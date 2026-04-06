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
    .from("revenue_ledger")
    .select("*")
    .eq("season_id", seasonRow.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entries: data || [] });
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
    stream_code: body.streamCode,
    money_direction: body.moneyDirection,
    entry_status: body.entryStatus || "posted",
    amount_cents: Number(body.amountCents || 0),
    memo: body.memo || null,
    related_entity_type: body.relatedEntityType || null,
    related_entity_id: body.relatedEntityId || null,
  };

  if (body.id) {
    const { error } = await supabase
      .schema("epl")
      .from("revenue_ledger")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, updated: true });
  }

  const { error } = await supabase.schema("epl").from("revenue_ledger").insert(payload);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, created: true });
}
