import { describePulseScore, slugify } from "@/lib/platform-products";

export const NODE_TYPES = [
  "venue_node",
  "area_node",
  "event_node",
  "crew_node",
  "campaign_node",
  "partner_node",
  "popup_node",
  "ops_node",
] as const;

export const NODE_STATUSES = ["draft", "active", "paused", "archived", "damaged"] as const;
export const NODE_DESTINATION_TYPES = ["event", "venue", "area", "crew_marketplace", "crew_profile", "link_page", "custom_url", "ops"] as const;
export const NODE_PULSE_MODES = ["inherit", "event", "venue", "area", "crew", "off"] as const;

export type NodeType = (typeof NODE_TYPES)[number];
export type NodeStatus = (typeof NODE_STATUSES)[number];
export type NodeDestinationType = (typeof NODE_DESTINATION_TYPES)[number];
export type NodePulseMode = (typeof NODE_PULSE_MODES)[number];

export function normalizeNodeType(value: unknown): NodeType {
  const raw = String(value || "").trim().toLowerCase();
  if ((NODE_TYPES as readonly string[]).includes(raw)) {
    return raw as NodeType;
  }
  return "event_node";
}

export function normalizeNodeStatus(value: unknown): NodeStatus {
  const raw = String(value || "").trim().toLowerCase();
  if ((NODE_STATUSES as readonly string[]).includes(raw)) {
    return raw as NodeStatus;
  }
  return "draft";
}

export function normalizeNodeDestinationType(value: unknown): NodeDestinationType {
  const raw = String(value || "").trim().toLowerCase();
  if ((NODE_DESTINATION_TYPES as readonly string[]).includes(raw)) {
    return raw as NodeDestinationType;
  }
  return "event";
}

export function normalizeNodePulseMode(value: unknown): NodePulseMode {
  const raw = String(value || "").trim().toLowerCase();
  if ((NODE_PULSE_MODES as readonly string[]).includes(raw)) {
    return raw as NodePulseMode;
  }
  return "inherit";
}

export function buildNodeSlug(value: string, fallback = "node") {
  return slugify(value) || fallback;
}

export function buildNodePublicIdentifier(slug: string) {
  return `NODE-${slug.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

export function getNodeTypeLabel(type: NodeType) {
  switch (type) {
    case "venue_node":
      return "Venue node";
    case "area_node":
      return "Area node";
    case "event_node":
      return "Event node";
    case "crew_node":
      return "Crew node";
    case "campaign_node":
      return "Campaign node";
    case "partner_node":
      return "Partner node";
    case "popup_node":
      return "Pop-up node";
    case "ops_node":
      return "Ops node";
  }
}

export function getNodeStatusTone(status: NodeStatus) {
  switch (status) {
    case "active":
      return "border-emerald-400/25 bg-emerald-500/12 text-emerald-100";
    case "paused":
      return "border-amber-400/25 bg-amber-500/12 text-amber-100";
    case "damaged":
      return "border-red-400/25 bg-red-500/12 text-red-100";
    case "archived":
      return "border-white/10 bg-white/5 text-white/60";
    case "draft":
    default:
      return "border-[#A259FF]/25 bg-[#A259FF]/12 text-[#eadcff]";
  }
}

export function buildNodeActivityScore(input: {
  basePulseScore?: number | null;
  views: number;
  taps: number;
  reactions: number;
}) {
  const views = Number(input.views || 0);
  const taps = Number(input.taps || 0);
  const reactions = Number(input.reactions || 0);
  const basePulseScore = Number(input.basePulseScore || 0) || null;

  const weightedLift = Math.min(1.6, taps * 0.08 + reactions * 0.18 + views * 0.025);
  const score = basePulseScore
    ? Math.min(10, Math.round((basePulseScore + weightedLift) * 10) / 10)
    : views || taps || reactions
      ? Math.min(10, Math.round((4 + taps * 0.14 + reactions * 0.24 + views * 0.03) * 10) / 10)
      : null;

  const described = describePulseScore(score);

  return {
    score,
    label: described.label,
    summary: described.summary,
    tone: described.tone,
  };
}
