import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { normalizeStringArray } from "@/lib/operator-access";

type RouteContext = {
  params: Promise<{ userId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  await requireAdminPermission("admin.manage", "/epl/admin/users");

  const { userId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const profilePayload: Record<string, unknown> = {};
  const operatorPayload: Record<string, unknown> = {};

  if ("full_name" in body) profilePayload.full_name = String(body.full_name || "").trim() || null;
  if ("primary_role" in body) profilePayload.primary_role = String(body.primary_role || "attendee");
  if ("city" in body) profilePayload.city = String(body.city || "").trim() || null;
  if ("state" in body) profilePayload.state = String(body.state || "").trim() || null;
  if ("phone" in body) profilePayload.phone = String(body.phone || "").trim() || null;
  if ("notes" in body) profilePayload.notes = String(body.notes || "").trim() || null;
  if ("is_active" in body) {
    profilePayload.is_active = Boolean(body.is_active);
    operatorPayload.is_active = Boolean(body.is_active);
  }

  const jsonFields = [
    "functions",
    "city_scope",
    "dashboard_access",
    "surface_access",
    "module_access",
    "approval_authority",
    "team_scope",
    "sponsor_scope",
  ] as const;

  if ("role_key" in body) operatorPayload.role_key = String(body.role_key || "").trim() || "attendee";
  if ("organizer_classification" in body) operatorPayload.organizer_classification = String(body.organizer_classification || "").trim() || "internal_operator";
  if ("network_status" in body) operatorPayload.network_status = String(body.network_status || "").trim() || "active";
  if ("job_title" in body) operatorPayload.job_title = String(body.job_title || "").trim() || null;

  for (const field of jsonFields) {
    if (field in body) operatorPayload[field] = normalizeStringArray(body[field]);
  }

  for (const flag of [
    "can_manage_content",
    "can_manage_discovery",
    "can_manage_store",
    "can_manage_sponsors",
    "can_access_scanner",
  ] as const) {
    if (flag in body) operatorPayload[flag] = Boolean(body[flag]);
  }

  const operations = [];
  if (Object.keys(profilePayload).length) {
    operations.push(
      supabaseAdmin.from("evntszn_profiles").update(profilePayload).eq("user_id", userId)
    );
  }

  if (Object.keys(operatorPayload).length) {
    operations.push(
      supabaseAdmin.from("evntszn_operator_profiles").upsert(
        {
          user_id: userId,
          ...operatorPayload,
        },
        { onConflict: "user_id" }
      )
    );
  }

  const results = await Promise.all(operations);
  const failed = results.find((result) => "error" in result && result.error);
  if (failed && "error" in failed && failed.error) {
    return NextResponse.json({ error: failed.error.message }, { status: 500 });
  }

  if ("auth_disabled" in body) {
    const authRes = await supabaseAdmin.auth.admin.updateUserById(userId, {
      ban_duration: body.auth_disabled ? "876000h" : "none",
    });
    if (authRes.error) {
      return NextResponse.json({ error: authRes.error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
