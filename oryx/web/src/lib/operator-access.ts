export const OPERATOR_ROLE_PRESETS = {
  founder: {
    label: "Founder",
    dashboards: ["hq", "admin", "ops", "scanner", "content", "analytics"],
    surfaces: ["hq", "admin", "ops", "scanner", "hosts"],
    modules: ["users", "content", "discovery", "epl", "store", "sponsors", "analytics", "approvals"],
    approvals: ["all"],
  },
  admin: {
    label: "Admin",
    dashboards: ["admin", "ops", "content", "analytics"],
    surfaces: ["admin", "ops"],
    modules: ["users", "content", "discovery", "epl", "store", "sponsors", "approvals"],
    approvals: ["host", "organizer", "partner"],
  },
  hq_operator: {
    label: "HQ Operator",
    dashboards: ["hq", "analytics", "content"],
    surfaces: ["hq", "admin", "ops"],
    modules: ["content", "discovery", "analytics", "approvals", "sponsors"],
    approvals: ["host", "organizer"],
  },
  city_commissioner: {
    label: "City Commissioner",
    dashboards: ["city", "ops", "analytics"],
    surfaces: ["ops", "scanner"],
    modules: ["events", "hosts", "organizers", "approvals", "scanner"],
    approvals: ["host", "organizer"],
  },
  deputy_commissioner: {
    label: "Deputy Commissioner",
    dashboards: ["city", "ops"],
    surfaces: ["ops", "scanner"],
    modules: ["events", "hosts", "scanner"],
    approvals: ["host"],
  },
  city_leader: {
    label: "City Leader",
    dashboards: ["city", "ops"],
    surfaces: ["ops"],
    modules: ["events", "hosts", "content"],
    approvals: ["host"],
  },
  host_development_manager: {
    label: "Host Development Manager",
    dashboards: ["ops", "hosts"],
    surfaces: ["ops", "hosts"],
    modules: ["hosts", "approvals", "training"],
    approvals: ["host"],
  },
  partnerships_manager: {
    label: "Partnerships Manager",
    dashboards: ["admin", "analytics"],
    surfaces: ["admin"],
    modules: ["sponsors", "packages", "analytics"],
    approvals: ["partner"],
  },
  audience_growth_manager: {
    label: "Audience & Growth Manager",
    dashboards: ["admin", "content", "analytics"],
    surfaces: ["admin"],
    modules: ["content", "discovery", "analytics"],
    approvals: [],
  },
  operations_coordinator: {
    label: "Operations Coordinator",
    dashboards: ["ops", "scanner"],
    surfaces: ["ops", "scanner"],
    modules: ["events", "scanner", "checkin"],
    approvals: [],
  },
  host: {
    label: "Host",
    dashboards: ["ops", "hosts"],
    surfaces: ["ops", "hosts"],
    modules: ["events", "training"],
    approvals: [],
  },
  certified_host: {
    label: "Certified Host",
    dashboards: ["ops", "hosts", "scanner"],
    surfaces: ["ops", "hosts", "scanner"],
    modules: ["events", "training", "scanner"],
    approvals: [],
  },
  pro_host: {
    label: "Pro Host",
    dashboards: ["ops", "hosts", "scanner", "analytics"],
    surfaces: ["ops", "hosts", "scanner"],
    modules: ["events", "training", "scanner", "analytics"],
    approvals: ["host"],
  },
  independent_organizer: {
    label: "Independent Organizer",
    dashboards: ["ops"],
    surfaces: ["ops", "scanner"],
    modules: ["events", "tickets", "scanner", "analytics"],
    approvals: [],
  },
  venue_user: {
    label: "Venue User",
    dashboards: ["ops"],
    surfaces: ["ops", "scanner"],
    modules: ["events", "scanner"],
    approvals: [],
  },
  scanner_staff: {
    label: "Scanner Staff",
    dashboards: ["scanner"],
    surfaces: ["scanner"],
    modules: ["scanner", "checkin"],
    approvals: [],
  },
  epl_operator: {
    label: "EPL Operator",
    dashboards: ["admin", "analytics"],
    surfaces: ["admin", "hq"],
    modules: ["epl", "teams", "standings", "schedule"],
    approvals: [],
  },
  referee_staff: {
    label: "Referee / Staff",
    dashboards: ["ops"],
    surfaces: ["ops"],
    modules: ["schedule", "assignments"],
    approvals: [],
  },
} as const;

export type OperatorRoleKey = keyof typeof OPERATOR_ROLE_PRESETS;

export function getOperatorPreset(roleKey: string | null | undefined) {
  if (!roleKey) return null;
  return OPERATOR_ROLE_PRESETS[roleKey as OperatorRoleKey] || null;
}

export function getOperatorRoleOptions() {
  return Object.entries(OPERATOR_ROLE_PRESETS).map(([value, preset]) => ({
    value,
    label: preset.label,
  }));
}

export function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}
