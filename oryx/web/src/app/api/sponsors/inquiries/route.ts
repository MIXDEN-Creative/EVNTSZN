import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { logSystemIssue } from "@/lib/system-logs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const payload = {
    package_id: String(body.packageId || "").trim() || null,
    package_name: String(body.packageName || "").trim() || null,
    company_name: String(body.companyName || "").trim(),
    contact_name: String(body.contactName || "").trim() || null,
    contact_email: String(body.contactEmail || "").trim().toLowerCase(),
    contact_phone: String(body.contactPhone || "").trim() || null,
    order_type: "inquiry",
    status: "inquiry",
    notes: String(body.notes || "").trim() || null,
    wants_followup: true,
    metadata: {
      source: "public-sponsor-packages",
    },
  };

  if (!payload.company_name || !payload.contact_email) {
    return NextResponse.json({ error: "Company name and contact email are required." }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("evntszn_sponsor_package_orders").insert(payload);
  if (error) {
    await logSystemIssue({
      source: "sponsors.inquiry",
      code: "inquiry_create_failed",
      message: error.message,
      context: { email: payload.contact_email, company: payload.company_name },
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
