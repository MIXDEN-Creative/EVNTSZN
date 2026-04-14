import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/epl/supabase-admin";
import { requireAdminPermission } from "@/lib/admin-auth";

export async function GET() {
  try {
    await requireAdminPermission("admin.manage", "/api/admin/nodes");
    const supabase = getSupabaseAdmin();
    
    const { data: nodes, error } = await supabase
      .from("evntszn_nodes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ nodes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
