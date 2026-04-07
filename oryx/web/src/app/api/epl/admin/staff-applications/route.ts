import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/epl/supabase-admin";
import { ensurePlatformProfile } from "@/lib/evntszn";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { normalizeStringArray } from "@/lib/operator-access";

export async function GET(req: NextRequest) {
  await requireAdminPermission("admin.manage", "/epl/admin/hiring");
  const seasonSlug = req.nextUrl.searchParams.get("seasonSlug") || "season-1";
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("epl_v_staff_pipeline")
    .select("*")
    .eq("season_slug", seasonSlug)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ applications: data || [] });
}

export async function POST(req: NextRequest) {
  await requireAdminPermission("admin.manage", "/epl/admin/hiring");
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const supabase = getSupabaseAdmin();

  if (body.action === "convertToUser") {
    const { data: application, error: applicationError } = await supabase
      .schema("epl")
      .from("staff_applications")
      .select("*")
      .eq("id", body.id)
      .single();

    if (applicationError || !application) {
      return NextResponse.json({ error: applicationError?.message || "Application not found." }, { status: 404 });
    }

    let userId = application.converted_user_id as string | null;
    if (!userId) {
      const password = crypto.randomUUID();
      const authRes = await supabaseAdmin.auth.admin.createUser({
        email: application.email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: `${application.first_name} ${application.last_name}`.trim(),
        },
      });

      if (authRes.error || !authRes.data.user) {
        return NextResponse.json({ error: authRes.error?.message || "Could not create user." }, { status: 500 });
      }
      userId = authRes.data.user.id;
    }

    await ensurePlatformProfile(userId, {
      fullName: `${application.first_name} ${application.last_name}`.trim(),
      primaryRole: "admin",
      city: application.city,
      state: application.state,
    });

    await supabaseAdmin.from("evntszn_operator_profiles").upsert(
      {
        user_id: userId,
        role_key: String(body.roleKey || "operations_coordinator"),
        job_title: String(body.jobTitle || application.opportunity_title || "EPL Operations").trim() || null,
        functions: normalizeStringArray(body.functions || ["epl", "staffing"]),
        city_scope: normalizeStringArray(body.cityScope || application.city),
        dashboard_access: normalizeStringArray(body.dashboardAccess || ["admin"]),
        surface_access: normalizeStringArray(body.surfaceAccess || ["admin"]),
        module_access: normalizeStringArray(body.moduleAccess || ["epl", "staffing"]),
        approval_authority: [],
        can_manage_content: false,
        can_manage_discovery: false,
        can_manage_store: false,
        can_manage_sponsors: false,
        can_access_scanner: Boolean(body.canAccessScanner),
        is_active: true,
        notes: "Created from EPL hiring pipeline.",
      },
      { onConflict: "user_id" }
    );

    const { error } = await supabase
      .schema("epl")
      .from("staff_applications")
      .update({
        converted_user_id: userId,
        status: "hired",
        hiring_decision: "hired",
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, userId });
  }

  const { error } = await supabase
    .schema("epl")
    .from("staff_applications")
    .update({
      status: body.status,
      internal_notes: body.internalNotes || null,
      assigned_city: body.assignedCity || null,
      assigned_reviewer_user_id: body.assignedReviewerUserId || null,
      interview_stage: body.interviewStage || null,
      hiring_decision: body.hiringDecision || null,
      resume_url: body.resumeUrl || null,
      portfolio_url: body.portfolioUrl || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", body.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
