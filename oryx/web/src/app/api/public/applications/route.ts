import { NextResponse } from "next/server";
import { getLoginUrl } from "@/lib/domains";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { inferOrganizerClassification, normalizeStringArray } from "@/lib/operator-access";

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
    training_acknowledged:
      String(body.training_acknowledged || "").toLowerCase() === "true" ||
      body.training_acknowledged === "on",
    terms_accepted:
      String(body.terms_accepted || "").toLowerCase() === "true" ||
      body.terms_accepted === "on",
    discovery_eligible: false,
    desired_city_scope: normalizeStringArray(body.desired_city_scope || body.city),
    metadata: typeof body.metadata === "object" && body.metadata ? body.metadata : {},
  };

  if (!payload.full_name || !payload.email || !payload.terms_accepted) {
    return NextResponse.json(
      { error: "Name, email, and agreement acceptance are required." },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin.from("evntszn_applications").insert(payload);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!contentType.includes("application/json")) {
    return NextResponse.redirect(getLoginUrl("/ops", new URL(request.url).host), 303);
  }

  return NextResponse.json({ ok: true });
}
