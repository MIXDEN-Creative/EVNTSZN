import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { calculateWorkedMinutes, deriveOvertimeMinutes, estimatePayoutCents, minutesToHours, toCsv } from "@/lib/workforce";
import { toDatabaseUserId } from "@/lib/access-control";

function unwrapOne<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] || null : value || null;
}

function toPayAmountCents(value: number | string | null | undefined) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount * 100);
}

export async function GET(request: NextRequest) {
  await requireAdminPermission("workforce.view", "/epl/admin/workforce");
  const payPeriodId = request.nextUrl.searchParams.get("payPeriodId");
  const exportFormat = request.nextUrl.searchParams.get("format");

  let entriesQuery = supabaseAdmin
    .from("workforce_time_entries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (payPeriodId) {
    entriesQuery = entriesQuery.eq("pay_period_id", payPeriodId);
  }

  const [entriesRes, periodsRes, positionsRes, profilesRes, eventsRes] = await Promise.all([
    entriesQuery,
    supabaseAdmin
      .from("workforce_pay_periods")
      .select("*")
      .order("starts_on", { ascending: false }),
    supabaseAdmin
      .schema("epl")
      .from("staff_positions")
      .select(`
        id,
        title_override,
        city,
        state,
        pay_type,
        pay_amount,
        employment_status,
        event_id,
        staff_role_templates:role_template_id (
          title,
          role_type
        )
      `)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("evntszn_profiles")
      .select("user_id, full_name, city"),
    supabaseAdmin
      .from("evntszn_events")
      .select("id, title, city"),
  ]);

  const error = entriesRes.error || periodsRes.error || positionsRes.error || profilesRes.error || eventsRes.error;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const profilesByUserId = new Map((profilesRes.data || []).map((profile) => [profile.user_id, profile]));
  const positionsById = new Map(
    (positionsRes.data || []).map((position: any) => {
      const template = unwrapOne(position.staff_role_templates);
      return [
        position.id,
        {
          ...position,
          title: position.title_override || template?.title || "Staff role",
          role_type: template?.role_type || null,
          pay_amount_cents: toPayAmountCents(position.pay_amount),
          linked_event_id: position.event_id || null,
        },
      ];
    }),
  );
  const eventsById = new Map((eventsRes.data || []).map((event) => [event.id, event]));
  const periodsById = new Map((periodsRes.data || []).map((period: any) => [period.id, period]));
  const periodMinutesByUserId = new Map<string, number>();

  for (const entry of entriesRes.data || []) {
    const totalForUser = periodMinutesByUserId.get(entry.user_id) || 0;
    const minutesWorked = entry.minutes_worked || calculateWorkedMinutes(entry);
    periodMinutesByUserId.set(entry.user_id, totalForUser + minutesWorked);
  }

  const entries = (entriesRes.data || []).map((entry: any) => {
    const profile = profilesByUserId.get(entry.user_id);
    const position = entry.staff_position_id ? positionsById.get(entry.staff_position_id) : null;
    const linkedEvent = entry.linked_event_id ? eventsById.get(entry.linked_event_id) : position?.linked_event_id ? eventsById.get(position.linked_event_id) : null;
    const period = entry.pay_period_id ? periodsById.get(entry.pay_period_id) : null;
    const minutesWorked = entry.minutes_worked || calculateWorkedMinutes(entry);
    const overtimeBreakdown = deriveOvertimeMinutes({
      payType: entry.pay_type || position?.pay_type,
      minutesWorked,
      payPeriodMinutesWorked: periodMinutesByUserId.get(entry.user_id) || minutesWorked,
      overtimeDailyThresholdHours: period?.overtime_daily_threshold_hours,
      overtimeWeeklyThresholdHours: period?.overtime_weekly_threshold_hours,
    });
    return {
      ...entry,
      minutes_worked: minutesWorked,
      regular_minutes: entry.regular_minutes || overtimeBreakdown.regularMinutes,
      overtime_minutes: entry.overtime_minutes || overtimeBreakdown.overtimeMinutes,
      estimated_payout_cents: estimatePayoutCents({
        payType: entry.pay_type || position?.pay_type,
        payAmountCents: entry.pay_amount_cents || position?.pay_amount_cents,
        minutesWorked,
        overtimeMinutes: entry.overtime_minutes || overtimeBreakdown.overtimeMinutes,
      }),
      user_name: profile?.full_name || entry.user_id,
      city: entry.city || position?.city || profile?.city || null,
      position_title: position?.title || null,
      event_title: linkedEvent?.title || null,
      pay_period_label: period?.label || null,
    };
  });

  const payrollSummaryByUser = new Map<string, any>();
  for (const entry of entries) {
    const current = payrollSummaryByUser.get(entry.user_id) || {
      userId: entry.user_id,
      userName: entry.user_name,
      city: entry.city || null,
      payType: entry.pay_type || "hourly",
      regularMinutes: 0,
      overtimeMinutes: 0,
      approvedMinutes: 0,
      pendingMinutes: 0,
      estimatedGrossPayoutCents: 0,
    };

    current.regularMinutes += entry.regular_minutes || 0;
    current.overtimeMinutes += entry.overtime_minutes || 0;
    if (entry.status === "submitted") current.pendingMinutes += entry.minutes_worked || 0;
    if (entry.status === "approved" || entry.status === "ready_for_payroll") current.approvedMinutes += entry.minutes_worked || 0;
    if (entry.status === "approved" || entry.status === "ready_for_payroll") current.estimatedGrossPayoutCents += entry.estimated_payout_cents || 0;
    payrollSummaryByUser.set(entry.user_id, current);
  }

  const payrollSummaries = Array.from(payrollSummaryByUser.values()).map((summary) => ({
    ...summary,
    regularHours: minutesToHours(summary.regularMinutes),
    overtimeHours: minutesToHours(summary.overtimeMinutes),
    approvedHours: minutesToHours(summary.approvedMinutes),
    pendingHours: minutesToHours(summary.pendingMinutes),
  }));

  if (exportFormat === "csv") {
    const csv = toCsv(
      payrollSummaries.map((summary) => ({
        user_name: summary.userName,
        city: summary.city,
        pay_type: summary.payType,
        regular_hours: summary.regularHours,
        overtime_hours: summary.overtimeHours,
        approved_hours: summary.approvedHours,
        pending_hours: summary.pendingHours,
        estimated_gross_payout: (summary.estimatedGrossPayoutCents / 100).toFixed(2),
      })),
    );

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="workforce-payroll-summary${payPeriodId ? `-${payPeriodId}` : ""}.csv"`,
      },
    });
  }

  return NextResponse.json({
    entries,
    payPeriods: periodsRes.data || [],
    positions: positionsRes.data || [],
    payrollSummaries,
    summaries: {
      clockedIn: entries.filter((entry: any) => !entry.ended_at && ["draft", "corrected"].includes(entry.status)).length,
      submitted: entries.filter((entry: any) => entry.status === "submitted").length,
      readyForPayroll: entries.filter((entry: any) => entry.status === "ready_for_payroll").length,
      pending: entries.filter((entry: any) => entry.status === "submitted").length,
      approvedHours: entries
        .filter((entry: any) => entry.status === "approved" || entry.status === "ready_for_payroll")
        .reduce((sum: number, entry: any) => sum + (entry.minutes_worked || 0), 0) / 60,
      overtimeHours: entries.reduce((sum: number, entry: any) => sum + (entry.overtime_minutes || 0), 0) / 60,
      pendingHours: entries
        .filter((entry: any) => entry.status === "submitted")
        .reduce((sum: number, entry: any) => sum + (entry.minutes_worked || 0), 0) / 60,
      estimatedPayrollCents: entries
        .filter((entry: any) => entry.status === "approved" || entry.status === "ready_for_payroll")
      .reduce((sum: number, entry: any) => sum + (entry.estimated_payout_cents || 0), 0),
    },
    selectedPayPeriod: payPeriodId ? periodsById.get(payPeriodId) || null : null,
  });
}

export async function POST(request: Request) {
  const { user } = await requireAdminPermission("workforce.manage", "/epl/admin/workforce");
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(body.action || "");

  if (action === "manual_entry") {
    const startedAt = String(body.startedAt || "");
    const endedAt = String(body.endedAt || "");
    const minutesWorked = calculateWorkedMinutes({
      startedAt,
      endedAt,
      breakMinutes: Number(body.breakMinutes || 0),
    });
    const overtimeBreakdown = deriveOvertimeMinutes({
      payType: String(body.payType || "hourly"),
      minutesWorked,
      payPeriodMinutesWorked: minutesWorked,
    });
    const insert = await supabaseAdmin.from("workforce_time_entries").insert({
      user_id: String(body.userId || ""),
      staff_assignment_id: body.staffAssignmentId || null,
      staff_position_id: body.staffPositionId || null,
      pay_period_id: body.payPeriodId || null,
      linked_event_id: body.linkedEventId || null,
      scope_type: body.scopeType || null,
      scope_label: body.scopeLabel || null,
      city: body.city || null,
      office_label: body.officeLabel || null,
      pay_type: body.payType || "hourly",
      employment_type: body.employmentType || null,
      pay_amount_cents: Number(body.payAmountCents || 0) || null,
      status: body.status || "draft",
      started_at: startedAt || null,
      ended_at: endedAt || null,
      break_minutes: Number(body.breakMinutes || 0),
      minutes_worked: minutesWorked,
      regular_minutes: overtimeBreakdown.regularMinutes,
      overtime_minutes: overtimeBreakdown.overtimeMinutes,
      submitted_at: body.status === "submitted" ? new Date().toISOString() : null,
      notes: body.notes || null,
      source: "manual",
    });
    if (insert.error) return NextResponse.json({ error: insert.error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const entryId = String(body.entryId || "");
  if (!entryId) {
    return NextResponse.json({ error: "Entry is required." }, { status: 400 });
  }

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (action === "approve") {
    updatePayload.status = body.readyForPayroll ? "ready_for_payroll" : "approved";
    updatePayload.approved_at = new Date().toISOString();
    updatePayload.approved_by = toDatabaseUserId(user.id);
    updatePayload.manager_notes = body.managerNotes || null;
  } else if (action === "reject") {
    updatePayload.status = "rejected";
    updatePayload.manager_notes = body.managerNotes || null;
  } else if (action === "correct") {
    const correctedMinutesWorked = Number(body.minutesWorked || 0);
    const correctedOvertime = deriveOvertimeMinutes({
      payType: String(body.payType || body.currentPayType || "hourly"),
      minutesWorked: correctedMinutesWorked,
      payPeriodMinutesWorked: correctedMinutesWorked,
    });
    updatePayload.status = "corrected";
    updatePayload.manager_notes = body.managerNotes || null;
    if ("minutesWorked" in body) {
      updatePayload.minutes_worked = correctedMinutesWorked;
      updatePayload.regular_minutes = correctedOvertime.regularMinutes;
      updatePayload.overtime_minutes = correctedOvertime.overtimeMinutes;
    }
    if ("breakMinutes" in body) updatePayload.break_minutes = Number(body.breakMinutes || 0);
  } else {
    return NextResponse.json({ error: "Unsupported workforce action." }, { status: 400 });
  }

  const update = await supabaseAdmin.from("workforce_time_entries").update(updatePayload).eq("id", entryId);
  if (update.error) return NextResponse.json({ error: update.error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
