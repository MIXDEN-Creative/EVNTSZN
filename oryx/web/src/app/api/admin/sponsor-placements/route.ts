import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { normalizeStringArray } from "@/lib/operator-access";

export async function GET() {
  await requireAdminPermission("catalog.manage", "/epl/admin/sponsors");

  const { data, error } = await supabaseAdmin
    .from("evntszn_sponsor_placements")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ placements: data || [] });
}

export async function POST(request: Request) {
  await requireAdminPermission("catalog.manage", "/epl/admin/sponsors");
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const payload = {
    sponsor_partner_id: String(body.sponsor_partner_id || "").trim() || null,
    sponsor_package_order_id: String(body.sponsor_package_order_id || "").trim() || null,
    sponsor_account_id: String(body.sponsor_account_id || "").trim() || null,
    name: String(body.name || "").trim(),
    type: String(body.type || "sponsor"),
    logo_url: String(body.logo_url || "").trim() || null,
    website_url: String(body.website_url || "").trim() || null,
    cta_label: String(body.cta_label || "").trim() || null,
    status: String(body.status || "draft"),
    visibility_locations: normalizeStringArray(body.visibility_locations),
    display_order: Number(body.display_order || 100),
    is_featured: Boolean(body.is_featured),
    starts_at: String(body.starts_at || "").trim() || null,
    ends_at: String(body.ends_at || "").trim() || null,
    notes: String(body.notes || "").trim() || null,
  };

  if (!payload.name) {
    return NextResponse.json({ error: "Placement name is required." }, { status: 400 });
  }

  if (body.id) {
    const { error } = await supabaseAdmin
      .from("evntszn_sponsor_placements")
      .update(payload)
      .eq("id", body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, updated: true });
  }

  const { error } = await supabaseAdmin.from("evntszn_sponsor_placements").insert(payload);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, created: true });
}
