import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { normalizeStringArray } from "@/lib/operator-access";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET() {
  await requireAdminPermission("catalog.manage", "/epl/admin/sponsors");

  const { data, error } = await supabaseAdmin
    .from("evntszn_sponsor_accounts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sponsorAccounts: data || [] });
}

export async function POST(request: Request) {
  await requireAdminPermission("catalog.manage", "/epl/admin/sponsors");
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const name = String(body.name || "").trim();
  const payload = {
    name,
    slug: String(body.slug || "").trim() || slugify(name),
    account_type: String(body.account_type || "sponsor").trim(),
    scope_type: String(body.scope_type || "platform").trim(),
    city_scope: normalizeStringArray(body.city_scope),
    scope_reference: String(body.scope_reference || "").trim() || null,
    tier_label: String(body.tier_label || "").trim() || null,
    status: String(body.status || "lead").trim(),
    logo_url: String(body.logo_url || "").trim() || null,
    website_url: String(body.website_url || "").trim() || null,
    cta_label: String(body.cta_label || "").trim() || null,
    is_featured: Boolean(body.is_featured),
    relationship_owner_user_id: String(body.relationship_owner_user_id || "").trim() || null,
    starts_at: String(body.starts_at || "").trim() || null,
    ends_at: String(body.ends_at || "").trim() || null,
    activation_status: String(body.activation_status || "prospect").trim(),
    fulfillment_status: String(body.fulfillment_status || "not_started").trim(),
    asset_ready: Boolean(body.asset_ready),
    epl_category: String(body.epl_category || "").trim() || null,
    notes: String(body.notes || "").trim() || null,
    metadata: typeof body.metadata === "object" && body.metadata ? body.metadata : {},
    history: Array.isArray(body.history) ? body.history : [],
  };

  if (!payload.name) {
    return NextResponse.json({ error: "Sponsor name is required." }, { status: 400 });
  }

  if (body.id) {
    const { error } = await supabaseAdmin
      .from("evntszn_sponsor_accounts")
      .update(payload)
      .eq("id", body.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, updated: true });
  }

  const { error } = await supabaseAdmin.from("evntszn_sponsor_accounts").insert(payload);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, created: true });
}
