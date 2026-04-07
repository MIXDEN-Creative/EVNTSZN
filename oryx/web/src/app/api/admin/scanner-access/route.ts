import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  await requireAdminPermission("admin.manage", "/epl/admin/scanner");

  const [operatorsRes, staffRes] = await Promise.all([
    supabaseAdmin
      .from("evntszn_operator_profiles")
      .select("user_id, role_key, can_access_scanner, city_scope, surface_access, dashboard_access, evntszn_profiles(full_name, city, state)")
      .order("updated_at", { ascending: false }),
    supabaseAdmin
      .from("evntszn_event_staff")
      .select("id, user_id, role_code, can_scan, status, evntszn_events(title, slug, city)")
      .order("created_at", { ascending: false }),
  ]);

  const error = operatorsRes.error || staffRes.error;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    operators: operatorsRes.data || [],
    assignments: staffRes.data || [],
  });
}

export async function PATCH(request: Request) {
  await requireAdminPermission("admin.manage", "/epl/admin/scanner");
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const userId = String(body.userId || "");

  if (!userId) {
    return NextResponse.json({ error: "userId is required." }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("evntszn_operator_profiles")
    .upsert(
      {
        user_id: userId,
        can_access_scanner: Boolean(body.canAccessScanner),
      },
      { onConflict: "user_id" },
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
