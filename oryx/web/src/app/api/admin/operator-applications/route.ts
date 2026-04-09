import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-auth";
import { getLoginUrl } from "@/lib/domains";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { inferOrganizerClassification, normalizeStringArray } from "@/lib/operator-access";

export async function GET() {
  await requireAdminPermission("admin.manage", "/epl/admin/approvals");

  const { data, error } = await supabaseAdmin
    .from("evntszn_applications")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ applications: data || [] });
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  let body: Record<string, unknown> = {};

  if (contentType.includes("application/json")) {
    body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  } else if (contentType.includes("form")) {
    const formData = await request.formData();
    body = Object.fromEntries(formData.entries());
  }

  const payload = {
    application_type: String(body.application_type || "host"),
    requested_role_key: String(body.requested_role_key || "").trim() || null,
    organizer_classification:
      String(body.organizer_classification || "").trim() ||
      inferOrganizerClassification(String(body.requested_role_key || body.application_type || "host")),
    full_name: String(body.full_name || "").trim(),
    email: String(body.email || "").trim().toLowerCase(),
    phone: String(body.phone || "").trim() || null,
    company_name: String(body.company_name || "").trim() || null,
    city: String(body.city || "").trim() || null,
    state: String(body.state || "").trim() || null,
    motivation: String(body.motivation || "").trim() || null,
    experience_summary: String(body.experience_summary || "").trim() || null,
    training_acknowledged: Boolean(body.training_acknowledged),
    terms_accepted: Boolean(body.terms_accepted),
    discovery_eligible: Boolean(body.discovery_eligible),
    desired_city_scope: normalizeStringArray(body.desired_city_scope || body.city),
    metadata: typeof body.metadata === "object" && body.metadata ? body.metadata : {},
  };

  if (!payload.full_name || !payload.email || !payload.terms_accepted) {
    return NextResponse.json(
      { error: "Name, email, and agreement acceptance are required." },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("evntszn_applications")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!contentType.includes("application/json")) {
    return NextResponse.redirect(getLoginUrl("/ops", new URL(request.url).host), 303);
  }

  return NextResponse.json({ ok: true, application: data });
}
