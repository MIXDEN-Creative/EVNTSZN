import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  await requireAdminPermission("admin.manage", "/epl/admin/team");

  const body = await request.json();
  const membershipId = String(body.membershipId || "");
  const roleId = String(body.roleId || "");
  const isActive = typeof body.isActive === "boolean" ? body.isActive : null;

  if (!membershipId) {
    return NextResponse.json({ error: "membershipId is required" }, { status: 400 });
  }

  const updatePayload: Record<string, string | boolean> = {};
  if (roleId) updatePayload.role_id = roleId;
  if (isActive !== null) updatePayload.is_active = isActive;

  const { error } = await supabaseAdmin
    .from("admin_memberships")
    .update(updatePayload)
    .eq("id", membershipId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
