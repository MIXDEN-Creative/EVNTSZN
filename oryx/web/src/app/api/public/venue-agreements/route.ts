import { NextResponse } from "next/server";
import { createInternalWorkItem, INTERNAL_DESK_SLUGS } from "@/lib/internal-os";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const applicantName = String(body.applicantName || "").trim();
  const applicantEmail = String(body.applicantEmail || "").trim().toLowerCase();
  const market = String(body.market || "").trim();
  const venueName = String(body.venueName || "").trim();
  const venueContactName = String(body.venueContactName || "").trim();
  const venueContactEmail = String(body.venueContactEmail || "").trim().toLowerCase();

  if (!applicantName || !applicantEmail || !market || !venueName || !venueContactName || !venueContactEmail) {
    return NextResponse.json(
      { error: "Applicant info, market, venue name, and venue contact details are required." },
      { status: 400 },
    );
  }

  const payload = {
    application_type: "venue_agreement",
    requested_role_key: "venue_agreement",
    organizer_classification: "host",
    full_name: applicantName,
    email: applicantEmail,
    phone: String(body.applicantPhone || "").trim() || null,
    company_name: venueName,
    city: market,
    state: null,
    motivation: `Venue agreement request for ${venueName}`,
    experience_summary: String(body.notes || "").trim() || null,
    training_acknowledged: false,
    terms_accepted: true,
    discovery_eligible: false,
    desired_city_scope: [market],
    metadata: {
      operatorLevel: String(body.operatorLevel || "").trim() || null,
      venueListed: String(body.venueListed || "").trim() || null,
      venueWebsite: String(body.venueWebsite || "").trim() || null,
      venueContactName,
      venueContactEmail,
      venueContactPhone: String(body.venueContactPhone || "").trim() || null,
      useCase: String(body.useCase || "").trim() || null,
      source: "public_venue_agreement",
      userAgent: request.headers.get("user-agent"),
    },
  };

  const { data, error } = await supabaseAdmin.from("evntszn_applications").insert(payload).select("id").single();
  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Could not submit venue agreement request." }, { status: 500 });
  }

  await createInternalWorkItem({
    deskSlug: INTERNAL_DESK_SLUGS.agreements,
    title: `Venue agreement · ${venueName}`,
    description: `Venue agreement intake for ${venueName} in ${market}.`,
    priority: "high",
    payload: {
      applicationId: data.id,
      source: "public_venue_agreement",
      venueName,
      market,
      venueContactName,
      venueContactEmail,
    },
  });

  return NextResponse.json({ ok: true });
}
