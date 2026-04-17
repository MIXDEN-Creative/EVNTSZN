import { NextResponse } from "next/server";
import { requirePlatformUser } from "@/lib/evntszn";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { calculateWorkedMinutes, deriveOvertimeMinutes } from "@/lib/workforce";

function unwrapOne<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] || null : value || null;
}

function toPayAmountUsd(value: number | string | null | undefined) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount * 100) / 100;
}

export async function GET() {
  const viewer = await requirePlatformUser("/ops/time");
  const userId = viewer.user!.id;

  const [entriesRes, assignmentsRes] = await Promise.all([
    supabaseAdmin
      .from("workforce_time_entries")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabaseAdmin
      .schema("epl")
      .from("staff_assignments")
      .select(`
        id,
        assignment_status,
        staff_positions:position_id (
          id,
          title_override,
          city,
          state,
          pay_amount,
          pay_type,
          employment_status,
          staff_role_templates:role_template_id (
            title
          )
        )
      `)
      .eq("user_id", userId)
      .in("assignment_status", ["assigned", "confirmed"]),
  ]);

  const error = entriesRes.error || assignmentsRes.error;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const entries = (entriesRes.data || []).map((entry: any) => ({
    ...entry,
    minutes_worked: entry.minutes_worked || calculateWorkedMinutes(entry),
  }));

  return NextResponse.json({
    entries,
    assignments: (assignmentsRes.data || []).map((assignment: any) => ({
      id: assignment.id,
      position: (() => {
        const position = unwrapOne(assignment.staff_positions);
        const template = unwrapOne(position?.staff_role_templates);
        if (!position) return null;
        return {
          ...position,
          title: position.title_override || template?.title || "Assigned role",
          pay_amount_usd: toPayAmountUsd(position.pay_amount),
        };
      })(),
    })),
  });
}

export async function POST(request: Request) {
  const viewer = await requirePlatformUser("/ops/time");
  const userId = viewer.user!.id;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(body.action || "");

  const openEntryRes = await supabaseAdmin
    .from("workforce_time_entries")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["draft", "corrected"])
    .is("ended_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const draftEntryRes = await supabaseAdmin
    .from("workforce_time_entries")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["draft", "corrected"])
    .not("ended_at", "is", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (openEntryRes.error || draftEntryRes.error) {
    return NextResponse.json({ error: openEntryRes.error?.message || draftEntryRes.error?.message }, { status: 500 });
  }

  const openEntry = openEntryRes.data as any;
  const draftEntry = draftEntryRes.data as any;

  if (action === "clock_in") {
    if (openEntry) {
      return NextResponse.json({ error: "Clock out of the current entry before starting another one." }, { status: 400 });
    }

    const assignmentId = String(body.staffAssignmentId || "");
    const assignmentsRes = await supabaseAdmin
      .schema("epl")
      .from("staff_assignments")
      .select(`
        id,
        staff_positions:position_id (
          id,
          title_override,
          city,
          pay_amount,
          pay_type,
          employment_status,
          staff_role_templates:role_template_id (
            title
          )
        )
      `)
      .eq("id", assignmentId)
      .eq("user_id", userId)
      .maybeSingle();

    if (assignmentsRes.error || !assignmentsRes.data) {
      return NextResponse.json({ error: assignmentsRes.error?.message || "Assignment not found." }, { status: 404 });
    }

    const position = unwrapOne(assignmentsRes.data.staff_positions);

    const insert = await supabaseAdmin.from("workforce_time_entries").insert({
      user_id: userId,
      staff_assignment_id: assignmentsRes.data.id,
      staff_position_id: position?.id || null,
      city: position?.city || null,
      pay_type: position?.pay_type || "hourly",
      pay_amount_usd: toPayAmountUsd(position?.pay_amount),
      employment_type: position?.employment_status || null,
      status: "draft",
      started_at: new Date().toISOString(),
      source: "clock",
    });

    if (insert.error) return NextResponse.json({ error: insert.error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (!openEntry && ["clock_out", "break_start", "break_end"].includes(action)) {
    return NextResponse.json({ error: "No active time entry found." }, { status: 400 });
  }

  if (action === "break_start") {
    const update = await supabaseAdmin
      .from("workforce_time_entries")
      .update({ break_started_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", openEntry.id);
    if (update.error) return NextResponse.json({ error: update.error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "break_end") {
    const breakEndedAt = new Date().toISOString();
    const startedAt = openEntry.break_started_at ? new Date(openEntry.break_started_at).getTime() : NaN;
    const endedAt = new Date(breakEndedAt).getTime();
    const deltaMinutes = Number.isNaN(startedAt) ? 0 : Math.max(0, Math.round((endedAt - startedAt) / 60000));
    const update = await supabaseAdmin
      .from("workforce_time_entries")
      .update({
        break_started_at: null,
        break_ended_at: breakEndedAt,
        break_minutes: Number(openEntry.break_minutes || 0) + deltaMinutes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", openEntry.id);
    if (update.error) return NextResponse.json({ error: update.error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "clock_out") {
    const endedAt = new Date().toISOString();
    const minutesWorked = calculateWorkedMinutes({
      startedAt: openEntry.started_at,
      endedAt,
      breakMinutes: openEntry.break_minutes,
    });
    const overtimeBreakdown = deriveOvertimeMinutes({
      payType: openEntry.pay_type,
      minutesWorked,
      payPeriodMinutesWorked: minutesWorked,
    });
    const update = await supabaseAdmin
      .from("workforce_time_entries")
      .update({
        ended_at: endedAt,
        minutes_worked: minutesWorked,
        regular_minutes: overtimeBreakdown.regularMinutes,
        overtime_minutes: overtimeBreakdown.overtimeMinutes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", openEntry.id);
    if (update.error) return NextResponse.json({ error: update.error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "submit") {
    const submitEntry = draftEntry || null;
    if (!submitEntry) {
      return NextResponse.json({ error: "Clock out before submitting hours." }, { status: 400 });
    }
    const minutesWorked = calculateWorkedMinutes({
      startedAt: submitEntry.started_at,
      endedAt: submitEntry.ended_at,
      breakMinutes: submitEntry.break_minutes,
    });
    const overtimeBreakdown = deriveOvertimeMinutes({
      payType: submitEntry.pay_type,
      minutesWorked,
      payPeriodMinutesWorked: minutesWorked,
    });
    const update = await supabaseAdmin
      .from("workforce_time_entries")
      .update({
        status: "submitted",
        minutes_worked: minutesWorked,
        regular_minutes: overtimeBreakdown.regularMinutes,
        overtime_minutes: overtimeBreakdown.overtimeMinutes,
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", submitEntry.id);
    if (update.error) return NextResponse.json({ error: update.error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
}
