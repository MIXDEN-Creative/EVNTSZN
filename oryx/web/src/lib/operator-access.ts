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
    label: "HQ Team",
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
    label: "Curator Development Manager",
    dashboards: ["ops", "hosts"],
    surfaces: ["ops", "hosts"],
    modules: ["hosts", "approvals", "training"],
    approvals: ["host"],
  },
  partnerships_manager: {
    label: "Sponsorships Manager",
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
    label: "Curator",
    dashboards: ["ops", "hosts"],
    surfaces: ["ops", "hosts"],
    modules: ["events", "training"],
    approvals: [],
  },
  certified_host: {
    label: "Certified Curator",
    dashboards: ["ops", "hosts", "scanner"],
    surfaces: ["ops", "hosts", "scanner"],
    modules: ["events", "training", "scanner"],
    approvals: [],
  },
  pro_host: {
    label: "Pro Curator",
    dashboards: ["ops", "hosts", "scanner", "analytics"],
    surfaces: ["ops", "hosts", "scanner"],
    modules: ["events", "training", "scanner", "analytics"],
    approvals: ["host"],
  },
  independent_organizer: {
    label: "Partner",
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
    label: "EPL Admin",
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

export const ORGANIZER_CLASSIFICATION_LABELS = {
  evntszn_host: "EVNTSZN Curator",
  independent_organizer: "Partner",
  city_host: "City Curator / Leader",
  venue_partner: "Venue Partner",
  internal_operator: "Internal Ops",
} as const;

export const LEGACY_INTERNAL_TERMINOLOGY_ALIASES = {
  host: "curator",
  hosts: "curators",
  organizer: "partner",
  organizers: "partners",
  partner: "sponsor",
  partners: "sponsors",
} as const;

export type OrganizerClassification = keyof typeof ORGANIZER_CLASSIFICATION_LABELS;

export function inferOrganizerClassification(roleKey: string | null | undefined): OrganizerClassification {
  switch (roleKey) {
    case "host":
    case "certified_host":
    case "pro_host":
    case "host_development_manager":
      return "evntszn_host";
    case "independent_organizer":
      return "independent_organizer";
    case "city_commissioner":
    case "deputy_commissioner":
    case "city_leader":
      return "city_host";
    case "venue_user":
      return "venue_partner";
    default:
      return "internal_operator";
  }
}

export function getOrganizerClassificationLabel(value: string | null | undefined) {
  if (!value) return ORGANIZER_CLASSIFICATION_LABELS.internal_operator;
  return ORGANIZER_CLASSIFICATION_LABELS[value as OrganizerClassification] || ORGANIZER_CLASSIFICATION_LABELS.internal_operator;
}

export function getOrganizerClassificationOptions() {
  return Object.entries(ORGANIZER_CLASSIFICATION_LABELS).map(([value, label]) => ({
    value,
    label,
  }));
}

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
