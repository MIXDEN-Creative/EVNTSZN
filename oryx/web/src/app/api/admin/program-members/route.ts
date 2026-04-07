import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { normalizeStringArray } from "@/lib/operator-access";

export async function GET() {
  await requireAdminPermission("admin.manage", "/epl/admin/programs");

  const { data, error } = await supabaseAdmin
    .from("evntszn_program_members")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ members: data || [] });
}

export async function POST(request: Request) {
  await requireAdminPermission("admin.manage", "/epl/admin/programs");
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const payload = {
    program_key: String(body.program_key || "signal").trim(),
    status: String(body.status || "applicant").trim(),
    full_name: String(body.full_name || "").trim(),
    email: String(body.email || "").trim().toLowerCase(),
    phone: String(body.phone || "").trim() || null,
    city: String(body.city || "").trim() || null,
    state: String(body.state || "").trim() || null,
    operator_user_id: String(body.operator_user_id || "").trim() || null,
    assigned_manager_user_id: String(body.assigned_manager_user_id || "").trim() || null,
    role_tags: normalizeStringArray(body.role_tags),
    activation_state: String(body.activation_state || "pending").trim(),
    activation_readiness: String(body.activation_readiness || "review_needed").trim(),
    performance_stage: String(body.performance_stage || "new").trim(),
    referral_ready: Boolean(body.referral_ready),
    referral_code: String(body.referral_code || "").trim() || null,
    referral_slug: String(body.referral_slug || "").trim() || null,
    referred_count: Number(body.referred_count || 0),
    notes: String(body.notes || "").trim() || null,
    metadata: typeof body.metadata === "object" && body.metadata ? body.metadata : {},
  };

  if (!payload.full_name || !payload.email) {
    return NextResponse.json({ error: "Full name and email are required." }, { status: 400 });
  }

  if (body.id) {
    const { error } = await supabaseAdmin
      .from("evntszn_program_members")
      .update(payload)
      .eq("id", body.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, updated: true });
  }

  const { error } = await supabaseAdmin.from("evntszn_program_members").insert(payload);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, created: true });
}
