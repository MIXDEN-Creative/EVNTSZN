export const CREW_CATEGORIES = [
  "host",
  "dj",
  "photographer",
  "videographer",
  "security",
  "promoter",
  "producer",
  "brand_ambassador",
  "custom",
] as const;

export const CREW_AVAILABILITY_STATES = ["available", "limited", "unavailable"] as const;
export const CREW_BOOKING_STATUSES = ["requested", "reviewing", "accepted", "declined", "completed", "canceled"] as const;

export type CrewCategory = (typeof CREW_CATEGORIES)[number];
export type CrewAvailabilityState = (typeof CREW_AVAILABILITY_STATES)[number];
export type CrewBookingStatus = (typeof CREW_BOOKING_STATUSES)[number];
export const LINK_PLANS = ["free", "starter", "pro", "elite"] as const;
export type LinkPlan = (typeof LINK_PLANS)[number];

export function normalizeLinkPlan(value: unknown): LinkPlan {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "elite" || raw === "premium") return "elite";
  if (raw === "pro") return "pro";
  if (raw === "starter") return "starter";
  return "free";
}

export const LINK_PLAN_CONFIG: Record<
  LinkPlan,
  {
    label: string;
    priceLabel: string;
    maxActiveEvents: number;
    brandingEnforced: boolean;
    leadCapture: boolean;
    funnelPages: boolean;
    advancedAnalytics: boolean;
    priorityPlacement: boolean;
    advancedTools: boolean;
  }
> = {
  free: {
    label: "Free",
    priceLabel: "$0",
    maxActiveEvents: 1,
    brandingEnforced: true,
    leadCapture: false,
    funnelPages: false,
    advancedAnalytics: false,
    priorityPlacement: false,
    advancedTools: false,
  },
  starter: {
    label: "Starter",
    priceLabel: "$7/mo",
    maxActiveEvents: 12,
    brandingEnforced: false,
    leadCapture: false,
    funnelPages: false,
    advancedAnalytics: false,
    priorityPlacement: false,
    advancedTools: false,
  },
  pro: {
    label: "Pro",
    priceLabel: "$15/mo",
    maxActiveEvents: 12,
    brandingEnforced: false,
    leadCapture: true,
    funnelPages: true,
    advancedAnalytics: true,
    priorityPlacement: false,
    advancedTools: false,
  },
  elite: {
    label: "Elite",
    priceLabel: "$29/mo",
    maxActiveEvents: 12,
    brandingEnforced: false,
    leadCapture: true,
    funnelPages: true,
    advancedAnalytics: true,
    priorityPlacement: true,
    advancedTools: true,
  },
};

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function safeJsonArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry || "").trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split("\n")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [];
}

export function describePulseScore(score: number | null | undefined) {
  const value = Number(score || 0);
  if (!value) {
    return {
      score: null,
      label: "No pulse yet",
      tone: "empty" as const,
      summary: "Be the first one to rate the room.",
    };
  }
  if (value < 5) {
    return { score: value, label: "Low energy", tone: "low" as const, summary: "Quiet and still building." };
  }
  if (value < 7) {
    return { score: value, label: "Steady", tone: "warming" as const, summary: "The room is moving, but it has not fully broken open yet." };
  }
  if (value < 9) {
    return { score: value, label: "Active", tone: "active" as const, summary: "Solid movement, healthy bar traffic, and good energy." };
  }
  return { score: value, label: "Packed & Active", tone: "peak" as const, summary: "The room is full, moving, and peaking right now." };
}

export function averagePulseVote(input: {
  energyLevel: number;
  crowdDensity: number;
  musicVibe: number;
  barActivity: number;
}) {
  const total = Number(input.energyLevel || 0)
    + Number(input.crowdDensity || 0)
    + Number(input.musicVibe || 0)
    + Number(input.barActivity || 0);

  return Math.round((total / 4) * 10) / 10;
}
