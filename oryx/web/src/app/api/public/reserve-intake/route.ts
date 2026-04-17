import { NextResponse } from "next/server";
import { createInternalWorkItem, INTERNAL_DESK_SLUGS } from "@/lib/internal-os";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const contactName = String(body.contactName || "").trim();
  const contactEmail = String(body.contactEmail || "").trim().toLowerCase();
  const companyName = String(body.companyName || "").trim();
  const market = String(body.market || "").trim();
  const venueName = String(body.venueName || "").trim();

  if (!contactName || !contactEmail || !companyName || !market || !venueName) {
    return NextResponse.json({ error: "Contact, company, market, and venue details are required." }, { status: 400 });
  }

  const payload = {
    application_type: "reserve_intake",
    requested_role_key: "reserve",
    organizer_classification: "venue",
    full_name: contactName,
    email: contactEmail,
    phone: String(body.contactPhone || "").trim() || null,
    company_name: companyName,
    city: market,
    state: null,
    motivation: `Reserve intake for ${venueName}`,
    experience_summary: String(body.notes || "").trim() || null,
    training_acknowledged: false,
    terms_accepted: true,
    discovery_eligible: false,
    desired_city_scope: [market],
    metadata: {
      venueName,
      reservePlan: String(body.reservePlan || "").trim() || null,
      averageWeeklyReservations: Number(body.averageWeeklyReservations || 0) || null,
      primaryNeed: String(body.primaryNeed || "").trim() || null,
      source: "public_reserve_intake",
      userAgent: request.headers.get("user-agent"),
    },
  };

  const { data, error } = await supabaseAdmin.from("evntszn_applications").insert(payload).select("id").single();
  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Could not create Reserve intake." }, { status: 500 });
  }

  await createInternalWorkItem({
    deskSlug: INTERNAL_DESK_SLUGS.reserve,
    title: `Reserve intake · ${venueName}`,
    description: `Reserve workflow request for ${venueName} in ${market}.`,
    priority: "high",
    payload: {
      applicationId: data.id,
      source: "public_reserve_intake",
      market,
      venueName,
      reservePlan: String(body.reservePlan || "").trim() || null,
      primaryNeed: String(body.primaryNeed || "").trim() || null,
    },
  });

  return NextResponse.json({ ok: true, applicationId: data.id });
}
