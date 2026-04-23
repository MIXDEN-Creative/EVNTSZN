import { NextResponse } from "next/server";
import { buildActivitySourceMetadata } from "@/lib/activity-source";
import { notifyPipelineEvent } from "@/lib/application-notifications";
import { trackEngagementEvent } from "@/lib/engagement";
import { createInternalWorkItem, INTERNAL_DESK_SLUGS } from "@/lib/internal-os";
import { estimateStayOpsValueUsd } from "@/lib/pipeline-value";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

async function getUserId() {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    return data.user?.id || null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const contactName = String(body.contactName || "").trim();
  const contactEmail = String(body.contactEmail || "").trim().toLowerCase();
  const companyName = String(body.companyName || "").trim();
  const location = String(body.location || "").trim();
  const propertyType = String(body.propertyType || "").trim();
  const expectedRevenue = String(body.expectedRevenue || "").trim();
  const serviceTier = String(body.serviceTier || "").trim();
  const estimatedValueUsd = estimateStayOpsValueUsd(expectedRevenue, serviceTier);

  if (!contactName || !contactEmail || !companyName || !location || !propertyType || !expectedRevenue || !serviceTier) {
    return NextResponse.json({ error: "Contact, property, location, pricing, and tier details are required." }, { status: 400 });
  }

  const payload = {
    application_type: "stayops_intake",
    status: "new",
    requested_role_key: "partner",
    organizer_classification: "partner",
    full_name: contactName,
    email: contactEmail,
    phone: String(body.contactPhone || "").trim() || null,
    company_name: companyName,
    city: location,
    state: null,
    motivation: `StayOps intake for ${propertyType} in ${location}`,
    experience_summary: String(body.notes || "").trim() || null,
    training_acknowledged: false,
    terms_accepted: true,
    discovery_eligible: false,
    desired_city_scope: [location],
    metadata: {
      propertyType,
      location,
      expectedRevenue,
      serviceTier,
      estimatedValueUsd,
      addOns: Array.isArray(body.addOns) ? body.addOns.map(String) : [],
      requestInvoice: Boolean(body.requestInvoice),
      nextStep: String(body.nextStep || "").trim() || "review",
      source: "stayops_public_intake",
      userAgent: request.headers.get("user-agent"),
    },
  };

  const { data, error } = await supabaseAdmin.from("evntszn_applications").insert(payload).select("id").single();
  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Could not create StayOps intake." }, { status: 500 });
  }

  await createInternalWorkItem({
    deskSlug: INTERNAL_DESK_SLUGS.partner,
    title: `StayOps intake · ${companyName}`,
    description: `StayOps intake for ${propertyType} in ${location}.`,
    priority: "high",
    payload: {
      applicationId: data.id,
      source: "stayops_public_intake",
      companyName,
      propertyType,
      location,
      serviceTier,
      expectedRevenue,
      requestInvoice: Boolean(body.requestInvoice),
      nextStep: String(body.nextStep || "").trim() || "review",
    },
  }).catch(() => null);

  await notifyPipelineEvent({
    kind: "stayops",
    title: `New StayOps application · ${companyName}`,
    companyName,
    contactName,
    city: location,
    status: "new",
    estimatedValueUsd,
    metadata: {
      propertyType,
      serviceTier,
      nextStep: String(body.nextStep || "").trim() || "review",
    },
  });

  const userId = await getUserId();
  if (userId) {
    await trackEngagementEvent({
      userId,
      eventType: "stayops_intake_submitted",
      city: location,
      referenceType: "stayops",
      referenceId: data.id,
      value: estimatedValueUsd,
      dedupeKey: `stayops:${data.id}`,
      metadata: {
        propertyType,
        serviceTier,
        nextStep: String(body.nextStep || "").trim() || "review",
        ...buildActivitySourceMetadata({
          sourceType: "evntszn_native",
          referenceType: "stayops",
          entityType: "stayops_application",
          metadata: {
            propertyType,
            serviceTier,
          },
        }),
      },
    }).catch(() => null);
  }

  return NextResponse.json({ ok: true, intakeId: data.id });
}
