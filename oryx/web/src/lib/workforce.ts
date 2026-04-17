export const WORKFORCE_ENTRY_STATUSES = [
  "draft",
  "submitted",
  "approved",
  "rejected",
  "corrected",
  "ready_for_payroll",
] as const;

export const WORKFORCE_PAY_TYPES = [
  "hourly",
  "daily",
  "weekly",
  "monthly",
  "stipend",
  "fixed",
] as const;

export type WorkforcePayType = (typeof WORKFORCE_PAY_TYPES)[number];

export function clampMinutes(value: number) {
  return Math.max(0, Math.round(Number(value || 0)));
}

export function calculateWorkedMinutes(input: {
  startedAt?: string | null;
  endedAt?: string | null;
  breakMinutes?: number | null;
}) {
  const start = input.startedAt ? new Date(input.startedAt).getTime() : NaN;
  const end = input.endedAt ? new Date(input.endedAt).getTime() : NaN;
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 0;
  const totalMinutes = Math.round((end - start) / 60000);
  return Math.max(0, totalMinutes - Math.max(0, input.breakMinutes || 0));
}

export function estimatePayoutUsd(input: {
  payType?: string | null;
  payAmountUsd?: number | null;
  minutesWorked?: number | null;
  overtimeMinutes?: number | null;
}) {
  const payType = String(input.payType || "hourly");
  const amount = Number(input.payAmountUsd || 0);
  const minutes = Number(input.minutesWorked || 0);
  const overtimeMinutes = Number(input.overtimeMinutes || 0);
  if (!amount) return 0;
  if (payType === "hourly") {
    const regularMinutes = Math.max(0, minutes - overtimeMinutes);
    const regularPay = (amount / 60) * regularMinutes;
    const overtimePay = ((amount * 1.5) / 60) * overtimeMinutes;
    return Math.round((regularPay + overtimePay) * 100) / 100;
  }
  return Math.round(amount * 100) / 100;
}

export function formatPayoutLabel(input: {
  payType?: string | null;
  payAmountUsd?: number | null;
}) {
  const amount = Number(input.payAmountUsd || 0);
  if (!amount) return "Unpaid";
  const dollars = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
  const payType = String(input.payType || "hourly");
  if (payType === "fixed" || payType === "stipend") return `${dollars} ${payType}`;
  return `${dollars}/${payType.replace(/ly$/, "")}`;
}

export function deriveOvertimeMinutes(input: {
  payType?: string | null;
  minutesWorked?: number | null;
  payPeriodMinutesWorked?: number | null;
  overtimeDailyThresholdHours?: number | null;
  overtimeWeeklyThresholdHours?: number | null;
}) {
  const payType = String(input.payType || "hourly");
  if (payType !== "hourly") {
    return {
      regularMinutes: clampMinutes(Number(input.minutesWorked || 0)),
      overtimeMinutes: 0,
    };
  }

  const minutesWorked = clampMinutes(Number(input.minutesWorked || 0));
  const payPeriodMinutesWorked = clampMinutes(Number(input.payPeriodMinutesWorked || minutesWorked));
  const dailyThresholdMinutes = clampMinutes(Number(input.overtimeDailyThresholdHours || 8) * 60);
  const weeklyThresholdMinutes = clampMinutes(Number(input.overtimeWeeklyThresholdHours || 40) * 60);

  const dailyOvertime = Math.max(0, minutesWorked - dailyThresholdMinutes);
  const weeklyOvertime = Math.max(0, payPeriodMinutesWorked - weeklyThresholdMinutes);
  const overtimeMinutes = Math.min(minutesWorked, Math.max(dailyOvertime, weeklyOvertime));
  const regularMinutes = Math.max(0, minutesWorked - overtimeMinutes);

  return { regularMinutes, overtimeMinutes };
}

export function minutesToHours(value: number) {
  return Math.round((clampMinutes(value) / 60) * 100) / 100;
}

export function toCsv(rows: Array<Record<string, string | number | null | undefined>>) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (value: string | number | null | undefined) =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;

  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escape(row[header])).join(",")),
  ].join("\n");
}
