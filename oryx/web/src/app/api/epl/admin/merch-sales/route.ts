import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/epl/supabase-admin";

export async function GET() {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("epl_v_admin_merch_sales")
    .select("*");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sales: data || [] });
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
    merch_catalog_id: body.merchCatalogId,
    quantity: Number(body.quantity || 1),
    gross_amount_cents: Number(body.grossAmountCents || 0),
    cost_amount_cents: Number(body.costAmountCents || 0),
    sale_channel: body.saleChannel || "on_site",
    sold_at: body.soldAt || new Date().toISOString(),
    notes: body.notes || null,
  };

  const { error } = await supabase.schema("epl").from("merch_sales").insert(payload);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, created: true });
}
