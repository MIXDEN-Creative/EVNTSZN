import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { normalizePipelineStatus } from "@/lib/pipeline-value";

export async function PATCH(request: Request) {
  const { user } = await requireAdminPermission("admin.manage", "/operate/applications");
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const id = String(body.id || "").trim();
  const kind = String(body.kind || "").trim();
  const status = normalizePipelineStatus(String(body.status || "").trim());

  if (!id || !kind) {
    return NextResponse.json({ error: "id and kind are required." }, { status: 400 });
  }

  if (kind === "stayops") {
    const { error } = await supabaseAdmin
      .from("evntszn_applications")
      .update({
        status,
        reviewed_by: user.id.startsWith("founder:") ? null : user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("application_type", "stayops_intake");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (kind === "sponsor") {
    const { error } = await supabaseAdmin
      .from("evntszn_sponsor_package_orders")
      .update({
        status,
        assigned_reviewer_user_id: user.id.startsWith("founder:") ? null : user.id,
      })
      .eq("id", id)
      .eq("order_type", "inquiry");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unsupported application kind." }, { status: 400 });
}
