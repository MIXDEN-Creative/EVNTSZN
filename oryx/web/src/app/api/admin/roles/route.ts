import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { toDatabaseUserId } from "@/lib/access-control";

export async function GET() {
  await requireAdminPermission("admin.manage", "/epl/admin/team");

  const { data, error } = await supabaseAdmin
    .from("roles")
    .select(`
      id,
      code,
      name,
      description,
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
  const permissionIds = Array.isArray(body.permissionIds) ? body.permissionIds.map((value) => String(value)) : [];
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
  const payload = {
    code: code || null,
    name,
    description,
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

  return NextResponse.json({ ok: true, roleId, allowedPermissions: permissions });
}
