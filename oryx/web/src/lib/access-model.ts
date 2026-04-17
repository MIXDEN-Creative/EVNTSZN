export const PRIMARY_ROLE_OPTIONS = [
  {
    value: "hq",
    label: "HQ",
    description: "Global leadership, oversight, and cross-system control.",
  },
  {
    value: "admin",
    label: "Admin",
    description: "Internal management for assigned operational areas.",
  },
  {
    value: "office_manager",
    label: "Office Manager",
    description: "City or office-level management for local execution.",
  },
  {
    value: "ops",
    label: "Ops",
    description: "Daily execution for events, staffing, scanner, and support.",
  },
  {
    value: "scanner",
    label: "Scanner",
    description: "Event check-in and gate control for assigned events only.",
  },
  {
    value: "host",
    label: "Curator",
    description: "Curator-owned event access with city or office relationship where needed.",
  },
] as const;

export const ROLE_SUBTYPE_OPTIONS: Record<string, { value: string; label: string; description: string }[]> = {
  hq: [
    {
      value: "founder_hq",
      label: "Founder HQ",
      description: "Full global access and founder override.",
    },
    {
      value: "hq_staff",
      label: "HQ Staff",
      description: "Headquarters access limited by assigned capabilities and scope.",
    },
    {
      value: "regional_director",
      label: "Regional Director",
      description: "Region-level oversight without founder-level authority.",
    },
  ],
  admin: [
    {
      value: "global_admin",
      label: "Global Admin",
      description: "Admin access across the full platform, below HQ.",
    },
    {
      value: "regional_admin",
      label: "Regional Admin",
      description: "Admin access for assigned regions.",
    },
    {
      value: "city_admin",
      label: "City Admin",
      description: "Admin access for assigned cities or offices.",
    },
  ],
  office_manager: [
    {
      value: "office_manager",
      label: "Office Manager",
      description: "Office and city execution lead.",
    },
  ],
  ops: [
    {
      value: "ops_operator",
      label: "Ops Team",
      description: "Daily execution across assigned offices, cities, or events.",
    },
  ],
  scanner: [
    {
      value: "scanner_staff",
      label: "Scanner Staff",
      description: "Check-in access for assigned events only.",
    },
  ],
  host: [
    {
      value: "network_host",
      label: "Curator",
      description: "Curator-owned event access with limited internal controls.",
    },
  ],
};

export const ROLE_SCOPE_OPTIONS: Record<string, { value: string; label: string; description: string }[]> = {
  hq: [
    { value: "global", label: "Global", description: "Access applies platform-wide." },
    { value: "region", label: "Region", description: "Access is limited to selected region(s)." },
  ],
  admin: [
    { value: "global", label: "Global", description: "Access applies platform-wide." },
    { value: "region", label: "Region", description: "Access is limited to selected region(s)." },
    { value: "city", label: "City", description: "Access is limited to selected city or cities." },
    { value: "office", label: "Office", description: "Access is limited to selected office(s)." },
  ],
  office_manager: [
    { value: "office", label: "Office", description: "Access is tied to one or more offices." },
    { value: "city", label: "City", description: "Access is tied to a city with local oversight." },
    { value: "region", label: "Region", description: "Optional region visibility where approved." },
  ],
  ops: [
    { value: "office", label: "Office", description: "Assigned office-level operations." },
    { value: "city", label: "City", description: "Assigned city-level operations." },
    { value: "event", label: "Event", description: "Assigned event-specific operations." },
  ],
  scanner: [{ value: "event", label: "Event", description: "Assigned event check-in only." }],
  host: [
    { value: "self", label: "Self", description: "Only this curator’s events and activity." },
    { value: "city", label: "City", description: "Curator access for a local city relationship." },
    { value: "office", label: "Office", description: "Curator relationship tied to an office." },
  ],
};

export const CAPABILITY_GROUPS = [
  {
    key: "users",
    label: "Users",
    description: "View and manage internal users and assignments.",
    permissionCodes: ["admin.manage"],
  },
  {
    key: "roles_invites",
    label: "Roles & invites",
    description: "Create roles, send invites, and manage access onboarding.",
    permissionCodes: ["roles.manage", "invites.manage"],
  },
  {
    key: "approvals",
    label: "Approvals",
    description: "Review and act on applications and onboarding queues.",
    permissionCodes: ["approvals.manage"],
  },
  {
    key: "discovery",
    label: "Discovery",
    description: "Control homepage, city sections, featuring, and moderation.",
    permissionCodes: ["catalog.manage", "content.manage"],
  },
  {
    key: "events",
    label: "Events",
    description: "Create and manage event records and visibility.",
    permissionCodes: ["events.manage"],
  },
  {
    key: "ticketing",
    label: "Ticketing",
    description: "Manage ticketing access, orders, and sales controls.",
    permissionCodes: ["events.manage", "orders.view", "orders.manage"],
  },
  {
    key: "scanner",
    label: "Scanner",
    description: "Manage scanner staffing and check-in tooling.",
    permissionCodes: ["scanner.manage"],
  },
  {
    key: "support",
    label: "Support",
    description: "Review, assign, and respond to support tickets.",
    permissionCodes: ["support.manage", "support.assign", "support.respond"],
  },
  {
    key: "opportunities",
    label: "Opportunities",
    description: "Manage openings, roles, and staffing access mappings.",
    permissionCodes: ["opportunities.manage"],
  },
  {
    key: "hiring",
    label: "Hiring",
    description: "Work hiring and applicant pipelines.",
    permissionCodes: ["opportunities.manage", "approvals.manage"],
  },
  {
    key: "sponsors",
    label: "Sponsors",
    description: "Manage sponsor accounts, packages, and placements.",
    permissionCodes: ["sponsors.manage"],
  },
  {
    key: "offices",
    label: "Offices",
    description: "Manage city-office operations and local execution controls.",
    permissionCodes: ["city.manage"],
  },
  {
    key: "epl",
    label: "EPL",
    description: "Work EPL event, staffing, and league operations.",
    permissionCodes: ["events.manage", "opportunities.manage", "scanner.manage"],
  },
  {
    key: "reports",
    label: "Reports",
    description: "View analytics, customer activity, and reporting.",
    permissionCodes: ["analytics.view", "customers.view", "orders.view", "rewards.view"],
  },
  {
    key: "workforce",
    label: "Workforce",
    description: "Track time, approve hours, and review payout-ready staff records.",
    permissionCodes: ["workforce.view", "workforce.manage", "workforce.approve"],
  },
  {
    key: "store",
    label: "Store",
    description: "Manage merch, storefront settings, and catalog visibility.",
    permissionCodes: ["store.manage", "catalog.manage"],
  },
  {
    key: "settings",
    label: "Settings",
    description: "Platform-level configuration and internal controls.",
    permissionCodes: ["admin.manage", "content.manage"],
  },
] as const;

export type PrimaryRoleValue = (typeof PRIMARY_ROLE_OPTIONS)[number]["value"];
export type CapabilityGroupKey = (typeof CAPABILITY_GROUPS)[number]["key"];

export function getPrimaryRoleOption(value: string | null | undefined) {
  return PRIMARY_ROLE_OPTIONS.find((option) => option.value === value) || null;
}

export function getRoleSubtypeOptions(primaryRole: string | null | undefined) {
  return ROLE_SUBTYPE_OPTIONS[primaryRole || ""] || [];
}

export function getScopeOptions(primaryRole: string | null | undefined) {
  return ROLE_SCOPE_OPTIONS[primaryRole || ""] || [];
}

export function getCapabilityGroup(key: string | null | undefined) {
  return CAPABILITY_GROUPS.find((group) => group.key === key) || null;
}

export function normalizeCapabilityGroups(value: unknown) {
  const keys = Array.isArray(value) ? value : [];
  return Array.from(
    new Set(
      keys
        .map((item) => String(item || "").trim())
        .filter((item): item is CapabilityGroupKey => CAPABILITY_GROUPS.some((group) => group.key === item)),
    ),
  );
}

export function buildPermissionCodesFromCapabilityGroups(capabilityGroups: string[]) {
  const codes = new Set<string>();
  for (const key of normalizeCapabilityGroups(capabilityGroups)) {
    const group = getCapabilityGroup(key);
    for (const code of group?.permissionCodes || []) {
      codes.add(code);
    }
  }
  return Array.from(codes);
}

export function inferPrimaryRole(role: { code?: string | null; name?: string | null; primary_role?: string | null }) {
  if (role.primary_role) return role.primary_role;
  const code = String(role.code || "").toLowerCase();
  const name = String(role.name || "").toLowerCase();

  if (code.includes("hq") || name.includes("hq")) return "hq";
  if (code.includes("office") || name.includes("office")) return "office_manager";
  if (code.includes("ops") || name.includes("ops")) return "ops";
  if (code.includes("scanner") || name.includes("scanner")) return "scanner";
  if (code.includes("host") || name.includes("host")) return "host";
  return "admin";
}

export function inferCapabilityGroupsFromPermissionCodes(permissionCodes: string[]) {
  const codeSet = new Set(permissionCodes);
  return CAPABILITY_GROUPS.filter((group) => group.permissionCodes.some((code) => codeSet.has(code))).map((group) => group.key);
}

export function normalizeScopeValues(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const entries = Object.entries(value as Record<string, unknown>).map(([key, rawValue]) => {
    if (Array.isArray(rawValue)) {
      return [
        key,
        Array.from(new Set(rawValue.map((item) => String(item || "").trim()).filter(Boolean))),
      ];
    }
    const normalized = String(rawValue || "").trim();
    return [key, normalized ? [normalized] : []];
  });

  return Object.fromEntries(entries);
}

export function summarizeScope(scopeType: string | null | undefined, scopeValues: Record<string, string[]>) {
  const values = Object.values(scopeValues).flat().filter(Boolean);
  if (!scopeType) return "No scope selected";
  if (!values.length) return scopeType === "global" ? "Global access" : `${scopeType} scope`;
  return `${scopeType}: ${values.join(", ")}`;
}

export function summarizeCapabilityGroups(capabilityGroups: string[]) {
  const groups = normalizeCapabilityGroups(capabilityGroups).map((key) => getCapabilityGroup(key)?.label || key);
  return groups.length ? groups.join(", ") : "No capability groups selected";
}
