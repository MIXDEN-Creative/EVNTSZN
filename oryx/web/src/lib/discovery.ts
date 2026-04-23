import { isMidnightRunEvent } from "@/lib/events-runtime";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { supabasePublicServer } from "@/lib/supabase-public-server";
import { isSupabaseCredentialError } from "@/lib/runtime-env";

export type DiscoverySourceType = "evntszn" | "host" | "independent_organizer";
export type DiscoverySurfaceSource = DiscoverySourceType | "ticketmaster" | "eventbrite";
export type DiscoveryCityMaturityState = "strong" | "growing" | "imported_fallback";
export type DiscoveryCitySourceMix = Partial<Record<DiscoverySurfaceSource, number>>;
export type DiscoveryCityPolicyProfile = {
  state: DiscoveryCityMaturityState;
  label: string;
  explanation: string;
  nativeBoost: number;
  curatorBoost: number;
  partnerBoost: number;
  importedPenalty: number;
  homepageBehavior: string;
  searchBehavior: string;
  momentumBehavior: string;
  automationStatus: DiscoveryCityAutomationStatus;
  automationIntelligence: DiscoveryCityAutomationIntelligence;
};

export type DiscoveryNativeEvent = {
  id: string;
  source: DiscoverySourceType;
  title: string;
  description: string;
  href: string;
  imageUrl: string | null;
  subtitle: string | null;
  startAt: string | null;
  heroNote: string | null;
  sourceLabel: string;
  badgeLabel: string;
  featured: boolean;
  listingPriority: number;
  promoCollection: string | null;
  city: string;
  state: string;
  isPrimary: true;
};

type DiscoveryEventRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  subtitle: string | null;
  hero_note: string | null;
  banner_image_url: string | null;
  start_at: string | null;
  city: string | null;
  state: string | null;
  event_class: string | null;
  visibility: string | null;
  status: string | null;
};

type DiscoveryEventRecord = DiscoveryNativeEvent | null;

const DISCOVERY_FALLBACK_IMAGES = {
  evntszn: {
    default:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=80",
    baltimore:
      "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1600&q=80",
    washington:
      "https://images.unsplash.com/photo-1617581629397-a72507c3de9e?auto=format&fit=crop&w=1600&q=80",
    rehobothbeach:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
    oceancity:
      "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1600&q=80",
    bethanybeach:
      "https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?auto=format&fit=crop&w=1600&q=80",
  },
  host: {
    default:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&q=80",
    baltimore:
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1600&q=80",
    washington:
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1600&q=80",
    rehobothbeach:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=80",
    oceancity:
      "https://images.unsplash.com/photo-1518972559570-7cc1309f3229?auto=format&fit=crop&w=1600&q=80",
    bethanybeach:
      "https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=1600&q=80",
  },
  independent_organizer: {
    default:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80",
    baltimore:
      "https://images.unsplash.com/photo-1521334884684-d80222895322?auto=format&fit=crop&w=1600&q=80",
    washington:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1600&q=80",
    rehobothbeach:
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1600&q=80",
    oceancity:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80",
    bethanybeach:
      "https://images.unsplash.com/photo-1493558103817-58b2924bce98?auto=format&fit=crop&w=1600&q=80",
  },
} satisfies Record<DiscoverySourceType, Record<string, string>>;

const SOURCE_PRIORITY: Record<DiscoverySurfaceSource, number> = {
  evntszn: 0,
  host: 1,
  independent_organizer: 2,
  ticketmaster: 3,
  eventbrite: 4,
};

const CITY_DISCOVERY_MATURITY: Record<string, number> = {
  baltimore: 0.92,
  washington: 0.88,
  atlanta: 0.8,
  miami: 0.82,
  newyork: 0.9,
  newyorkcity: 0.9,
  losangeles: 0.84,
  rehobothbeach: 0.46,
  oceancity: 0.5,
  bethanybeach: 0.42,
  default: 0.32,
};

export function normalizeDiscoveryCityKey(city: string | null | undefined) {
  return String(city || "").toLowerCase().replace(/[^a-z]/g, "") || "default";
}

function normalizeSource(eventClass: string | null | undefined): DiscoverySourceType {
  if (eventClass === "independent_organizer") return "independent_organizer";
  if (eventClass === "host") return "host";
  return "evntszn";
}

function getSourceLabel(source: DiscoverySourceType) {
  switch (source) {
    case "host":
      return "Curator Network";
    case "independent_organizer":
      return "Partner";
    default:
      return "EVNTSZN Native";
  }
}

function getBadgeLabel(source: DiscoverySourceType) {
  switch (source) {
    case "host":
      return "Curator";
    case "independent_organizer":
      return "Partner";
    default:
      return "EVNTSZN";
  }
}

function isMissingDiscoveryControlsError(error: unknown) {
  const code = typeof error === "object" && error !== null && "code" in error ? String((error as { code?: unknown }).code) : "";
  const status = typeof error === "object" && error !== null && "status" in error ? String((error as { status?: unknown }).status) : "";
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message?: unknown }).message)
      : "";

  return (
    code === "42P01" ||
    code === "PGRST205" ||
    status === "404" ||
    /discovery_listing_controls/i.test(message)
  );
}

export function groupDiscoveryEventsBySource(events: DiscoveryNativeEvent[]) {
  return {
    evntszn: events.filter((event) => event.source === "evntszn"),
    host: events.filter((event) => event.source === "host"),
    independent_organizer: events.filter((event) => event.source === "independent_organizer"),
  };
}

export function getDiscoveryFallbackImage(city: string | null | undefined, source: DiscoverySourceType) {
  const cityKey = normalizeDiscoveryCityKey(city);
  const sourceImages = DISCOVERY_FALLBACK_IMAGES[source];
  return sourceImages[cityKey as keyof typeof sourceImages] || sourceImages.default;
}

export function getDiscoverySourcePriority(source: DiscoverySurfaceSource) {
  return SOURCE_PRIORITY[source] ?? 5;
}

export function getDiscoveryCityMaturity(city: string | null | undefined, sourceMix?: Partial<Record<DiscoverySurfaceSource, number>>) {
  const cityKey = normalizeDiscoveryCityKey(city);
  const base = CITY_DISCOVERY_MATURITY[cityKey] ?? CITY_DISCOVERY_MATURITY.default;
  if (!sourceMix) return base;

  const nativeCount = Number(sourceMix.evntszn || 0) + Number(sourceMix.host || 0) + Number(sourceMix.independent_organizer || 0);
  const importedCount = Number(sourceMix.ticketmaster || 0) + Number(sourceMix.eventbrite || 0);
  const total = nativeCount + importedCount;
  if (!total) return base;

  const firstPartyShare = nativeCount / total;
  const importedShare = importedCount / total;
  return Math.max(0.15, Math.min(0.98, base + firstPartyShare * 0.16 - importedShare * 0.06));
}

export function getDiscoverySourceMixTotals(sourceMix: DiscoveryCitySourceMix = {}) {
  const nativeCount = Number(sourceMix.evntszn || 0);
  const curatorCount = Number(sourceMix.host || 0);
  const partnerCount = Number(sourceMix.independent_organizer || 0);
  const importedCount = Number(sourceMix.ticketmaster || 0) + Number(sourceMix.eventbrite || 0);
  const totalCount = nativeCount + curatorCount + partnerCount + importedCount;
  return {
    nativeCount,
    curatorCount,
    partnerCount,
    importedCount,
    totalCount,
    firstPartyCount: nativeCount + curatorCount + partnerCount,
  };
}

export type DiscoveryCityPromotionStatus =
  | "stable"
  | "promotion_ready"
  | "hold"
  | "declining"
  | "fallback_needed";

export type DiscoveryCityPromotionEvaluation = {
  status: DiscoveryCityPromotionStatus;
  nextLevel: DiscoveryCityMaturityState | null;
  missingSignals: string[];
  promotionReason: string;
  isEligibleForPromotion: boolean;
};

export type DiscoveryCityAutomationStatus = "monitoring" | "accelerating" | "recovering" | "intervening";

export type DiscoveryCityOpsFlag =
  | "growth_ready"
  | "needs_curator_supply"
  | "needs_partner_supply"
  | "needs_native_inventory"
  | "needs_momentum"
  | "watch_decline"
  | "fallback_support_mode"
  | "ready_for_manual_review";

export type DiscoveryCityAutomationPolicy = {
  status: DiscoveryCityAutomationStatus;
  label: string;
  reason: string;
  confidence: number;
  reviewWindowDays: number;
  nativeWeightAdjustment: number;
  importedToleranceAdjustment: number;
  opsFlags: DiscoveryCityOpsFlag[];
  actionPlan: string[];
};

export type DiscoveryCityAutomationIntelligence = {
  policy: DiscoveryCityAutomationPolicy;
  isOverridden: boolean;
  overrideReason?: string;
  forcedPolicyStatus?: DiscoveryCityAutomationStatus | null;
  forcedMaturityState?: DiscoveryCityMaturityState | null;
  suppressPromotion?: boolean;
  lastEvaluatedAt?: string | null;
  nextEvaluationAt: string;
};

export type DiscoveryCityAutomationOverride = {
  city_key: string;
  forced_policy_status: DiscoveryCityAutomationStatus | null;
  forced_maturity_state: DiscoveryCityMaturityState | null;
  suppress_promotion: boolean;
  override_reason: string | null;
};

export function getDiscoveryCityAutomationPolicy(input: {
  promotion: DiscoveryCityPromotionEvaluation;
  trendDirection: "up" | "down" | "flat";
  maturityScore: number;
}): DiscoveryCityAutomationPolicy {
  const { status, missingSignals } = input.promotion;

  if (status === "promotion_ready") {
    return {
      status: "accelerating",
      label: "Growth Acceleration",
      reason: "City has reached promotion readiness. Increasing native exposure to build market recognition.",
      confidence: 0.88,
      reviewWindowDays: 7,
      nativeWeightAdjustment: -0.12, // Modest boost
      importedToleranceAdjustment: 0.05, // Slightly less tolerance for imported dominating top slots
      opsFlags: ["growth_ready", "ready_for_manual_review"],
      actionPlan: ["Increase native/curator exposure", "Mark for official promotion review"],
    };
  }

  if (status === "fallback_needed" || status === "declining") {
    return {
      status: "recovering",
      label: "Fallback Support",
      reason: "Native momentum has weakened. Prioritizing usefulness via imported fallback while market stabilizes.",
      confidence: 0.92,
      reviewWindowDays: 14,
      nativeWeightAdjustment: 0.15, // Reduce native forcing
      importedToleranceAdjustment: -0.2, // Higher tolerance for imported inventory
      opsFlags: ["fallback_support_mode", "watch_decline", "needs_native_inventory"],
      actionPlan: ["Reduce native forcing", "Increase imported density tolerance", "Investigate supply drop"],
    };
  }

  if (status === "hold") {
    const flags: DiscoveryCityOpsFlag[] = [];
    if (missingSignals.includes("total inventory < 5") || missingSignals.includes("total inventory < 10")) flags.push("needs_native_inventory");
    if (missingSignals.includes("first-party supply volume or momentum too low")) flags.push("needs_momentum");
    
    return {
      status: "monitoring",
      label: "Strategic Hold",
      reason: "City is in a transitional state but missing key signals for the next level.",
      confidence: 0.75,
      reviewWindowDays: 10,
      nativeWeightAdjustment: 0,
      importedToleranceAdjustment: 0,
      opsFlags: flags.length ? flags : ["ready_for_manual_review"],
      actionPlan: ["Maintain current policy", "Monitor for missing signals: " + missingSignals.join(", ")],
    };
  }

  return {
    status: "monitoring",
    label: "Stable Monitoring",
    reason: "City is maintaining its current maturity state with stable signals.",
    confidence: 0.95,
    reviewWindowDays: 30,
    nativeWeightAdjustment: 0,
    importedToleranceAdjustment: 0,
    opsFlags: [],
    actionPlan: ["Continue standard discovery operations"],
  };
}

export function evaluateDiscoveryCityAutomation(input: {
  city: string;
  promotion: DiscoveryCityPromotionEvaluation;
  trendDirection: "up" | "down" | "flat";
  maturityScore: number;
  override?: DiscoveryCityAutomationOverride | null;
}): DiscoveryCityAutomationIntelligence {
  const basePolicy = getDiscoveryCityAutomationPolicy(input);
  const isOverridden = !!input.override && (!!input.override.forced_policy_status || input.override.suppress_promotion);
  
  let effectivePolicy = { ...basePolicy };
  
  if (input.override) {
    if (input.override.forced_policy_status) {
      // If we force a status, we pick the "Stable" version of that status as the base
      const forcedInput = { 
        ...input, 
        promotion: { 
          ...input.promotion, 
          status: input.override.forced_policy_status === "accelerating" ? "promotion_ready" as const : 
                  input.override.forced_policy_status === "recovering" ? "fallback_needed" as const : 
                  "stable" as const
        } 
      };
      effectivePolicy = getDiscoveryCityAutomationPolicy(forcedInput);
      effectivePolicy.label = `Forced: ${effectivePolicy.label}`;
      effectivePolicy.reason = `[Manual Override] ${input.override.override_reason || effectivePolicy.reason}`;
    }
    
    if (input.override.suppress_promotion) {
      effectivePolicy.nativeWeightAdjustment = Math.max(0, effectivePolicy.nativeWeightAdjustment);
      effectivePolicy.label += " (Promotion Suppressed)";
      effectivePolicy.opsFlags.push("ready_for_manual_review");
    }
  }

  const nextEval = new Date();
  nextEval.setDate(nextEval.getDate() + effectivePolicy.reviewWindowDays);

  return {
    policy: effectivePolicy,
    isOverridden,
    overrideReason: input.override?.override_reason || undefined,
    forcedPolicyStatus: input.override?.forced_policy_status || null,
    forcedMaturityState: input.override?.forced_maturity_state || null,
    suppressPromotion: Boolean(input.override?.suppress_promotion),
    lastEvaluatedAt: null,
    nextEvaluationAt: nextEval.toISOString(),
  };
}

export function classifyDiscoveryCityMaturity(input: {
  city?: string | null;
  sourceMix?: DiscoveryCitySourceMix;
  trendDirection?: "up" | "down" | "flat";
  topSlotMix?: DiscoveryCitySourceMix;
  momentumSourceMix?: Partial<Record<"evntszn_native" | "curator_network" | "partner" | "imported", number>>;
}) {
  const sourceMix = input.sourceMix || {};
  const totals = getDiscoverySourceMixTotals(sourceMix);
  const maturityScore = getDiscoveryCityMaturity(input.city, sourceMix);
  const topSlotTotals = getDiscoverySourceMixTotals({
    evntszn: Number(input.topSlotMix?.evntszn || 0),
    host: Number(input.topSlotMix?.host || 0),
    independent_organizer: Number(input.topSlotMix?.independent_organizer || 0),
    ticketmaster: Number(input.topSlotMix?.ticketmaster || 0),
    eventbrite: Number(input.topSlotMix?.eventbrite || 0),
  });
  const momentumFirstPartyCount =
    Number(input.momentumSourceMix?.evntszn_native || 0) +
    Number(input.momentumSourceMix?.curator_network || 0) +
    Number(input.momentumSourceMix?.partner || 0);
  const momentumTotalCount = momentumFirstPartyCount + Number(input.momentumSourceMix?.imported || 0);
  const firstPartyShare = totals.totalCount ? totals.firstPartyCount / totals.totalCount : 0;
  const nativeShare = totals.totalCount ? totals.nativeCount / totals.totalCount : 0;
  const importedShare = totals.totalCount ? totals.importedCount / totals.totalCount : 1;
  const topSlotFirstPartyShare = topSlotTotals.totalCount ? topSlotTotals.firstPartyCount / topSlotTotals.totalCount : firstPartyShare;
  const momentumFirstPartyShare = momentumTotalCount ? momentumFirstPartyCount / momentumTotalCount : 0;

  const isStrong =
    totals.totalCount >= 10 &&
    maturityScore >= 0.72 &&
    (firstPartyShare >= 0.48 || nativeShare >= 0.26) &&
    (topSlotFirstPartyShare >= 0.58 || momentumFirstPartyShare >= 0.34);

  if (isStrong) {
    return {
      state: "strong" as const,
      maturityScore,
      reason: "First-party supply is strong enough that EVNTSZN can lead discovery more aggressively without losing usefulness.",
      metrics: {
        firstPartyShare,
        importedShare,
        topSlotFirstPartyShare,
        momentumFirstPartyShare,
      },
    };
  }

  const isGrowing =
    totals.totalCount >= 5 &&
    (maturityScore >= 0.5 || firstPartyShare >= 0.2 || topSlotFirstPartyShare >= 0.32 || momentumFirstPartyShare >= 0.18 || input.trendDirection === "up");

  if (isGrowing) {
    return {
      state: "growing" as const,
      maturityScore,
      reason: "The market has enough EVNTSZN-owned or semi-native supply to warrant meaningful lift while imported fallback still carries coverage.",
      metrics: {
        firstPartyShare,
        importedShare,
        topSlotFirstPartyShare,
        momentumFirstPartyShare,
      },
    };
  }

  return {
    state: "imported_fallback" as const,
    maturityScore,
    reason: "Imported inventory still needs to carry discovery quality while EVNTSZN-native supply grows into the market.",
    metrics: {
      firstPartyShare,
      importedShare,
      topSlotFirstPartyShare,
      momentumFirstPartyShare,
    },
  };
}

export function evaluateDiscoveryCityPromotion(input: {
  city?: string | null;
  currentState: DiscoveryCityMaturityState;
  sourceMix?: DiscoveryCitySourceMix;
  trendDirection?: "up" | "down" | "flat";
  topSlotMix?: DiscoveryCitySourceMix;
  momentumSourceMix?: Partial<Record<"evntszn_native" | "curator_network" | "partner" | "imported", number>>;
}): DiscoveryCityPromotionEvaluation {
  const sourceMix = input.sourceMix || {};
  const totals = getDiscoverySourceMixTotals(sourceMix);
  const maturityScore = getDiscoveryCityMaturity(input.city, sourceMix);
  const topSlotTotals = getDiscoverySourceMixTotals({
    evntszn: Number(input.topSlotMix?.evntszn || 0),
    host: Number(input.topSlotMix?.host || 0),
    independent_organizer: Number(input.topSlotMix?.independent_organizer || 0),
    ticketmaster: Number(input.topSlotMix?.ticketmaster || 0),
    eventbrite: Number(input.topSlotMix?.eventbrite || 0),
  });
  const momentumFirstPartyCount =
    Number(input.momentumSourceMix?.evntszn_native || 0) +
    Number(input.momentumSourceMix?.curator_network || 0) +
    Number(input.momentumSourceMix?.partner || 0);
  const momentumTotalCount = momentumFirstPartyCount + Number(input.momentumSourceMix?.imported || 0);
  const firstPartyShare = totals.totalCount ? totals.firstPartyCount / totals.totalCount : 0;
  const nativeShare = totals.totalCount ? totals.nativeCount / totals.totalCount : 0;
  const topSlotFirstPartyShare = topSlotTotals.totalCount ? topSlotTotals.firstPartyCount / topSlotTotals.totalCount : firstPartyShare;
  const momentumFirstPartyShare = momentumTotalCount ? momentumFirstPartyCount / momentumTotalCount : 0;

  const missingSignals: string[] = [];

  if (input.currentState === "imported_fallback") {
    if (totals.totalCount < 5) missingSignals.push("total inventory < 5");
    if (maturityScore < 0.5 && firstPartyShare < 0.2 && topSlotFirstPartyShare < 0.32 && momentumFirstPartyShare < 0.18 && input.trendDirection !== "up") {
      missingSignals.push("first-party supply volume or momentum too low");
    }

    const isEligible = missingSignals.length === 0;
    return {
      status: isEligible ? "promotion_ready" : missingSignals.length === 1 ? "hold" : "stable",
      nextLevel: "growing",
      missingSignals,
      isEligibleForPromotion: isEligible,
      promotionReason: isEligible 
        ? "City has reached minimum native supply and momentum for growing mode." 
        : "City still requires more first-party inventory or momentum to transition out of fallback.",
    };
  }

  if (input.currentState === "growing") {
    if (totals.totalCount < 10) missingSignals.push("total inventory < 10");
    if (maturityScore < 0.72) missingSignals.push("maturity score < 0.72");
    if (firstPartyShare < 0.48 && nativeShare < 0.26) missingSignals.push("first-party share < 48% or native share < 26%");
    if (topSlotFirstPartyShare < 0.58 && momentumFirstPartyShare < 0.34) missingSignals.push("top-slot or momentum first-party share too low");

    const isEligible = missingSignals.length === 0;
    
    // Check for demotion
    if (totals.totalCount < 3 || (firstPartyShare < 0.1 && topSlotFirstPartyShare < 0.15 && input.trendDirection === "down")) {
      return {
        status: "fallback_needed",
        nextLevel: null,
        missingSignals: ["momentum lost", "supply declined"],
        isEligibleForPromotion: false,
        promotionReason: "City has lost significant native momentum and should return to imported fallback.",
      };
    }

    return {
      status: isEligible ? "promotion_ready" : missingSignals.length <= 1 ? "hold" : "stable",
      nextLevel: "strong",
      missingSignals,
      isEligibleForPromotion: isEligible,
      promotionReason: isEligible 
        ? "City is consistently showing strong first-party leadership across inventory and momentum." 
        : "City is growing but needs higher native density to reach strong status.",
    };
  }

  // Strong state - check for decline
  if (totals.totalCount < 8 || (firstPartyShare < 0.35 && topSlotFirstPartyShare < 0.4)) {
    return {
      status: "declining",
      nextLevel: null,
      missingSignals: ["first-party share declining"],
      isEligibleForPromotion: false,
      promotionReason: "City supply mix has weakened; monitor for potential fallback.",
    };
  }

  return {
    status: "stable",
    nextLevel: null,
    missingSignals: [],
    isEligibleForPromotion: false,
    promotionReason: "City is maintaining strong market maturity with high native leadership.",
  };
}

export function getDiscoveryCityPolicyProfile(input: {
  city?: string | null;
  sourceMix?: DiscoveryCitySourceMix;
  trendDirection?: "up" | "down" | "flat";
  topSlotMix?: DiscoveryCitySourceMix;
  momentumSourceMix?: Partial<Record<"evntszn_native" | "curator_network" | "partner" | "imported", number>>;
  override?: DiscoveryCityAutomationOverride | null;
}): DiscoveryCityPolicyProfile {
  const classification = classifyDiscoveryCityMaturity(input);
  const effectiveMaturityState = input.override?.forced_maturity_state || classification.state;
  const promotion = evaluateDiscoveryCityPromotion({
    city: input.city,
    currentState: effectiveMaturityState,
    sourceMix: input.sourceMix,
    trendDirection: input.trendDirection,
    topSlotMix: input.topSlotMix,
    momentumSourceMix: input.momentumSourceMix,
  });

  const automation = evaluateDiscoveryCityAutomation({
    city: input.city || "default",
    promotion,
    trendDirection: input.trendDirection || "flat",
    maturityScore: classification.maturityScore,
    override: input.override,
  });

  const { nativeWeightAdjustment, importedToleranceAdjustment } = automation.policy;

  const baseProfile = (() => {
    switch (effectiveMaturityState) {
      case "strong":
        return {
          state: "strong" as const,
          label: "Strong",
          explanation: "This city is in strong mode, so native and curator supply receive stronger lift while imported inventory stays available as fallback.",
          nativeBoost: -0.72,
          curatorBoost: -0.56,
          partnerBoost: -0.34,
          importedPenalty: 0.16,
          homepageBehavior: "Homepage and featured modules skew more first-party when valid options exist.",
          searchBehavior: "Search gives stronger EVNTSZN-owned lift before falling back to imported inventory.",
          momentumBehavior: "Momentum can lean more heavily on native and semi-native supply.",
        };
      case "growing":
        return {
          state: "growing" as const,
          label: "Growing",
          explanation: "This city is in growing mode, so imported fallback remains strong while first-party supply is elevated enough to build recognition.",
          nativeBoost: -0.42,
          curatorBoost: -0.3,
          partnerBoost: -0.18,
          importedPenalty: 0.06,
          homepageBehavior: "Homepage balances EVNTSZN-owned inventory with imported fallback.",
          searchBehavior: "Search lifts native supply meaningfully but keeps imported fallback close.",
          momentumBehavior: "Momentum stays mixed so the market feels transitional, not empty.",
        };
      default:
        return {
          state: "imported_fallback" as const,
          label: "Imported Fallback",
          explanation: "This city is in imported fallback mode, so discovery usefulness is prioritized over aggressive first-party lift.",
          nativeBoost: -0.16,
          curatorBoost: -0.1,
          partnerBoost: -0.04,
          importedPenalty: 0,
          homepageBehavior: "Homepage keeps imported inventory carrying the lane while leaving room for EVNTSZN ecosystem prompts.",
          searchBehavior: "Search stays usefulness-first and does not overforce native inventory.",
          momentumBehavior: "Momentum should read as active without pretending the city is already EVNTSZN-owned.",
        };
    }
  })();

  return {
    ...baseProfile,
    nativeBoost: baseProfile.nativeBoost + nativeWeightAdjustment,
    curatorBoost: baseProfile.curatorBoost + nativeWeightAdjustment,
    partnerBoost: baseProfile.partnerBoost + nativeWeightAdjustment,
    importedPenalty: baseProfile.importedPenalty + importedToleranceAdjustment,
    automationStatus: automation.policy.status,
    automationIntelligence: automation,
  };
}

export function getDiscoveryListingScore<T extends {
  source: DiscoverySurfaceSource;
  city?: string | null;
  featured?: boolean;
  isPrimary?: boolean;
  listingPriority?: number;
  startAt?: string | null;
}>(item: T, sourceMix?: Partial<Record<DiscoverySurfaceSource, number>>, policyOverride?: Pick<DiscoveryCityPolicyProfile, "nativeBoost" | "curatorBoost" | "partnerBoost" | "importedPenalty"> | null) {
  const maturity = getDiscoveryCityMaturity(item.city, sourceMix);
  const policy = policyOverride || getDiscoveryCityPolicyProfile({
    city: item.city,
    sourceMix,
  });
  const sourcePriority = getDiscoverySourcePriority(item.source);
  const maturityBias =
    item.source === "evntszn"
      ? -0.95 * maturity
      : item.source === "host"
        ? -0.7 * maturity
        : item.source === "independent_organizer"
          ? -0.5 * maturity
          : -0.25 * (1 - maturity);
  const policyBias =
    item.source === "evntszn"
      ? policy.nativeBoost
      : item.source === "host"
        ? policy.curatorBoost
        : item.source === "independent_organizer"
          ? policy.partnerBoost
          : policy.importedPenalty;
  const featuredBias = item.featured ? -1.25 : 0;
  const primaryBias = item.isPrimary ? -0.25 : 0;
  const listingPriority = Number.isFinite(item.listingPriority as number) ? Number(item.listingPriority) / 100 : 0;
  return sourcePriority + maturityBias + policyBias + featuredBias + primaryBias + listingPriority;
}

export function rankDiscoveryListings<T extends {
  source: DiscoverySurfaceSource;
  city?: string | null;
  featured?: boolean;
  isPrimary?: boolean;
  listingPriority?: number;
  startAt?: string | null;
}>(items: T[], options?: {
  cityPoliciesByKey?: Map<string, Pick<DiscoveryCityPolicyProfile, "nativeBoost" | "curatorBoost" | "partnerBoost" | "importedPenalty">>;
}) {
  const citySourceMix = new Map<string, Partial<Record<DiscoverySurfaceSource, number>>>();
  for (const item of items) {
    const cityKey = normalizeDiscoveryCityKey(item.city);
    const next = citySourceMix.get(cityKey) || {};
    next[item.source] = Number(next[item.source] || 0) + 1;
    citySourceMix.set(cityKey, next);
  }

  return [...items].sort((a, b) => {
    const cityPolicyA = options?.cityPoliciesByKey?.get(normalizeDiscoveryCityKey(a.city)) || null;
    const cityPolicyB = options?.cityPoliciesByKey?.get(normalizeDiscoveryCityKey(b.city)) || null;
    const scoreA = getDiscoveryListingScore(a, citySourceMix.get(normalizeDiscoveryCityKey(a.city)), cityPolicyA);
    const scoreB = getDiscoveryListingScore(b, citySourceMix.get(normalizeDiscoveryCityKey(b.city)), cityPolicyB);
    if (scoreA !== scoreB) return scoreA - scoreB;

    const featuredDelta = Number(Boolean(b.featured)) - Number(Boolean(a.featured));
    if (featuredDelta !== 0) return featuredDelta;

    const primaryDelta = Number(Boolean(b.isPrimary)) - Number(Boolean(a.isPrimary));
    if (primaryDelta !== 0) return primaryDelta;

    const listingPriorityA = Number.isFinite(a.listingPriority as number) ? Number(a.listingPriority) : Number.MAX_SAFE_INTEGER;
    const listingPriorityB = Number.isFinite(b.listingPriority as number) ? Number(b.listingPriority) : Number.MAX_SAFE_INTEGER;
    if (listingPriorityA !== listingPriorityB) return listingPriorityA - listingPriorityB;

    return String(a.startAt || "").localeCompare(String(b.startAt || ""));
  });
}

export async function getDiscoveryNativeEvents(input: {
  city?: string | null;
  query?: string | null;
  limit?: number | null;
  startAt?: string | undefined;
  endAt?: string | undefined;
}) {
  const limit = Math.min(Math.max(Number(input.limit || 12), 1), 50);
  const effectiveStartAt = input.startAt || new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

  const runEventQuery = async (client: typeof supabaseAdmin) => {
    let query = client
      .from("evntszn_events")
      .select(
        "id, slug, title, description, subtitle, hero_note, banner_image_url, start_at, city, state, event_class, visibility, status",
      )
      .in("visibility", ["published", "public"])
      .in("status", ["published", "live", "scheduled"])
      .order("start_at", { ascending: true })
      .limit(limit * 3);

    if (input.city) {
      query = query.ilike("city", input.city);
    }
    if (input.query) {
      const safeQuery = input.query.replace(/[,%]/g, " ").trim();
      if (safeQuery) {
        query = query.or(
          `title.ilike.%${safeQuery}%,subtitle.ilike.%${safeQuery}%,description.ilike.%${safeQuery}%,hero_note.ilike.%${safeQuery}%`,
        );
      }
    }
    query = query.gte("start_at", effectiveStartAt);
    if (input.endAt) {
      query = query.lte("start_at", input.endAt);
    }
    return query;
  };

  let { data, error } = await runEventQuery(supabaseAdmin);
  if (error && isSupabaseCredentialError(error)) {
    const fallback = await runEventQuery(supabasePublicServer);
    data = fallback.data;
    error = fallback.error;
  }
  if (error) {
    throw new Error(error.message);
  }

  let controlsById = new Map<
    string,
    {
      badge_label: string | null;
      featured: boolean | null;
      listing_priority: number | null;
      promo_collection: string | null;
      is_discoverable: boolean | null;
      source_type: string | null;
    }
  >();

  try {
    const eventIds = (data || []).map((row) => row.id);
    if (eventIds.length) {
      const controlsRes = await supabaseAdmin
        .from("discovery_listing_controls")
        .select("event_id, source_type, badge_label, featured, listing_priority, promo_collection, is_discoverable")
        .in("event_id", eventIds);
      if (controlsRes.error) {
        throw controlsRes.error;
      }
      controlsById = new Map(
        (controlsRes.data || []).map((row) => [
          row.event_id,
          {
            badge_label: row.badge_label,
            featured: row.featured,
            listing_priority: row.listing_priority,
            promo_collection: row.promo_collection,
            is_discoverable: row.is_discoverable,
            source_type: row.source_type,
          },
        ]),
      );
    }
  } catch (error) {
    if (!isMissingDiscoveryControlsError(error)) {
      throw error;
    }
  }

  const mappedEvents: DiscoveryEventRecord[] = ((data || []) as DiscoveryEventRow[])
    .filter((row) => !isMidnightRunEvent(row))
    .map((row) => {
      const controls = controlsById.get(row.id);
      if (controls?.is_discoverable === false) return null;
      const source = normalizeSource(controls?.source_type || row.event_class);
      const listingPriority = Number(controls?.listing_priority ?? SOURCE_PRIORITY[source]);
      return {
        id: row.id,
        source,
        title: row.title,
        description: row.description || "",
        href: `/events/${row.slug}`,
        imageUrl: row.banner_image_url || getDiscoveryFallbackImage(row.city, source),
        subtitle: row.subtitle,
        startAt: row.start_at,
        heroNote: row.hero_note,
        sourceLabel: getSourceLabel(source),
        badgeLabel: controls?.badge_label || getBadgeLabel(source),
        featured: Boolean(controls?.featured),
        listingPriority,
        promoCollection: controls?.promo_collection || null,
        city: row.city || "",
        state: row.state || "",
        isPrimary: true as const,
      };
    });

  const events = rankDiscoveryListings(mappedEvents
    .filter((event): event is DiscoveryNativeEvent => event !== null)
  ).slice(0, limit);

  return {
    events,
    storageReady: true,
  };
}
