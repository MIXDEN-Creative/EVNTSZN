import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { toDatabaseUserId } from "@/lib/access-control";

function deriveStage(record: {
  kind: "operator" | "staffing" | "player" | "program" | "sponsor";
  status?: string | null;
  pipelineStage?: string | null;
  interviewStage?: string | null;
  hiringDecision?: string | null;
  linkedUserId?: string | null;
  assignmentStatus?: string | null;
}) {
  const status = String(record.status || "").toLowerCase();
  const pipelineStage = String(record.pipelineStage || "").toLowerCase();
  const interviewStage = String(record.interviewStage || "").toLowerCase();
  const hiringDecision = String(record.hiringDecision || "").toLowerCase();

  if (record.kind === "operator") {
    if (status === "approved") return record.linkedUserId ? "assigned" : "needs_access";
    if (status === "rejected") return "rejected";
    if (status === "reviewing") return "in_review";
    if (status === "archived") return "archived";
    return "new";
  }

  if (record.kind === "staffing") {
    if (status === "archived") return "archived";
    if (status === "not selected" || hiringDecision === "not_selected" || hiringDecision === "rejected") return "rejected";
    if (status === "hired") {
      if (record.assignmentStatus === "assigned" || record.assignmentStatus === "confirmed") return "assigned";
      return record.linkedUserId ? "assigned" : "needs_access";
    }
    if (interviewStage || status.includes("interview")) return "interviewing";
    if (status === "under review" || status === "shortlisted") return "in_review";
    return "new";
  }

  if (record.kind === "program") {
    if (status === "archived") return "archived";
    if (status === "rejected" || status === "inactive") return "rejected";
    if (status === "approved" || status === "active") return record.linkedUserId ? "assigned" : "needs_access";
    if (pipelineStage === "interview" || interviewStage === "interview") return "interviewing";
    if (status === "reviewing" || pipelineStage === "reviewing") return "in_review";
    return "new";
  }

  if (record.kind === "sponsor") {
    if (pipelineStage === "archived" || status === "archived") return "archived";
    if (pipelineStage === "rejected" || status === "rejected" || status === "cancelled") return "rejected";
    if (pipelineStage === "approved" || status === "paid" || status === "won") return "approved";
    if (pipelineStage === "in_review" || status === "inquiry" || status === "reviewing") return "in_review";
    return "new";
  }

  if (pipelineStage === "archived" || status === "archived") return "archived";
  if (status === "declined" || pipelineStage === "declined") return "rejected";
  if (status === "approved" || pipelineStage === "approved") return "approved";
  if (pipelineStage === "reviewing" || status === "reviewing" || status === "waitlisted") return "in_review";
  return "new";
}

export async function GET() {
  await requireAdminPermission("approvals.manage", "/epl/admin/approvals");

  const [operatorRes, staffRes, playerRes, programRes, sponsorRes, inviteRes, reviewersRes] = await Promise.all([
    supabaseAdmin
      .from("evntszn_applications")
      .select("id, full_name, email, application_type, requested_role_key, organizer_classification, status, city, submitted_at, created_at, reviewed_by, internal_notes, user_id")
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .schema("epl")
      .from("staff_applications")
      .select(`
        id,
        first_name,
        last_name,
        email,
        status,
        city,
        created_at,
        internal_notes,
        interview_stage,
        hiring_decision,
        assigned_reviewer_user_id,
        converted_user_id,
        position_id,
        role_template_id
      `)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .schema("epl")
      .from("player_applications")
      .select("id, first_name, last_name, email, city, status, pipeline_stage, internal_notes, submitted_at, created_at")
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("evntszn_program_members")
      .select("id, program_key, full_name, email, city, status, performance_stage, notes, assigned_manager_user_id, operator_user_id, created_at")
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("evntszn_sponsor_package_orders")
      .select("id, company_name, contact_name, contact_email, status, review_stage, review_notes, assigned_reviewer_user_id, package_name, created_at")
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("invites")
      .select("email, status, accepted_at, expires_at")
      .in("status", ["pending", "accepted"]),
    supabaseAdmin
      .from("evntszn_profiles")
      .select("user_id, full_name")
      .order("full_name", { ascending: true }),
  ]);

  const error =
    operatorRes.error || staffRes.error || playerRes.error || programRes.error || sponsorRes.error || inviteRes.error || reviewersRes.error;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const pendingInvites = new Map<string, string>();
  for (const invite of inviteRes.data || []) {
    pendingInvites.set(String(invite.email || "").toLowerCase(), String(invite.status || "pending"));
  }

  const applications = [
    ...((operatorRes.data || []).map((row) => {
      const linkedInviteStatus = pendingInvites.get(String(row.email || "").toLowerCase()) || null;
      return {
        key: `operator:${row.id}`,
        kind: "operator" as const,
        id: row.id,
        applicantName: row.full_name,
        email: row.email,
        typeLabel: row.application_type,
        linkedRole: row.requested_role_key || row.application_type,
        city: row.city || null,
        stage: deriveStage({
          kind: "operator",
          status: row.status,
          linkedUserId: row.user_id,
        }),
        status: row.status,
        assignedReviewerUserId: row.reviewed_by || null,
        interviewStatus: null,
        finalDecision: row.status === "approved" || row.status === "rejected" ? row.status : null,
        linkedAccessStatus: row.user_id ? "linked_user" : linkedInviteStatus,
        linkedStaffAssignmentStatus: null,
        notes: row.internal_notes || null,
        submittedAt: row.submitted_at || row.created_at || null,
        ageHours: Math.round((Date.now() - new Date(row.submitted_at || row.created_at || 0).getTime()) / 36e5),
        priority: row.status === "reviewing" ? "high" : "normal",
      };
    }) || []),
    ...((staffRes.data || []).map((row: any) => {
      const linkedInviteStatus = pendingInvites.get(String(row.email || "").toLowerCase()) || null;
      const linkedAssignment = row.position_id ? "pending_assignment" : null;
      return {
        key: `staffing:${row.id}`,
        kind: "staffing" as const,
        id: row.id,
        applicantName: `${row.first_name || ""} ${row.last_name || ""}`.trim(),
        email: row.email,
        typeLabel: "staffing",
        linkedRole: row.role_template_id || row.position_id || "EPL role",
        city: row.city || null,
        stage: deriveStage({
          kind: "staffing",
          status: row.status,
          interviewStage: row.interview_stage,
          hiringDecision: row.hiring_decision,
          linkedUserId: row.converted_user_id,
          assignmentStatus: linkedAssignment || undefined,
        }),
        status: row.status,
        assignedReviewerUserId: row.assigned_reviewer_user_id || null,
        interviewStatus: row.interview_stage || null,
        finalDecision: row.hiring_decision || null,
        linkedAccessStatus: row.converted_user_id ? "linked_user" : linkedInviteStatus,
        linkedStaffAssignmentStatus: linkedAssignment,
        notes: row.internal_notes || null,
        submittedAt: row.created_at || null,
        ageHours: Math.round((Date.now() - new Date(row.created_at || 0).getTime()) / 36e5),
        priority: row.status === "submitted" ? "high" : row.status === "under review" ? "normal" : "low",
      };
    }) || []),
    ...((playerRes.data || []).map((row: any) => ({
      key: `player:${row.id}`,
      kind: "player" as const,
      id: row.id,
      applicantName: `${row.first_name || ""} ${row.last_name || ""}`.trim(),
      email: row.email,
      typeLabel: "player_registration",
      linkedRole: "Season 1 player",
      city: row.city || null,
      stage: deriveStage({
        kind: "player",
        status: row.status,
        pipelineStage: row.pipeline_stage,
      }),
      status: row.status,
      assignedReviewerUserId: null,
      interviewStatus: null,
      finalDecision: row.status === "approved" || row.status === "declined" ? row.status : null,
      linkedAccessStatus: null,
      linkedStaffAssignmentStatus: null,
      notes: row.internal_notes || null,
      submittedAt: row.submitted_at || row.created_at || null,
      ageHours: Math.round((Date.now() - new Date(row.submitted_at || row.created_at || 0).getTime()) / 36e5),
      priority: row.status === "submitted" ? "high" : "normal",
    })) || []),
    ...((programRes.data || []).map((row: any) => ({
      key: `program:${row.id}`,
      kind: "program" as const,
      id: row.id,
      applicantName: row.full_name,
      email: row.email,
      typeLabel: `${row.program_key || "program"}_application`,
      linkedRole: row.program_key || "program",
      city: row.city || null,
      stage: deriveStage({
        kind: "program",
        status: row.status,
        pipelineStage: row.performance_stage,
        linkedUserId: row.operator_user_id,
      }),
      status: row.status,
      assignedReviewerUserId: row.assigned_manager_user_id || null,
      interviewStatus: row.performance_stage || null,
      finalDecision: row.status === "approved" || row.status === "rejected" ? row.status : null,
      linkedAccessStatus: row.operator_user_id ? "linked_user" : pendingInvites.get(String(row.email || "").toLowerCase()) || null,
      linkedStaffAssignmentStatus: null,
      notes: row.notes || null,
      submittedAt: row.created_at || null,
      ageHours: Math.round((Date.now() - new Date(row.created_at || 0).getTime()) / 36e5),
      priority: row.status === "applicant" ? "high" : row.status === "reviewing" ? "normal" : "low",
    })) || []),
    ...((sponsorRes.data || []).map((row: any) => ({
      key: `sponsor:${row.id}`,
      kind: "sponsor" as const,
      id: row.id,
      applicantName: row.contact_name || row.company_name,
      email: row.contact_email,
      typeLabel: "sponsor_interest",
      linkedRole: row.package_name || "sponsor inquiry",
      city: null,
      stage: deriveStage({
        kind: "sponsor",
        status: row.status,
        pipelineStage: row.review_stage,
      }),
      status: row.status,
      assignedReviewerUserId: row.assigned_reviewer_user_id || null,
      interviewStatus: null,
      finalDecision: row.review_stage === "approved" || row.review_stage === "rejected" ? row.review_stage : null,
      linkedAccessStatus: null,
      linkedStaffAssignmentStatus: null,
      notes: row.review_notes || null,
      submittedAt: row.created_at || null,
      ageHours: Math.round((Date.now() - new Date(row.created_at || 0).getTime()) / 36e5),
      priority: row.status === "inquiry" ? "normal" : "low",
    })) || []),
  ].sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime());

  return NextResponse.json({
    applications,
    reviewers: (reviewersRes.data || []).map((row) => ({
      userId: row.user_id,
      name: row.full_name || row.user_id,
    })),
  });
}

export async function POST(request: Request) {
  const { user } = await requireAdminPermission("approvals.manage", "/epl/admin/approvals");
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const key = String(body.key || "");
  const [kind, id] = key.split(":");
  if (!kind || !id) {
    return NextResponse.json({ error: "Application key is required." }, { status: 400 });
  }

  const notes = "notes" in body ? String(body.notes || "").trim() || null : undefined;
  const assignedReviewerUserId =
    "assignedReviewerUserId" in body ? String(body.assignedReviewerUserId || "").trim() || null : undefined;
  const stage = String(body.stage || "").trim();

  if (kind === "operator") {
    const nextStatus =
      stage === "new" ? "submitted" :
      stage === "in_review" ? "reviewing" :
      stage === "approved" || stage === "needs_access" || stage === "assigned" ? "approved" :
      stage === "rejected" ? "rejected" :
      stage === "archived" ? "archived" : undefined;

    const { error } = await supabaseAdmin
      .from("evntszn_applications")
      .update({
        ...(nextStatus ? { status: nextStatus } : {}),
        ...(notes !== undefined ? { internal_notes: notes } : {}),
        ...(assignedReviewerUserId !== undefined ? { reviewed_by: assignedReviewerUserId } : {}),
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (kind === "staffing") {
    const nextStatus =
      stage === "new" ? "submitted" :
      stage === "in_review" ? "under review" :
      stage === "interviewing" ? "phone interview assigned" :
      stage === "approved" || stage === "assigned" || stage === "needs_access" ? "hired" :
      stage === "rejected" ? "not selected" :
      stage === "archived" ? "archived" : undefined;

    const { error } = await supabaseAdmin
      .schema("epl")
      .from("staff_applications")
      .update({
        ...(nextStatus ? { status: nextStatus } : {}),
        ...(notes !== undefined ? { internal_notes: notes } : {}),
        ...(assignedReviewerUserId !== undefined ? { assigned_reviewer_user_id: toDatabaseUserId(assignedReviewerUserId) } : {}),
        ...(stage === "rejected" ? { hiring_decision: "not_selected" } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (kind === "player") {
    const nextStatus =
      stage === "new" ? "submitted" :
      stage === "in_review" ? "reviewing" :
      stage === "approved" ? "approved" :
      stage === "rejected" ? "declined" :
      stage === "archived" ? "archived" : undefined;

    const { error } = await supabaseAdmin
      .schema("epl")
      .from("player_applications")
      .update({
        ...(nextStatus ? { status: nextStatus, pipeline_stage: nextStatus } : {}),
        ...(notes !== undefined ? { internal_notes: notes } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (kind === "program") {
    const nextStatus =
      stage === "new" ? "applicant" :
      stage === "in_review" ? "reviewing" :
      stage === "interviewing" ? "interview" :
      stage === "approved" || stage === "needs_access" || stage === "assigned" ? "approved" :
      stage === "rejected" ? "rejected" :
      stage === "archived" ? "archived" : undefined;

    const { error } = await supabaseAdmin
      .from("evntszn_program_members")
      .update({
        ...(nextStatus ? { status: nextStatus, performance_stage: nextStatus === "interview" ? "interview" : nextStatus } : {}),
        ...(notes !== undefined ? { notes } : {}),
        ...(assignedReviewerUserId !== undefined ? { assigned_manager_user_id: toDatabaseUserId(assignedReviewerUserId) } : {}),
      })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (kind === "sponsor") {
    const nextReviewStage =
      stage === "new" ? "new" :
      stage === "in_review" ? "in_review" :
      stage === "approved" ? "approved" :
      stage === "rejected" ? "rejected" :
      stage === "archived" ? "archived" : undefined;

    const { error } = await supabaseAdmin
      .from("evntszn_sponsor_package_orders")
      .update({
        ...(nextReviewStage ? { review_stage: nextReviewStage } : {}),
        ...(notes !== undefined ? { review_notes: notes } : {}),
        ...(assignedReviewerUserId !== undefined ? { assigned_reviewer_user_id: toDatabaseUserId(assignedReviewerUserId) } : {}),
      })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unsupported application type." }, { status: 400 });
}
