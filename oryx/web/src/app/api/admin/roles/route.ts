import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { toDatabaseUserId } from "@/lib/access-control";
import {
  buildPermissionCodesFromCapabilityGroups,
  inferCapabilityGroupsFromPermissionCodes,
  inferPrimaryRole,
  normalizeCapabilityGroups,
  normalizeScopeValues,
} from "@/lib/access-model";

export async function GET() {
  await requireAdminPermission("admin.manage", "/epl/admin/team");

  const { data, error } = await supabaseAdmin
    .from("roles")
    .select(`
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
      is_active,
      role_permissions (
        permission_id,
        permissions (
          id,
          code,
          label,
          category
        )
      )
    `)
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ roles: data || [] });
}

export async function POST(request: Request) {
  const { user, permissions } = await requireAdminPermission("roles.manage", "/epl/admin/team");
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const name = String(body.name || "").trim();
  const description = String(body.description || "").trim() || null;
  const code = String(body.code || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const requestedPermissionIds = Array.isArray(body.permissionIds) ? body.permissionIds.map((value) => String(value)) : [];
  const capabilityGroups = normalizeCapabilityGroups(body.capabilityGroups);
  const primaryRole = String(body.primaryRole || "").trim() || inferPrimaryRole({ code, name });
  const roleSubtype = String(body.roleSubtype || "").trim() || null;
  const defaultScopeType = String(body.defaultScopeType || "").trim() || null;
  const defaultScope = normalizeScopeValues(body.defaultScope);
  const capabilityOverrides = {
    allow_permission_codes: Array.isArray((body.capabilityOverrides as Record<string, unknown> | undefined)?.allow_permission_codes)
      ? Array.from(new Set(((body.capabilityOverrides as Record<string, unknown>).allow_permission_codes as unknown[]).map((value) => String(value || "").trim()).filter(Boolean)))
      : [],
    deny_permission_codes: Array.isArray((body.capabilityOverrides as Record<string, unknown> | undefined)?.deny_permission_codes)
      ? Array.from(new Set(((body.capabilityOverrides as Record<string, unknown>).deny_permission_codes as unknown[]).map((value) => String(value || "").trim()).filter(Boolean)))
      : [],
  };
  const isActive = body.isActive !== false;

  if (!name) {
    return NextResponse.json({ error: "Role name is required." }, { status: 400 });
  }

  const duplicateCheck = await supabaseAdmin
    .from("roles")
    .select("id, name, code");

  if (duplicateCheck.error) {
    return NextResponse.json({ error: duplicateCheck.error.message }, { status: 500 });
  }

  const conflictingRole = (duplicateCheck.data || []).find((role) => {
    if (role.id === String(body.id || "").trim()) return false;
    const sameName = String(role.name || "").trim().toLowerCase() === name.toLowerCase();
    const sameCode = Boolean(code) && String(role.code || "").trim().toLowerCase() === code;
    return sameName || sameCode;
  });
  if (conflictingRole) {
    const conflictLabel =
      conflictingRole.code && conflictingRole.code === code ? "role code" : "role name";
    return NextResponse.json({ error: `That ${conflictLabel} is already in use.` }, { status: 409 });
  }

  const actorUserId = toDatabaseUserId(user.id);
  const { data: availablePermissions, error: permissionsError } = await supabaseAdmin
    .from("permissions")
    .select("id, code");

  if (permissionsError) {
    return NextResponse.json({ error: permissionsError.message }, { status: 500 });
  }

  const permissionIdByCode = new Map((availablePermissions || []).map((permission) => [permission.code, permission.id]));
  const inferredPermissionCodes = new Set(buildPermissionCodesFromCapabilityGroups(capabilityGroups));
  for (const code of capabilityOverrides.allow_permission_codes) inferredPermissionCodes.add(code);
  for (const code of capabilityOverrides.deny_permission_codes) inferredPermissionCodes.delete(code);

  const permissionIds = requestedPermissionIds.length
    ? requestedPermissionIds
    : Array.from(inferredPermissionCodes).map((code) => permissionIdByCode.get(code)).filter(Boolean) as string[];

  const payload = {
    code: code || null,
    name,
    description,
    primary_role: primaryRole,
    role_subtype: roleSubtype,
    default_scope_type: defaultScopeType,
    default_scope: defaultScope,
    capability_groups: capabilityGroups,
    capability_overrides: capabilityOverrides,
    is_active: isActive,
    updated_by: actorUserId,
    created_by: actorUserId,
  };

  let roleId = String(body.id || "").trim();

  if (roleId) {
    const { error } = await supabaseAdmin
      .from("roles")
      .update({
        code: payload.code,
        name: payload.name,
        description: payload.description,
        primary_role: payload.primary_role,
        role_subtype: payload.role_subtype,
        default_scope_type: payload.default_scope_type,
        default_scope: payload.default_scope,
        capability_groups: payload.capability_groups,
        capability_overrides: payload.capability_overrides,
        is_active: payload.is_active,
        updated_by: payload.updated_by,
      })
      .eq("id", roleId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    const { data, error } = await supabaseAdmin
      .from("roles")
      .insert(payload)
      .select("id")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message || "Could not create role." }, { status: 500 });
    }

    roleId = data.id;
  }

  const { error: deleteError } = await supabaseAdmin
    .from("role_permissions")
    .delete()
    .eq("role_id", roleId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  if (permissionIds.length) {
    const { error: permissionError } = await supabaseAdmin
      .from("role_permissions")
      .insert(permissionIds.map((permissionId) => ({ role_id: roleId, permission_id: permissionId })));

    if (permissionError) {
      return NextResponse.json({ error: permissionError.message }, { status: 500 });
    }
  }

  const rolePermissions = (availablePermissions || []).filter((permission) => permissionIds.includes(permission.id)).map((permission) => permission.code);
  return NextResponse.json({
    ok: true,
    roleId,
    allowedPermissions: permissions,
    savedCapabilityGroups: capabilityGroups.length ? capabilityGroups : inferCapabilityGroupsFromPermissionCodes(rolePermissions),
  });
}
