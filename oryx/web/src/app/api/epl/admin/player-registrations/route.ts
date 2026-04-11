import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/epl/supabase-admin";

type Payload = {
  applicationId?: string;
  applicationStatus?: string | null;
  pipelineStage?: string | null;
  registrationStatus?: string | null;
  playerStatus?: string | null;
  waiverStatus?: string | null;
  draftEligible?: boolean | null;
  waivedFee?: boolean | null;
  internalNotes?: string | null;
};

export async function PATCH(request: Request) {
  await requireAdminPermission("approvals.manage", "/epl/admin/season-1");

  const supabase = getSupabaseAdmin();
  const body = (await request.json().catch(() => ({}))) as Payload;
  const applicationId = String(body.applicationId || "").trim();

  if (!applicationId) {
    return NextResponse.json({ error: "Application ID is required." }, { status: 400 });
  }

  const { data: application, error: applicationError } = await supabase
    .schema("epl")
    .from("player_applications")
    .select("id, answers")
    .eq("id", applicationId)
    .single();

  if (applicationError || !application) {
    return NextResponse.json({ error: applicationError?.message || "Player application could not be found." }, { status: 404 });
  }

  if (
    body.applicationStatus !== undefined ||
    body.registrationStatus !== undefined ||
    body.playerStatus !== undefined ||
    body.draftEligible !== undefined ||
    body.waivedFee !== undefined
  ) {
    const { error: pipelineError } = await supabase.rpc("epl_set_player_pipeline_status", {
      p_application_id: applicationId,
      p_application_status: body.applicationStatus ?? null,
      p_registration_status: body.registrationStatus ?? null,
      p_draft_eligible: body.draftEligible ?? null,
      p_player_status: body.playerStatus ?? null,
      p_waived_fee: body.waivedFee ?? null,
    });

    if (pipelineError) {
      return NextResponse.json({ error: pipelineError.message }, { status: 500 });
    }
  }

  if (body.pipelineStage !== undefined || body.internalNotes !== undefined || body.waiverStatus !== undefined) {
    const answers =
      body.waiverStatus !== undefined
        ? {
            ...(((application.answers || {}) as Record<string, unknown>) || {}),
            waiverStatus: body.waiverStatus,
          }
        : undefined;

    const { error: updateError } = await supabase
      .schema("epl")
      .from("player_applications")
      .update({
        ...(body.pipelineStage !== undefined ? { pipeline_stage: body.pipelineStage } : {}),
        ...(body.internalNotes !== undefined ? { internal_notes: body.internalNotes || null } : {}),
        ...(answers ? { answers } : {}),
      })
      .eq("id", applicationId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
