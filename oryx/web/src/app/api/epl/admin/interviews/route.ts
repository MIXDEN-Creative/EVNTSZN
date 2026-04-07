import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/epl/supabase-admin";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  await requireAdminPermission("admin.manage", "/epl/admin/hiring");
  const applicationId = req.nextUrl.searchParams.get("applicationId");
  const supabase = getSupabaseAdmin();

  let query = supabase.schema("epl").from("staff_application_interviews").select("*").order("created_at", { ascending: false });
  if (applicationId) query = query.eq("application_id", applicationId);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: interviewers } = await supabaseAdmin
    .from("evntszn_operator_profiles")
    .select("user_id, role_key, job_title, evntszn_profiles(full_name)")
    .eq("is_active", true);

  return NextResponse.json({ interviews: data || [], interviewers: interviewers || [] });
}

export async function POST(req: NextRequest) {
  await requireAdminPermission("admin.manage", "/epl/admin/hiring");
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const supabase = getSupabaseAdmin();

  const payload = {
    application_id: String(body.application_id || "").trim(),
    interview_stage: String(body.interview_stage || "zoom"),
    status: String(body.status || "scheduled"),
    interviewer_user_id: String(body.interviewer_user_id || "").trim() || null,
    interviewer_name: String(body.interviewer_name || "").trim() || null,
    scheduled_at: String(body.scheduled_at || "").trim() || null,
    completed_at: body.status === "completed" ? new Date().toISOString() : null,
    recommendation: String(body.recommendation || "").trim() || null,
    summary: String(body.summary || "").trim() || null,
    notes: String(body.notes || "").trim() || null,
  };

  if (!payload.application_id) {
    return NextResponse.json({ error: "application_id is required." }, { status: 400 });
  }

  if (body.id) {
    const { error } = await supabase
      .schema("epl")
      .from("staff_application_interviews")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase.schema("epl").from("staff_application_interviews").insert(payload);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase
    .schema("epl")
    .from("staff_applications")
    .update({
      status: payload.interview_stage === "zoom"
        ? (payload.status === "completed" ? "zoom completed" : "zoom interview assigned")
        : (payload.status === "completed" ? "phone interview completed" : "phone interview assigned"),
      interview_stage: payload.interview_stage,
      latest_interview_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", payload.application_id);

  return NextResponse.json({ ok: true });
}
