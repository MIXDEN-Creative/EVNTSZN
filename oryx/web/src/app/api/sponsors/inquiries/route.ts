import { NextResponse } from "next/server";
import { buildActivitySourceMetadata } from "@/lib/activity-source";
import { notifyPipelineEvent } from "@/lib/application-notifications";
import { trackEngagementEvent } from "@/lib/engagement";
import { createInternalWorkItem, INTERNAL_DESK_SLUGS } from "@/lib/internal-os";
import { estimateSponsorBudgetUsd } from "@/lib/pipeline-value";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { logSystemIssue } from "@/lib/system-logs";

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

  const payload = {
    package_id: String(body.packageId || "").trim() || null,
    package_name: String(body.packageName || "").trim() || null,
    company_name: String(body.companyName || "").trim(),
    contact_name: String(body.contactName || "").trim() || null,
    contact_email: String(body.contactEmail || "").trim().toLowerCase(),
    contact_phone: String(body.contactPhone || "").trim() || null,
    order_type: "inquiry",
    status: "new",
    notes: String(body.notes || "").trim() || null,
    wants_followup: true,
    metadata: {
      source: "public-sponsor-packages",
      budgetRange: String(body.budgetRange || "").trim() || null,
      targetCity: String(body.targetCity || "").trim() || null,
      interests: Array.isArray(body.interests) ? body.interests.map(String) : [],
      requestInvoice: Boolean(body.requestInvoice),
      estimatedBudgetUsd: estimateSponsorBudgetUsd(String(body.budgetRange || "").trim()),
    },
  };

  if (!payload.company_name || !payload.contact_email) {
    return NextResponse.json({ error: "Company name and contact email are required." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("evntszn_sponsor_package_orders")
    .insert(payload)
    .select("id")
    .single();
  if (error || !data) {
    await logSystemIssue({
      source: "sponsors.inquiry",
      code: "inquiry_create_failed",
      message: error.message,
      context: { email: payload.contact_email, company: payload.company_name },
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await createInternalWorkItem({
    deskSlug: INTERNAL_DESK_SLUGS.sponsor,
    title: `Sponsor inquiry · ${payload.company_name}`,
    description: `${payload.company_name} requested sponsor follow-up${payload.package_name ? ` for ${payload.package_name}` : ""}.`,
    priority: "high",
    payload: {
      sponsorOrderId: data.id,
      source: "public-sponsor-packages",
      companyName: payload.company_name,
      contactName: payload.contact_name,
      contactEmail: payload.contact_email,
      packageId: payload.package_id,
      packageName: payload.package_name,
    },
  }).catch(() => null);

  await notifyPipelineEvent({
    kind: "sponsor",
    title: `New sponsor application · ${payload.company_name}`,
    companyName: payload.company_name,
    contactName: payload.contact_name,
    city: String(body.targetCity || "").trim() || null,
    status: "new",
    estimatedValueUsd: estimateSponsorBudgetUsd(String(body.budgetRange || "").trim()),
    metadata: {
      budgetRange: String(body.budgetRange || "").trim() || null,
      interests: Array.isArray(body.interests) ? body.interests.map(String) : [],
      requestInvoice: Boolean(body.requestInvoice),
    },
  });

  const userId = await getUserId();
  if (userId) {
    await trackEngagementEvent({
      userId,
      eventType: "sponsor_perk_viewed",
      city: String(body.targetCity || "").trim() || null,
      referenceType: "sponsor",
      referenceId: payload.package_id || data.id,
      value: estimateSponsorBudgetUsd(String(body.budgetRange || "").trim()),
      dedupeKey: `sponsor:${data.id}`,
      metadata: {
        interests: Array.isArray(body.interests) ? body.interests.map(String) : [],
        requestInvoice: Boolean(body.requestInvoice),
        ...buildActivitySourceMetadata({
          sourceType: "evntszn_native",
          referenceType: "sponsor",
          entityType: "sponsor_package_order",
          metadata: {
            interests: Array.isArray(body.interests) ? body.interests.map(String) : [],
          },
        }),
      },
    }).catch(() => null);
  }

  return NextResponse.json({ ok: true });
}
