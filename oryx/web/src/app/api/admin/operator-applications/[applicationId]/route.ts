import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getOperatorPreset, inferOrganizerClassification, normalizeStringArray } from "@/lib/operator-access";
import { ensurePlatformProfile } from "@/lib/evntszn";

type RouteContext = {
  params: Promise<{ applicationId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { user } = await requireAdminPermission("admin.manage", "/epl/admin/approvals");
  const { applicationId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const status = String(body.status || "").trim();
  if (!status) {
    return NextResponse.json({ error: "Status is required." }, { status: 400 });
  }

  const { data: application, error: applicationError } = await supabaseAdmin
    .from("evntszn_applications")
    .select("*")
    .eq("id", applicationId)
    .single();

  if (applicationError || !application) {
    return NextResponse.json({ error: applicationError?.message || "Application not found." }, { status: 404 });
  }

  let approvedUserId = application.user_id as string | null;

  if (status === "approved" && !approvedUserId) {
    const temporaryPassword = crypto.randomUUID();
    const createRes = await supabaseAdmin.auth.admin.createUser({
      email: application.email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        full_name: application.full_name,
      },
    });

    if (createRes.error || !createRes.data.user) {
      return NextResponse.json({ error: createRes.error?.message || "Could not provision user." }, { status: 500 });
    }

    approvedUserId = createRes.data.user.id;
  }

  if (status === "approved" && approvedUserId) {
    const roleKey = String(body.role_key || application.requested_role_key || application.application_type);
    const organizerClassification =
      String(body.organizer_classification || application.organizer_classification || "").trim() ||
      inferOrganizerClassification(roleKey);
    const preset = getOperatorPreset(roleKey);
    const presetModules = preset ? Array.from(preset.modules) : [];
    const presetSurfaces = preset ? Array.from(preset.surfaces) : [];

    await ensurePlatformProfile(approvedUserId, {
      fullName: application.full_name,
      primaryRole: application.application_type === "organizer" ? "organizer" : "attendee",
      city: application.city,
      state: application.state,
    });

    await supabaseAdmin.from("evntszn_operator_profiles").upsert(
      {
        user_id: approvedUserId,
        role_key: roleKey,
        organizer_classification: organizerClassification,
        network_status: "active",
        job_title: String(body.job_title || "").trim() || null,
        functions: normalizeStringArray(body.functions),
        city_scope: normalizeStringArray(body.city_scope || application.desired_city_scope || application.city),
        dashboard_access: normalizeStringArray(body.dashboard_access || preset?.dashboards || []),
        surface_access: normalizeStringArray(body.surface_access || preset?.surfaces || []),
        module_access: normalizeStringArray(body.module_access || preset?.modules || []),
        approval_authority: normalizeStringArray(body.approval_authority || preset?.approvals || []),
        can_manage_content: Boolean(body.can_manage_content ?? presetModules.includes("content")),
        can_manage_discovery: Boolean(body.can_manage_discovery ?? presetModules.includes("discovery")),
        can_manage_store: Boolean(body.can_manage_store ?? presetModules.includes("store")),
        can_manage_sponsors: Boolean(body.can_manage_sponsors ?? presetModules.includes("sponsors")),
        can_access_scanner: Boolean(body.can_access_scanner ?? presetSurfaces.includes("scanner")),
        is_active: true,
      },
      { onConflict: "user_id" }
    );
  }

  const { error } = await supabaseAdmin
    .from("evntszn_applications")
    .update({
      status,
      user_id: approvedUserId,
      organizer_classification:
        String(body.organizer_classification || "").trim() ||
        application.organizer_classification ||
        inferOrganizerClassification(String(body.role_key || application.requested_role_key || application.application_type)),
      discovery_eligible: "discovery_eligible" in body ? Boolean(body.discovery_eligible) : application.discovery_eligible,
      internal_notes: String(body.internal_notes || "").trim() || application.internal_notes,
      reviewed_by: user.id.startsWith("founder:") ? null : user.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason: status === "rejected" ? String(body.rejection_reason || "").trim() || null : null,
    })
    .eq("id", applicationId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, userId: approvedUserId });
}
