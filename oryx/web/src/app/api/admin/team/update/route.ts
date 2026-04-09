import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  await requireAdminPermission("admin.manage", "/epl/admin/team");

  const body = (await request.json()) as Record<string, unknown>;
  const membershipId = String(body.membershipId || body.userRoleId || "");
  const roleId = String(body.roleId || "");
  const isActive = typeof body.isActive === "boolean" ? body.isActive : null;

  if (!membershipId) {
    return NextResponse.json({ error: "membershipId is required" }, { status: 400 });
  }

  const updatePayload: Record<string, string | boolean> = {};
  if (roleId) updatePayload.role_id = roleId;
  if (isActive !== null) updatePayload.is_active = isActive;

  let error = null as { message: string } | null;

  const userRolesUpdate = await supabaseAdmin
    .from("user_roles")
    .update(updatePayload)
    .eq("id", membershipId);

  if (userRolesUpdate.error && !/user_roles/i.test(userRolesUpdate.error.message)) {
    error = userRolesUpdate.error;
  }

  if (userRolesUpdate.error) {
    const legacyUpdate = await supabaseAdmin
      .from("admin_memberships")
      .update(updatePayload)
      .eq("id", membershipId);

    error = legacyUpdate.error;
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
