import { NextResponse } from "next/server";
import { getAdminPermissions, requireAdmin } from "@/lib/admin-auth";
import { toDatabaseUserId } from "@/lib/access-control";
import { supabaseAdmin } from "@/lib/supabase-admin";

const VALID_STATUSES = new Set(["open", "waiting", "in_progress", "escalated", "resolved", "closed"]);
const VALID_SEVERITIES = new Set(["low", "normal", "high", "urgent"]);

export async function PATCH(
  request: Request,
  context: { params: Promise<{ ticketId: string }> },
) {
  const { ticketId } = await context.params;
  const { user } = await requireAdmin("/epl/admin/support");
  const permissions = await getAdminPermissions(user.id);

  const canRespond = permissions.includes("support.respond") || permissions.includes("support.manage");
  const canAssign = permissions.includes("support.assign") || permissions.includes("support.manage");

  if (!canRespond && !canAssign) {
    return NextResponse.json({ error: "Support access is not enabled for this account." }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const nextStatus = String(body.status || "").trim();
  const assigneeUserId = String(body.assigneeUserId || "").trim() || null;
  const internalNote = String(body.internalNote || "").trim() || null;
  const nextSeverity = String(body.severity || "").trim();
  const resolutionNotes = String(body.resolutionNotes || "").trim() || null;

  const updatePayload: Record<string, unknown> = {};

  if (nextStatus) {
    if (!canRespond) {
      return NextResponse.json({ error: "This account cannot update support status." }, { status: 403 });
    }
    if (!VALID_STATUSES.has(nextStatus)) {
      return NextResponse.json({ error: "Unsupported support status." }, { status: 400 });
    }
    updatePayload.status = nextStatus;
    updatePayload.resolved_at = nextStatus === "resolved" ? new Date().toISOString() : null;
  }

  if (nextSeverity) {
    if (!canRespond) {
      return NextResponse.json({ error: "This account cannot update support severity." }, { status: 403 });
    }
    if (!VALID_SEVERITIES.has(nextSeverity)) {
      return NextResponse.json({ error: "Unsupported support severity." }, { status: 400 });
    }
    updatePayload.severity = nextSeverity;
  }

  if (assigneeUserId !== null) {
    if (!canAssign) {
      return NextResponse.json({ error: "This account cannot assign support tickets." }, { status: 403 });
    }
    updatePayload.assignee_user_id = assigneeUserId || null;
  }

  if (!Object.keys(updatePayload).length && !internalNote) {
    if (!resolutionNotes) {
      return NextResponse.json({ error: "No support update was provided." }, { status: 400 });
    }
  }

  if (resolutionNotes) {
    if (!canRespond) {
      return NextResponse.json({ error: "This account cannot add resolution notes." }, { status: 403 });
    }
    updatePayload.resolution_notes = resolutionNotes;
  }

  if (Object.keys(updatePayload).length) {
    const { error } = await supabaseAdmin.from("support_tickets").update(updatePayload).eq("id", ticketId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  if (internalNote || nextStatus || assigneeUserId !== null || resolutionNotes) {
    const { error } = await supabaseAdmin.from("support_ticket_updates").insert({
      ticket_id: ticketId,
      author_user_id: toDatabaseUserId(user.id),
      update_type: assigneeUserId !== null ? "assignment" : nextStatus ? "status" : resolutionNotes ? "resolution" : "note",
      status_to: nextStatus || null,
      assignee_user_id: assigneeUserId,
      note_body: resolutionNotes || internalNote,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
