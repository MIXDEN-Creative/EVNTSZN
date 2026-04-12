import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/epl/supabase-admin";
import { buildTallyFieldMap, readTallyField } from "@/lib/epl/waiver";

type TallyField = {
  key?: string | null;
  label?: string | null;
  type?: string | null;
  value?: unknown;
};

type TallyPayload = {
  eventId?: string;
  eventType?: string;
  createdAt?: string;
  data?: {
    submissionId?: string;
    responseId?: string;
    respondentId?: string;
    formId?: string;
    formName?: string;
    createdAt?: string;
    fields?: TallyField[];
  };
};

function verifySignature(rawBody: string, receivedSignature: string | null, signingSecret: string | undefined) {
  if (!signingSecret) {
    return { verified: false, enforced: false };
  }

  if (!receivedSignature) {
    return { verified: false, enforced: true };
  }

  const expected = createHmac("sha256", signingSecret).update(rawBody).digest("base64");
  const received = Buffer.from(receivedSignature);
  const expectedBuffer = Buffer.from(expected);
  if (received.length !== expectedBuffer.length) {
    return { verified: false, enforced: true };
  }

  return { verified: timingSafeEqual(received, expectedBuffer), enforced: true };
}

function dedupeIds(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter(Boolean) as string[]));
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("tally-signature");
  const signingSecret = process.env.TALLY_WEBHOOK_SECRET || process.env.TALLY_SIGNING_SECRET;
  const signatureState = verifySignature(rawBody, signature, signingSecret);

  if (signatureState.enforced && !signatureState.verified) {
    console.error("[tally-waiver-webhook] invalid signature", {
      hasSignature: Boolean(signature),
    });
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let payload: TallyPayload;
  try {
    payload = JSON.parse(rawBody) as TallyPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (payload.eventType && payload.eventType !== "FORM_RESPONSE") {
    return NextResponse.json({ ok: true, ignored: true, reason: "unsupported_event_type" });
  }

  const formId = String(payload.data?.formId || "");
  const allowedFormId = process.env.TALLY_WAIVER_FORM_ID || "";
  if (allowedFormId && formId && formId !== allowedFormId) {
    return NextResponse.json({ ok: true, ignored: true, reason: "different_form" });
  }

  const eventId = String(payload.eventId || "").trim();
  const submissionId = String(payload.data?.submissionId || payload.data?.responseId || "").trim();
  if (!eventId && !submissionId) {
    return NextResponse.json({ error: "Missing submission identity." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const fields = payload.data?.fields || [];
  const fieldMap = buildTallyFieldMap(fields);
  const explicitApplicationId = readTallyField(fieldMap, ["application_id", "applicationid", "application id"]);
  const email = readTallyField(fieldMap, ["email", "player_email", "email_address", "payment_email"]).toLowerCase();
  const firstName = readTallyField(fieldMap, ["first_name", "firstname", "first name"]);
  const lastName = readTallyField(fieldMap, ["last_name", "lastname", "last name"]);
  const fullName = readTallyField(fieldMap, ["full_name", "fullname", "full name", "payment_name", "name"]);

  const { data: existingWebhook } = await supabase
    .schema("epl")
    .from("waiver_webhook_submissions")
    .select("id, match_status")
    .eq("tally_event_id", eventId || submissionId)
    .maybeSingle();

  if (existingWebhook) {
    return NextResponse.json({ ok: true, duplicate: true, matchStatus: existingWebhook.match_status });
  }

  let candidateRows: Array<{
    id: string;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
    answers: Record<string, unknown> | null;
  }> = [];

  if (explicitApplicationId) {
    const { data } = await supabase
      .schema("epl")
      .from("player_applications")
      .select("id, email, first_name, last_name, answers")
      .eq("id", explicitApplicationId)
      .limit(1);
    candidateRows = (data || []) as typeof candidateRows;
    if (candidateRows.length === 1) {
      const candidate = candidateRows[0];
      const emailMismatch = email && String(candidate.email || "").trim().toLowerCase() !== email;
      const firstNameMismatch =
        firstName && String(candidate.first_name || "").trim().toLowerCase() !== firstName.trim().toLowerCase();
      const lastNameMismatch =
        lastName && String(candidate.last_name || "").trim().toLowerCase() !== lastName.trim().toLowerCase();
      if (emailMismatch || firstNameMismatch || lastNameMismatch) {
        candidateRows = [];
      }
    }
  }

  if (!candidateRows.length && email) {
    const { data } = await supabase
      .schema("epl")
      .from("player_applications")
      .select("id, email, first_name, last_name, answers")
      .ilike("email", email)
      .order("submitted_at", { ascending: false });
    candidateRows = (data || []) as typeof candidateRows;
  }

  if (!candidateRows.length && fullName) {
    const normalizedName = fullName.trim().toLowerCase();
    const { data } = await supabase
      .schema("epl")
      .from("player_applications")
      .select("id, email, first_name, last_name, answers")
      .order("submitted_at", { ascending: false });
    candidateRows = ((data || []) as typeof candidateRows).filter((row) =>
      `${row.first_name || ""} ${row.last_name || ""}`.trim().toLowerCase() === normalizedName,
    );
  }

  if (candidateRows.length > 1 && (firstName || lastName)) {
    const narrowed = candidateRows.filter((row) => {
      const firstMatches = !firstName || String(row.first_name || "").trim().toLowerCase() === firstName.trim().toLowerCase();
      const lastMatches = !lastName || String(row.last_name || "").trim().toLowerCase() === lastName.trim().toLowerCase();
      return firstMatches && lastMatches;
    });
    if (narrowed.length) candidateRows = narrowed;
  }

  const candidateIds = dedupeIds(candidateRows.map((row) => row.id));
  let matchStatus: "matched" | "ambiguous" | "unmatched" = "unmatched";
  let matchedApplicationId: string | null = null;
  let notes = "";

  if (candidateIds.length === 1) {
    matchStatus = "matched";
    matchedApplicationId = candidateIds[0];
    notes = explicitApplicationId
      ? "Matched by application_id from waiver submission."
      : email
        ? "Matched by player email from waiver submission."
        : "Matched by player name from waiver submission.";
  } else if (candidateIds.length > 1) {
    matchStatus = "ambiguous";
    notes = "More than one player registration matched this waiver submission. Operator review is required.";
  } else {
    notes = "No player registration could be matched safely from the waiver submission.";
  }

  const persistedPayload = {
    tally_event_id: eventId || submissionId,
    submission_id: submissionId || null,
    form_id: formId || null,
    form_name: String(payload.data?.formName || "").trim() || null,
    respondent_id: String(payload.data?.respondentId || "").trim() || null,
    signature_verified: signatureState.verified,
    email: email || null,
    first_name: firstName || null,
    last_name: lastName || null,
    match_status: matchStatus,
    matched_application_id: matchedApplicationId,
    candidate_application_ids: candidateIds,
    notes,
    submitted_at: payload.data?.createdAt || payload.createdAt || null,
    payload,
    processed_at: new Date().toISOString(),
  };

  const { error: webhookInsertError } = await supabase
    .schema("epl")
    .from("waiver_webhook_submissions")
    .insert(persistedPayload);

  if (webhookInsertError) {
    console.error("[tally-waiver-webhook] could not persist webhook", webhookInsertError);
    return NextResponse.json({ error: webhookInsertError.message }, { status: 500 });
  }

  if (matchedApplicationId) {
    const matched = candidateRows[0];
    const nextAnswers = {
      ...((matched?.answers || {}) as Record<string, unknown>),
      waiverStatus: "complete",
      waiverCompletedAt: payload.data?.createdAt || payload.createdAt || new Date().toISOString(),
      waiverSubmissionId: submissionId || eventId || null,
      waiverWebhookEventId: eventId || null,
    };

    const { error: applicationUpdateError } = await supabase
      .schema("epl")
      .from("player_applications")
      .update({
        answers: nextAnswers,
        updated_at: new Date().toISOString(),
      })
      .eq("id", matchedApplicationId);

    if (applicationUpdateError) {
      console.error("[tally-waiver-webhook] matched application update failed", {
        applicationId: matchedApplicationId,
        error: applicationUpdateError,
      });
      return NextResponse.json({ error: applicationUpdateError.message }, { status: 500 });
    }

    console.log("[tally-waiver-webhook] matched waiver", {
      applicationId: matchedApplicationId,
      email,
      submissionId,
    });
  } else if (matchStatus === "ambiguous") {
    console.warn("[tally-waiver-webhook] ambiguous waiver", {
      email,
      submissionId,
      candidateIds,
    });
  } else {
    console.warn("[tally-waiver-webhook] unmatched waiver", {
      email,
      submissionId,
    });
  }

  return NextResponse.json({
    ok: true,
    matchStatus,
    matchedApplicationId,
    candidateCount: candidateIds.length,
  });
}
