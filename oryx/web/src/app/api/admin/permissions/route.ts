import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  await requireAdminPermission("roles.manage", "/epl/admin/team");

  const { data, error } = await supabaseAdmin
    .from("permissions")
    .select("id, code, label, description, category, is_system")
    .order("category", { ascending: true })
    .order("label", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ permissions: data || [] });
}
