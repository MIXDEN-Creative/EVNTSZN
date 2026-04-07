import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { normalizeStringArray } from "@/lib/operator-access";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  let body: Record<string, unknown> = {};

  if (contentType.includes("application/json")) {
    body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  } else {
    const formData = await request.formData();
    body = Object.fromEntries(formData.entries());
  }

  const programKey = String(body.program_key || "").trim();
  if (programKey !== "signal" && programKey !== "ambassador") {
    return NextResponse.json({ error: "A valid program key is required." }, { status: 400 });
  }

  const payload = {
    program_key: programKey,
    status: "applicant",
    full_name: String(body.full_name || "").trim(),
    email: String(body.email || "").trim().toLowerCase(),
    phone: String(body.phone || "").trim() || null,
    city: String(body.city || "").trim() || null,
    state: String(body.state || "").trim() || null,
    role_tags: normalizeStringArray(body.role_tags || body.city),
    activation_state: "pending",
    referral_ready:
      String(body.referral_ready || "").toLowerCase() === "true" ||
      body.referral_ready === "on",
    notes: String(body.notes || "").trim() || null,
    metadata: {
      source_surface: "public_program_application",
      motivation: String(body.motivation || "").trim() || null,
      experience_summary: String(body.experience_summary || "").trim() || null,
    },
  };

  if (!payload.full_name || !payload.email) {
    return NextResponse.json({ error: "Full name and email are required." }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("evntszn_program_members").insert(payload);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
