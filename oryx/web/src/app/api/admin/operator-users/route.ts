import { NextResponse } from "next/server";
import { isMissingRbacTableError, requireAdminPermission } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { ensurePlatformProfile } from "@/lib/evntszn";
import { getOperatorPreset, inferOrganizerClassification, normalizeStringArray } from "@/lib/operator-access";
import { logSystemIssue } from "@/lib/system-logs";

type RbacMembershipRow = {
  user_id: string;
  is_active: boolean;
  roles: { name?: string | null; code?: string | null }[] | { name?: string | null; code?: string | null } | null;
};

type LegacyMembershipRow = {
  user_id: string;
  is_owner: boolean;
  is_active: boolean;
  admin_roles: { name?: string | null }[] | { name?: string | null } | null;
};

export async function GET() {
  await requireAdminPermission("admin.manage", "/epl/admin/users");

  const [{ data: profiles, error: profilesError }, { data: operatorProfiles, error: operatorError }, rbacMembershipResponse] =
    await Promise.all([
      supabaseAdmin
        .from("evntszn_profiles")
        .select("user_id, full_name, primary_role, city, state, phone, referral_code, is_active, notes")
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("evntszn_operator_profiles")
        .select("*"),
      supabaseAdmin
        .from("user_roles")
        .select("user_id, is_active, roles(name, code)")
        .eq("is_active", true),
    ]);

  let memberships = (rbacMembershipResponse.data || []) as (RbacMembershipRow | LegacyMembershipRow)[];
  let membershipError = rbacMembershipResponse.error;

  if (membershipError && isMissingRbacTableError(membershipError)) {
    const legacyMembershipResponse = await supabaseAdmin
      .from("admin_memberships")
      .select("user_id, is_owner, is_active, admin_roles(name)")
      .eq("is_active", true);

    memberships = (legacyMembershipResponse.data || []) as LegacyMembershipRow[];
    membershipError = legacyMembershipResponse.error;
  }

  const error = profilesError || operatorError || membershipError;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const operatorMap = new Map((operatorProfiles || []).map((row) => [row.user_id, row]));
  const membershipMap = new Map<string, { isOwner: boolean; roles: string[] }>();

  for (const membership of memberships || []) {
    const current = membershipMap.get(membership.user_id) || { isOwner: false, roles: [] };
    current.isOwner = current.isOwner || ("is_owner" in membership ? Boolean(membership.is_owner) : false);
    let roleName: string | null = null;
    let roleCode: string | null = null;

    if ("roles" in membership) {
      const roleSource = membership.roles;
      roleName = Array.isArray(roleSource) ? roleSource[0]?.name || null : roleSource?.name || null;
      roleCode = Array.isArray(roleSource) ? roleSource[0]?.code || null : roleSource?.code || null;
    } else {
      const roleSource = membership.admin_roles;
      roleName = Array.isArray(roleSource) ? roleSource[0]?.name || null : roleSource?.name || null;
    }

    current.isOwner = current.isOwner || roleCode === "platform_admin";
    if (roleName) current.roles.push(roleName);
    membershipMap.set(membership.user_id, current);
  }

  const users = (profiles || []).map((profile) => {
    const operator = operatorMap.get(profile.user_id);
    const preset = getOperatorPreset(operator?.role_key || null);
    const membership = membershipMap.get(profile.user_id);

    return {
      ...profile,
      operator_profile: operator || null,
      operator_preset: preset,
      admin_membership: membership || null,
    };
  });

  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  await requireAdminPermission("admin.manage", "/epl/admin/users");

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const email = String(body.email || "").trim().toLowerCase();
  const fullName = String(body.full_name || "").trim();
  const password = String(body.password || "").trim();
  const primaryRole = String(body.primary_role || "attendee").trim();
  const roleKey = String(body.role_key || primaryRole).trim();
  const organizerClassification = String(body.organizer_classification || "").trim() || inferOrganizerClassification(roleKey);

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const createRes = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
    },
  });

  if (createRes.error || !createRes.data.user) {
    await logSystemIssue({
      source: "admin.operator-users",
      code: "create_user_failed",
      message: createRes.error?.message || "Could not create operator user.",
      context: { email, roleKey },
    });
    return NextResponse.json({ error: createRes.error?.message || "Could not create user." }, { status: 500 });
  }

  const userId = createRes.data.user.id;

  await ensurePlatformProfile(userId, {
    fullName,
    primaryRole: primaryRole as any,
    city: String(body.city || "").trim() || null,
    state: String(body.state || "").trim() || null,
  });

  const preset = getOperatorPreset(roleKey);
  const presetModules = preset ? Array.from(preset.modules) : [];
  const presetSurfaces = preset ? Array.from(preset.surfaces) : [];

  const { error: operatorError } = await supabaseAdmin
    .from("evntszn_operator_profiles")
    .upsert({
      user_id: userId,
      role_key: roleKey,
      organizer_classification: organizerClassification,
      network_status: String(body.network_status || "active").trim() || "active",
      job_title: String(body.job_title || "").trim() || null,
      functions: normalizeStringArray(body.functions),
      city_scope: normalizeStringArray(body.city_scope || body.city),
      dashboard_access: normalizeStringArray(body.dashboard_access || preset?.dashboards || []),
      surface_access: normalizeStringArray(body.surface_access || preset?.surfaces || []),
      module_access: normalizeStringArray(body.module_access || preset?.modules || []),
      approval_authority: normalizeStringArray(body.approval_authority || preset?.approvals || []),
      team_scope: normalizeStringArray(body.team_scope),
      sponsor_scope: normalizeStringArray(body.sponsor_scope),
      can_manage_content: Boolean(body.can_manage_content ?? presetModules.includes("content")),
      can_manage_discovery: Boolean(body.can_manage_discovery ?? presetModules.includes("discovery")),
      can_manage_store: Boolean(body.can_manage_store ?? presetModules.includes("store")),
      can_manage_sponsors: Boolean(body.can_manage_sponsors ?? presetModules.includes("sponsors")),
      can_access_scanner: Boolean(body.can_access_scanner ?? presetSurfaces.includes("scanner")),
      is_active: true,
      notes: String(body.notes || "").trim() || null,
    });

  if (operatorError) {
    return NextResponse.json({ error: operatorError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, userId });
}
