import { normalizePermissionCodes } from "@/lib/access-control";

export const VOLUNTEER_PERK_OPTIONS = [
  "free admission",
  "food provided",
  "drink ticket",
  "VIP access",
  "networking access",
  "resume credit",
  "recommendation letter eligibility",
  "merch",
  "travel support",
  "behind-the-scenes access",
  "team credential",
  "future paid-role priority",
  "community recognition",
  "staff appreciation perks",
] as const;

export const STAFFING_DEPARTMENTS = [
  "Operations",
  "Experience",
  "Scanner",
  "Content",
  "Community",
  "Sponsorship",
  "Media",
  "Team Support",
  "Leadership",
] as const;

export const POSITION_STATUS_OPTIONS = ["open", "nearly_filled", "filled", "closed", "archived"] as const;
export const POSITION_VISIBILITY_OPTIONS = ["public", "internal_only"] as const;
export const ASSIGNMENT_STATUS_OPTIONS = ["pending", "assigned", "confirmed", "declined", "removed"] as const;
export const ACCESS_TRACK_OPTIONS = [
  "none",
  "limited_ops",
  "scanner",
  "support",
  "workforce",
  "office",
] as const;

export function normalizeStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return Array.from(new Set(value.map((item) => String(item || "").trim()).filter(Boolean)));
  }
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeRoleType(value: unknown) {
  return String(value || "").trim() === "paid" ? "paid" : "volunteer";
}

export function normalizePositionStatus(value: unknown) {
  const next = String(value || "").trim();
  return POSITION_STATUS_OPTIONS.includes(next as (typeof POSITION_STATUS_OPTIONS)[number]) ? next : "open";
}

export function normalizeVisibility(value: unknown) {
  return String(value || "").trim() === "internal_only" ? "internal_only" : "public";
}

export function normalizeAssignmentStatus(value: unknown) {
  const next = String(value || "").trim();
  return ASSIGNMENT_STATUS_OPTIONS.includes(next as (typeof ASSIGNMENT_STATUS_OPTIONS)[number]) ? next : "pending";
}

export function buildCompensationLabel(position: {
  role_type?: string | null;
  pay_amount?: number | string | null;
  pay_type?: string | null;
  employment_status?: string | null;
}) {
  if (position.role_type !== "paid") return "Volunteer";
  const amount = position.pay_amount ? `$${position.pay_amount}` : null;
  const payType = String(position.pay_type || "").replace(/_/g, " ");
  const employment = String(position.employment_status || "").replace(/_/g, " ");
  return [amount, payType, employment].filter(Boolean).join(" • ") || "Paid role";
}

export function buildPublicPositionSummary(position: {
  summary?: string | null;
  notes?: string | null;
  role_type?: string | null;
  city?: string | null;
  season_name?: string | null;
  event_title?: string | null;
}) {
  if (position.summary) return position.summary;
  const pieces = [
    position.role_type === "paid" ? "Paid staff role" : "Volunteer role",
    position.event_title ? `for ${position.event_title}` : null,
    position.season_name ? `during ${position.season_name}` : null,
    position.city ? `in ${position.city}` : null,
  ].filter(Boolean);
  return pieces.join(" ") || "Join EPL operations.";
}

export function buildAssignmentPermissionCodes(value: unknown) {
  return normalizePermissionCodes(value);
}

export function normalizeAccessTrack(value: unknown) {
  const next = String(value || "").trim();
  return ACCESS_TRACK_OPTIONS.includes(next as (typeof ACCESS_TRACK_OPTIONS)[number]) ? next : "none";
}

export function getAccessTrackLabel(track: string | null | undefined) {
  switch (track) {
    case "limited_ops":
      return "Limited operational access";
    case "scanner":
      return "Scanner access";
    case "support":
      return "Support access";
    case "workforce":
      return "Workforce access";
    case "office":
      return "Office-level access";
    default:
      return "No system access";
  }
}
