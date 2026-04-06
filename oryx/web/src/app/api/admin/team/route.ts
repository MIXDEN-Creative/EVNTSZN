import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  await requireAdminPermission("admin.manage", "/epl/admin/team");

  const { data, error } = await supabaseAdmin
    .from("admin_memberships")
    .select(`
      id,
      created_at,
      is_owner,
      is_active,
      user_id,
      app_users (
        id,
        email,
        full_name,
        account_type,
        is_active
      ),
      admin_roles (
        id,
        name,
        description
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ team: data || [] });
}
