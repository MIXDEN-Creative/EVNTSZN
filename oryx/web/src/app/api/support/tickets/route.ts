import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const ISSUE_TYPES = new Set([
  "website_issue",
  "scanning_issue",
  "ticket_issue",
  "login_issue",
  "event_issue",
  "sponsor_issue",
  "staff_issue",
  "office_issue",
  "payment_issue",
  "other",
]);

async function getViewerContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null, operatorProfile: null };
  }

  const [{ data: profile }, { data: operatorProfile }] = await Promise.all([
    supabaseAdmin
      .from("evntszn_profiles")
      .select("full_name, primary_role, city, state")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabaseAdmin
      .from("evntszn_operator_profiles")
      .select("role_key, organizer_classification, city_scope")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  return { user, profile, operatorProfile };
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("evntszn_events")
    .select("id, title, city, start_at, slug")
    .eq("visibility", "public")
    .in("status", ["published", "active"])
    .order("start_at", { ascending: true })
    .limit(30);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    events: (data || []).map((event) => ({
      id: event.id,
      title: event.title,
      city: event.city,
      start_at: event.start_at,
      slug: event.slug,
    })),
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const { user, profile, operatorProfile } = await getViewerContext();
  const name = String(body.name || profile?.full_name || "").trim();
  const email = String(body.email || user?.email || "").trim().toLowerCase();
  const issueType = String(body.issueType || "").trim();
  const issueSubtype = String(body.issueSubtype || "").trim() || null;
  const description = String(body.description || "").trim();

  if (!ISSUE_TYPES.has(issueType) || !description || (!email && !user)) {
    return NextResponse.json({ error: "Name or email, issue type, and description are required." }, { status: 400 });
  }

  const roleLabel = operatorProfile?.role_key
    ? String(operatorProfile.role_key)
    : profile?.primary_role
      ? String(profile.primary_role)
      : "guest";

  const insertPayload = {
    user_id: user?.id || null,
    related_event_id: String(body.relatedEventId || "").trim() || null,
    name: name || null,
    email: email || null,
    role_label: roleLabel,
    issue_type: issueType,
    issue_subtype: issueSubtype,
    source_surface: String(body.sourceSurface || "").trim() || null,
    page_path: String(body.pagePath || "").trim() || null,
    page_url: String(body.pageUrl || "").trim() || null,
    related_order_code: String(body.relatedOrderCode || "").trim() || null,
    occurred_on: String(body.occurredOn || "").trim() || null,
    occurred_at_label: String(body.occurredAtLabel || "").trim() || null,
    severity: ["low", "normal", "high", "urgent"].includes(String(body.severity || "")) ? body.severity : "normal",
    description,
    metadata: {
      reported_from: body.reportedFrom || null,
      subdomain: body.subdomain || null,
      referrer: body.referrer || null,
      issue_subtype: issueSubtype,
    },
  };

  const { data, error } = await supabaseAdmin
    .from("support_tickets")
    .insert(insertPayload)
    .select("id, ticket_code")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Could not create support ticket." }, { status: 500 });
  }

  await supabaseAdmin.from("support_ticket_updates").insert({
    ticket_id: data.id,
    author_user_id: user?.id || null,
    update_type: "created",
    note_body: "Ticket created from public support intake.",
  });

  return NextResponse.json({ ok: true, ticketCode: data.ticket_code });
}
