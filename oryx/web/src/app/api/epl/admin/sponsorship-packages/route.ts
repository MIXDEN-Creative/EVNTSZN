import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/epl/supabase-admin";

export async function GET() {
  await requireAdminPermission("catalog.manage", "/epl/admin/sponsors");
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .schema("epl")
    .from("sponsorship_packages")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ packages: data || [] });
}

export async function POST(request: Request) {
  await requireAdminPermission("catalog.manage", "/epl/admin/operations");
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const supabase = getSupabaseAdmin();

  const payload = {
    package_name: String(body.package_name || "").trim(),
    description: String(body.description || "").trim() || null,
    cash_price_cents: Number(body.cash_price_cents || 0),
    in_kind_floor_cents: Number(body.in_kind_floor_cents || 0),
    benefits: Array.isArray(body.benefits) ? body.benefits : [],
    sort_order: Number(body.sort_order || 100),
    is_active: Boolean(body.is_active ?? true),
  };

  if (!payload.package_name) {
    return NextResponse.json({ error: "package_name is required." }, { status: 400 });
  }

  const { data: league, error: leagueError } = await supabase
    .schema("epl")
    .from("leagues")
    .select("id")
    .eq("slug", "epl")
    .single();

  if (leagueError || !league) {
    return NextResponse.json({ error: leagueError?.message || "League not found." }, { status: 500 });
  }

  if (body.id) {
    const { error } = await supabase
      .schema("epl")
      .from("sponsorship_packages")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", body.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, updated: true });
  }

  const { error } = await supabase.schema("epl").from("sponsorship_packages").insert({
    league_id: league.id,
    ...payload,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, created: true });
}
