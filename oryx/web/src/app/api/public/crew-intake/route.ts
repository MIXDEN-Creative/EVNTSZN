import { NextResponse } from "next/server";
import { createInternalWorkItem, INTERNAL_DESK_SLUGS } from "@/lib/internal-os";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const requesterName = String(body.requesterName || "").trim();
  const requesterEmail = String(body.requesterEmail || "").trim().toLowerCase();
  const city = String(body.city || "").trim();
  const eventDate = String(body.eventDate || "").trim();
  const category = String(body.category || "").trim();

  if (!requesterName || !requesterEmail || !city || !eventDate || !category) {
    return NextResponse.json({ error: "Name, email, city, event date, and category are required." }, { status: 400 });
  }

  const payload = {
    application_type: "crew_booking",
    requested_role_key: "crew_booking",
    organizer_classification: "independent_organizer",
    full_name: requesterName,
    email: requesterEmail,
    phone: String(body.requesterPhone || "").trim() || null,
    city,
    state: null,
    motivation: `Crew booking request for ${category}`,
    experience_summary: String(body.specialRequirements || "").trim() || null,
    training_acknowledged: false,
    terms_accepted: true,
    discovery_eligible: false,
    desired_city_scope: [city],
    metadata: {
      operatorType: String(body.operatorType || "").trim() || null,
      eventType: String(body.eventType || "").trim() || null,
      eventDate,
      category,
      budget: String(body.budget || "").trim() || null,
      duration: String(body.duration || "").trim() || null,
      audienceSize: String(body.audienceSize || "").trim() || null,
      equipmentNotes: String(body.equipmentNotes || "").trim() || null,
      specialRequirements: String(body.specialRequirements || "").trim() || null,
      source: "public_crew_intake",
      userAgent: request.headers.get("user-agent"),
    },
  };

  const { data, error } = await supabaseAdmin.from("evntszn_applications").insert(payload).select("id").single();
  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Could not create crew intake." }, { status: 500 });
  }

  await createInternalWorkItem({
    deskSlug: INTERNAL_DESK_SLUGS.crew,
    title: `Crew intake · ${category}`,
    description: `Crew booking request for ${category} in ${city}.`,
    priority: "high",
    payload: {
      applicationId: data.id,
      source: "public_crew_intake",
      city,
      eventDate,
      category,
      requesterEmail,
    },
  });

  return NextResponse.json({ ok: true });
}
