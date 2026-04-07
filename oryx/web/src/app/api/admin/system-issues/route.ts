import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  await requireAdminPermission("admin.manage", "/epl/admin/issues");

  const { data, error } = await supabaseAdmin
    .from("evntszn_system_logs")
    .select("*")
    .order("occurred_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ issues: data || [] });
}

export async function PATCH(request: NextRequest) {
  await requireAdminPermission("admin.manage", "/epl/admin/issues");
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const id = String(body.id || "");
  const status = String(body.status || "");
  if (!id || !status) {
    return NextResponse.json({ error: "id and status are required." }, { status: 400 });
  }

  const payload: Record<string, unknown> = { status };
  if (status === "resolved" || status === "archived") {
    payload.resolved_at = new Date().toISOString();
  }

  const { error } = await supabaseAdmin
    .from("evntszn_system_logs")
    .update(payload)
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
