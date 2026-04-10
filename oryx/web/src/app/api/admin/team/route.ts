import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { toDatabaseUserId } from "@/lib/access-control";
import { normalizeCapabilityGroups, normalizeScopeValues } from "@/lib/access-model";

export async function GET() {
  await requireAdminPermission("admin.manage", "/epl/admin/team");

  const [{ data: userRoles, error: userRolesError }, { data: profiles, error: profilesError }] = await Promise.all([
    supabaseAdmin
      .from("user_roles")
      .select(`
        id,
        created_at,
        updated_at,
        is_active,
        user_id,
        role_id,
        role_subtype,
        scope_type,
        scope_values,
        capability_groups,
        capability_overrides,
        roles (
          id,
          code,
          name,
          description,
          primary_role,
          role_subtype,
          default_scope_type,
          default_scope,
          capability_groups,
          capability_overrides,
          is_system,
          is_active
        )
      `)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("evntszn_profiles")
      .select("user_id, full_name, primary_role, city, state, is_active"),
  ]);

  if (userRolesError || profilesError) {
    return NextResponse.json({ error: userRolesError?.message || profilesError?.message }, { status: 500 });
  }

  const profileMap = new Map((profiles || []).map((profile: any) => [profile.user_id, profile]));
  const grouped = new Map<string, any>();

  for (const assignment of userRoles || []) {
    const current = grouped.get(assignment.user_id) || {
      user_id: assignment.user_id,
      roles: [],
      is_active: false,
      created_at: assignment.created_at,
      updated_at: assignment.updated_at,
      profile: profileMap.get(assignment.user_id) || null,
    };

    current.roles.push({
      id: assignment.id,
      role_id: assignment.role_id,
      role_subtype: (assignment as { role_subtype?: string | null }).role_subtype || null,
      scope_type: (assignment as { scope_type?: string | null }).scope_type || null,
      scope_values: (assignment as { scope_values?: Record<string, string[]> | null }).scope_values || {},
      capability_groups: (assignment as { capability_groups?: string[] | null }).capability_groups || [],
      capability_overrides: (assignment as { capability_overrides?: Record<string, unknown> | null }).capability_overrides || {},
      is_active: assignment.is_active,
      created_at: assignment.created_at,
      updated_at: assignment.updated_at,
      role: assignment.roles,
    });
    current.is_active = current.roles.some((role: any) => role.is_active);
    grouped.set(assignment.user_id, current);
  }

  return NextResponse.json({ team: Array.from(grouped.values()) });
}

export async function POST(request: Request) {
  const { user } = await requireAdminPermission("admin.manage", "/epl/admin/team");
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(body.action || "").trim();
  const actorUserId = toDatabaseUserId(user.id);

  if (action === "assignRole") {
    const userId = String(body.userId || "").trim();
    const roleId = String(body.roleId || "").trim();
    const roleSubtype = String(body.roleSubtype || "").trim() || null;
    const scopeType = String(body.scopeType || "").trim() || null;
    const scopeValues = normalizeScopeValues(body.scopeValues);
    const capabilityGroups = normalizeCapabilityGroups(body.capabilityGroups);
    const capabilityOverrides =
      body.capabilityOverrides && typeof body.capabilityOverrides === "object" && !Array.isArray(body.capabilityOverrides)
        ? body.capabilityOverrides
        : {};

    if (!userId || !roleId) {
      return NextResponse.json({ error: "userId and roleId are required." }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("user_roles")
      .upsert(
        {
          user_id: userId,
          role_id: roleId,
          role_subtype: roleSubtype,
          scope_type: scopeType,
          scope_values: scopeValues,
          capability_groups: capabilityGroups,
          capability_overrides: capabilityOverrides,
          is_active: true,
          assigned_by: actorUserId,
        },
        { onConflict: "user_id,role_id" },
      );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  if (action === "toggleRole" || action === "removeRole") {
    const userRoleId = String(body.userRoleId || "").trim();
    if (!userRoleId) {
      return NextResponse.json({ error: "userRoleId is required." }, { status: 400 });
    }

    if (action === "removeRole") {
      const { error } = await supabaseAdmin.from("user_roles").delete().eq("id", userRoleId);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    const isActive = body.isActive === true;
    const { error } = await supabaseAdmin.from("user_roles").update({ is_active: isActive }).eq("id", userRoleId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unsupported team action." }, { status: 400 });
}
