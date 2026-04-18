import { roundUsd } from "@/lib/money";
import { supabaseAdmin } from "@/lib/supabase-admin";

export type VenuePlanKey = "venue_free" | "venue_pro" | "venue_pro_reserve";
export type ReservePlanKey = "reserve_standalone" | "venue_pro_reserve";
export type LinkBillingPlanKey = "link_free" | "link_pro";
export type SponsorBillingPlanKey = "sponsor_pro" | "sponsor_elite";
export type ManagedAccountSourceType =
  | "venue_account"
  | "reserve_account"
  | "partner_account"
  | "curator_account"
  | "sponsor_account"
  | "epl_player_signup";
export type RevenueEventKind =
  | "ticket_sale"
  | "reservation_created"
  | "reservation_completed"
  | "subscription_billed"
  | "player_signup"
  | "crew_request";

type CompensationRule = {
  key: string;
  sourceType: ManagedAccountSourceType;
  eventType: RevenueEventKind;
  amountType: "flat" | "per_quantity" | "percent_gross";
  amount: number;
  capacityMin?: number;
  capacityMax?: number;
  match?: Record<string, string | number | boolean>;
};

type CompensationPlanRow = {
  id: string;
  slug: string;
  label: string;
  is_default: boolean;
  rules_json: CompensationRule[] | null;
};

type AttributionRow = {
  id: string;
  source_type: ManagedAccountSourceType;
  source_id: string;
  created_by_user_id: string | null;
  assigned_to_user_id: string | null;
  account_owner_user_id: string | null;
  active_status: string;
  attribution_started_at: string;
  attribution_ended_at: string | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
};

type RevenueEventRow = {
  id: string;
  source_type: ManagedAccountSourceType;
  source_id: string;
  event_type: RevenueEventKind;
  gross_amount: number | string;
  net_amount: number | string | null;
  quantity: number | null;
  occurred_at: string;
  metadata: Record<string, unknown> | null;
};

export const SMART_FILL_ADD_ON_PRICE_USD = 29;
export const LINK_PRO_PRICE_USD = 29;

export const VENUE_PLAN_CONFIG: Record<
  VenuePlanKey,
  {
    label: string;
    monthlyPriceUsd: number;
    reserveIncluded: boolean;
    reservationFeeUsd: number | null;
    smartFillIncluded: boolean;
    nodesIncluded: boolean;
    linkPlan: LinkBillingPlanKey;
  }
> = {
  venue_free: {
    label: "Venue Free",
    monthlyPriceUsd: 0,
    reserveIncluded: false,
    reservationFeeUsd: null,
    smartFillIncluded: false,
    nodesIncluded: false,
    linkPlan: "link_free",
  },
  venue_pro: {
    label: "Venue Pro",
    monthlyPriceUsd: 39,
    reserveIncluded: false,
    reservationFeeUsd: null,
    smartFillIncluded: true,
    nodesIncluded: true,
    linkPlan: "link_pro",
  },
  venue_pro_reserve: {
    label: "Venue Pro + Reserve",
    monthlyPriceUsd: 99,
    reserveIncluded: true,
    reservationFeeUsd: 0.3,
    smartFillIncluded: true,
    nodesIncluded: true,
    linkPlan: "link_pro",
  },
};

export function normalizeVenuePlanKey(value: unknown): VenuePlanKey {
  const token = String(value || "").trim().toLowerCase();
  if (token === "venue_pro_reserve" || token === "venue-pro-reserve" || token === "venue_pro_plus_reserve") {
    return "venue_pro_reserve";
  }
  if (token === "venue_pro" || token === "venue-pro") {
    return "venue_pro";
  }
  return "venue_free";
}

export function normalizeReservePlanKey(value: unknown): ReservePlanKey {
  const token = String(value || "").trim().toLowerCase();
  if (token === "venue_pro_reserve" || token === "venue-pro-reserve" || token === "venue_pro_plus_reserve") {
    return "venue_pro_reserve";
  }
  return "reserve_standalone";
}

export function normalizeLinkBillingPlanKey(value: unknown): LinkBillingPlanKey {
  const token = String(value || "").trim().toLowerCase();
  return token === "link_pro" || token === "pro" || token === "starter" || token === "elite" ? "link_pro" : "link_free";
}

export function normalizeSponsorBillingPlanKey(value: unknown): SponsorBillingPlanKey | null {
  const token = String(value || "").trim().toLowerCase();
  if (token === "sponsor_elite" || token === "elite") return "sponsor_elite";
  if (token === "sponsor_pro" || token === "pro") return "sponsor_pro";
  return null;
}

export function deriveReserveStandaloneMonthlyPrice(capacity: number | null | undefined) {
  return Number(capacity || 0) >= 150 ? 79 : 39;
}

export function deriveReserveStandaloneReservationFee() {
  return 0.5;
}

export function deriveReserveUsageCompRate(capacity: number | null | undefined) {
  return Number(capacity || 0) >= 150 ? 0.15 : 0.1;
}

export function deriveReserveRecurringCompRate(capacity: number | null | undefined) {
  return Number(capacity || 0) >= 150 ? 20 : 10;
}

export function getVenueCommerceState(input: {
  venuePlanKey?: unknown;
  reservePlanKey?: unknown;
  capacity?: number | null;
  smartFillAddOnActive?: boolean;
  linkPlanOverride?: unknown;
}) {
  const venuePlanKey = normalizeVenuePlanKey(input.venuePlanKey);
  const reservePlanKey = input.reservePlanKey ? normalizeReservePlanKey(input.reservePlanKey) : null;
  const venuePlan = VENUE_PLAN_CONFIG[venuePlanKey];
  const standaloneMonthlyPriceUsd = reservePlanKey === "reserve_standalone" ? deriveReserveStandaloneMonthlyPrice(input.capacity) : 0;
  const reserveEnabled = venuePlan.reserveIncluded || reservePlanKey === "reserve_standalone";
  const reservationFeeUsd = venuePlan.reserveIncluded
    ? Number(venuePlan.reservationFeeUsd || 0)
    : reservePlanKey === "reserve_standalone"
      ? deriveReserveStandaloneReservationFee()
      : null;
  const smartFillEnabled = venuePlan.smartFillIncluded || Boolean(input.smartFillAddOnActive);
  const linkPlan =
    venuePlan.linkPlan === "link_pro" || normalizeLinkBillingPlanKey(input.linkPlanOverride) === "link_pro"
      ? "link_pro"
      : "link_free";

  return {
    venuePlanKey,
    reservePlanKey,
    venueMonthlyPriceUsd: venuePlan.monthlyPriceUsd,
    reserveMonthlyPriceUsd: standaloneMonthlyPriceUsd,
    totalMonthlyPriceUsd: roundUsd(venuePlan.monthlyPriceUsd + standaloneMonthlyPriceUsd),
    reservationFeeUsd,
    reserveEnabled,
    smartFillEnabled,
    smartFillAddOnActive: venuePlan.smartFillIncluded ? false : Boolean(input.smartFillAddOnActive),
    smartFillAddOnPriceUsd: venuePlan.smartFillIncluded ? 0 : SMART_FILL_ADD_ON_PRICE_USD,
    nodesIncluded: venuePlan.nodesIncluded,
    linkPlan,
    messagingIncluded: venuePlanKey !== "venue_free" && reservePlanKey !== "reserve_standalone",
    venueProFeaturesIncluded: venuePlanKey !== "venue_free",
    waitlistIncluded: reserveEnabled,
    timeSlotsIncluded: reserveEnabled,
    capacityControlIncluded: reserveEnabled,
  };
}

export function calculateCrewMarketplaceFee(input: {
  subtotalUsd: number;
  category: string;
  partnerTier?: "standard" | "partner" | "pro_partner";
}) {
  const subtotalUsd = roundUsd(input.subtotalUsd);
  const normalizedCategory = String(input.category || "").trim().toLowerCase();
  const isCurator = normalizedCategory === "curator" || normalizedCategory === "curators" || normalizedCategory === "host";
  const feePercent = isCurator ? 0 : input.partnerTier === "pro_partner" ? 0 : input.partnerTier === "partner" ? 5 : 10;
  const platformFeeUsd = roundUsd(subtotalUsd * (feePercent / 100));

  return {
    feePercent,
    platformFeeUsd,
    totalUsd: roundUsd(subtotalUsd + platformFeeUsd),
    feeLabel: feePercent === 0 ? "No platform fee" : `${feePercent}% platform fee`,
  };
}

export async function syncManagedAccountAttribution(input: {
  sourceType: ManagedAccountSourceType;
  sourceId: string;
  createdByUserId?: string | null;
  assignedToUserId?: string | null;
  accountOwnerUserId?: string | null;
  activeStatus?: "lead" | "active" | "paused" | "inactive" | "archived";
  attributionStartedAt?: string | null;
  attributionEndedAt?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const payload = {
    source_type: input.sourceType,
    source_id: input.sourceId,
    created_by_user_id: input.createdByUserId || null,
    assigned_to_user_id: input.assignedToUserId || null,
    account_owner_user_id: input.accountOwnerUserId || null,
    active_status: input.activeStatus || "active",
    attribution_started_at: input.attributionStartedAt || new Date().toISOString(),
    attribution_ended_at: input.attributionEndedAt || null,
    notes: input.notes || null,
    metadata: input.metadata || {},
  };

  const { data, error } = await supabaseAdmin
    .from("evntszn_account_attributions")
    .upsert(payload, { onConflict: "source_type,source_id" })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as AttributionRow;
}

function isAttributionActive(attribution: AttributionRow, occurredAt: string) {
  if (attribution.active_status !== "active") return false;
  const startedAt = new Date(attribution.attribution_started_at).getTime();
  const occurredAtMs = new Date(occurredAt).getTime();
  if (Number.isFinite(startedAt) && occurredAtMs < startedAt) return false;
  if (attribution.attribution_ended_at) {
    const endedAt = new Date(attribution.attribution_ended_at).getTime();
    if (Number.isFinite(endedAt) && occurredAtMs > endedAt) return false;
  }
  return true;
}

async function getDefaultCompensationPlan() {
  const { data, error } = await supabaseAdmin
    .from("evntszn_compensation_plans")
    .select("id, slug, label, is_default, rules_json")
    .eq("is_default", true)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as CompensationPlanRow | null) ?? null;
}

async function getCompensationPlansForUsers(userIds: string[], occurredAt: string) {
  if (!userIds.length) return new Map<string, CompensationPlanRow[]>();

  const { data, error } = await supabaseAdmin
    .from("evntszn_compensation_plan_assignments")
    .select("user_id, status, is_primary, effective_starts_at, effective_ends_at, evntszn_compensation_plans!inner(id, slug, label, is_default, rules_json, status)")
    .in("user_id", userIds)
    .eq("status", "active");

  if (error) throw new Error(error.message);

  const planMap = new Map<string, CompensationPlanRow[]>();
  const occurredAtMs = new Date(occurredAt).getTime();

  for (const row of (data || []) as Array<Record<string, unknown>>) {
    const startsAt = new Date(String(row.effective_starts_at || occurredAt)).getTime();
    const endsAt = row.effective_ends_at ? new Date(String(row.effective_ends_at)).getTime() : null;
    if (Number.isFinite(startsAt) && occurredAtMs < startsAt) continue;
    if (endsAt && Number.isFinite(endsAt) && occurredAtMs > endsAt) continue;
    const userId = String(row.user_id || "");
    const plan = row.evntszn_compensation_plans as CompensationPlanRow | CompensationPlanRow[] | null;
    const normalizedPlan = Array.isArray(plan) ? plan[0] || null : plan;
    if (!userId || !normalizedPlan) continue;
    planMap.set(userId, [...(planMap.get(userId) || []), normalizedPlan]);
  }

  const defaultPlan = await getDefaultCompensationPlan();
  if (defaultPlan) {
    for (const userId of userIds) {
      if (!planMap.has(userId) || !planMap.get(userId)?.length) {
        planMap.set(userId, [defaultPlan]);
      }
    }
  }

  return planMap;
}

function metadataMatchesRule(rule: CompensationRule, metadata: Record<string, unknown>) {
  const match = rule.match || {};
  for (const [key, expected] of Object.entries(match)) {
    if (metadata[key] !== expected) {
      return false;
    }
  }
  return true;
}

function ruleMatchesRevenueEvent(rule: CompensationRule, revenueEvent: RevenueEventRow) {
  if (rule.sourceType !== revenueEvent.source_type || rule.eventType !== revenueEvent.event_type) {
    return false;
  }

  const metadata = revenueEvent.metadata || {};
  const capacity = Number(metadata.capacity || 0);

  if (rule.capacityMin !== undefined && capacity < rule.capacityMin) return false;
  if (rule.capacityMax !== undefined && capacity > rule.capacityMax) return false;
  return metadataMatchesRule(rule, metadata);
}

function computeCommissionAmount(rule: CompensationRule, revenueEvent: RevenueEventRow) {
  const grossAmount = roundUsd(revenueEvent.gross_amount);
  const quantity = Math.max(1, Number(revenueEvent.quantity || 1));

  if (rule.amountType === "percent_gross") {
    return roundUsd(grossAmount * (Number(rule.amount || 0) / 100));
  }
  if (rule.amountType === "per_quantity") {
    return roundUsd(quantity * Number(rule.amount || 0));
  }
  return roundUsd(Number(rule.amount || 0));
}

export async function recordRevenueEvent(input: {
  sourceType: ManagedAccountSourceType;
  sourceId: string;
  eventType: RevenueEventKind;
  grossAmount?: number;
  netAmount?: number | null;
  quantity?: number;
  occurredAt?: string;
  externalKey?: string | null;
  metadata?: Record<string, unknown>;
}) {
  if (input.externalKey) {
    const { data: existing, error: existingError } = await supabaseAdmin
      .from("evntszn_revenue_events")
      .select("id, source_type, source_id, event_type, gross_amount, net_amount, quantity, occurred_at, metadata")
      .eq("external_key", input.externalKey)
      .maybeSingle();

    if (existingError) throw new Error(existingError.message);
    if (existing) return existing as RevenueEventRow;
  }

  const { data, error } = await supabaseAdmin
    .from("evntszn_revenue_events")
    .insert({
      source_type: input.sourceType,
      source_id: input.sourceId,
      event_type: input.eventType,
      gross_amount: roundUsd(input.grossAmount || 0),
      net_amount: input.netAmount === undefined ? null : roundUsd(input.netAmount),
      quantity: Math.max(1, Number(input.quantity || 1)),
      occurred_at: input.occurredAt || new Date().toISOString(),
      external_key: input.externalKey || null,
      metadata: input.metadata || {},
    })
    .select("id, source_type, source_id, event_type, gross_amount, net_amount, quantity, occurred_at, metadata")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Could not create revenue event.");
  }

  return data as RevenueEventRow;
}

export async function deriveCommissionEventsForRevenueEvent(revenueEvent: RevenueEventRow) {
  const { data: attributionData, error: attributionError } = await supabaseAdmin
    .from("evntszn_account_attributions")
    .select("id, source_type, source_id, created_by_user_id, assigned_to_user_id, account_owner_user_id, active_status, attribution_started_at, attribution_ended_at, notes, metadata")
    .eq("source_type", revenueEvent.source_type)
    .eq("source_id", revenueEvent.source_id)
    .maybeSingle();

  if (attributionError) throw new Error(attributionError.message);

  const attribution = (attributionData as AttributionRow | null) ?? null;
  if (!attribution || !isAttributionActive(attribution, revenueEvent.occurred_at)) {
    return [];
  }

  const userIds = [
    attribution.created_by_user_id,
    attribution.assigned_to_user_id,
    attribution.account_owner_user_id,
  ].filter((value, index, array): value is string => Boolean(value) && array.indexOf(value) === index);

  if (!userIds.length) return [];

  const planMap = await getCompensationPlansForUsers(userIds, revenueEvent.occurred_at);
  const inserts: Array<Record<string, unknown>> = [];

  for (const userId of userIds) {
    const plans = planMap.get(userId) || [];
    for (const plan of plans) {
      for (const rule of (plan.rules_json || []) as CompensationRule[]) {
        if (!ruleMatchesRevenueEvent(rule, revenueEvent)) continue;
        const amount = computeCommissionAmount(rule, revenueEvent);
        if (amount <= 0) continue;
        inserts.push({
          revenue_event_id: revenueEvent.id,
          user_id: userId,
          compensation_plan_id: plan.id,
          source_type: revenueEvent.source_type,
          source_id: revenueEvent.source_id,
          event_type: revenueEvent.event_type,
          amount,
          status: "pending",
          rule_key: rule.key,
          occurred_at: revenueEvent.occurred_at,
          metadata: {
            planSlug: plan.slug,
            planLabel: plan.label,
            attributionId: attribution.id,
            sourceMetadata: revenueEvent.metadata || {},
          },
        });
      }
    }
  }

  if (!inserts.length) return [];

  const { data, error } = await supabaseAdmin
    .from("evntszn_commission_events")
    .upsert(inserts, {
      onConflict: "user_id,compensation_plan_id,revenue_event_id,rule_key",
      ignoreDuplicates: false,
    })
    .select("*");

  if (error) throw new Error(error.message);
  return data || [];
}

export async function recordRevenueEventAndCommissions(input: {
  sourceType: ManagedAccountSourceType;
  sourceId: string;
  eventType: RevenueEventKind;
  grossAmount?: number;
  netAmount?: number | null;
  quantity?: number;
  occurredAt?: string;
  externalKey?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const revenueEvent = await recordRevenueEvent(input);
  const commissionEvents = await deriveCommissionEventsForRevenueEvent(revenueEvent);
  return { revenueEvent, commissionEvents };
}

export async function getOperatorMonetizationWorkspace(userId: string) {
  const [attributionsRes, commissionEventsRes, revenueEventsRes, planAssignmentsRes] = await Promise.all([
    supabaseAdmin
      .from("evntszn_account_attributions")
      .select("id, source_type, source_id, created_by_user_id, assigned_to_user_id, account_owner_user_id, active_status, attribution_started_at, attribution_ended_at, notes, metadata, updated_at")
      .or(`created_by_user_id.eq.${userId},assigned_to_user_id.eq.${userId},account_owner_user_id.eq.${userId}`)
      .order("updated_at", { ascending: false })
      .limit(200),
    supabaseAdmin
      .from("evntszn_commission_events")
      .select("id, user_id, compensation_plan_id, source_type, source_id, event_type, amount, status, rule_key, metadata, occurred_at")
      .eq("user_id", userId)
      .order("occurred_at", { ascending: false })
      .limit(200),
    supabaseAdmin
      .from("evntszn_revenue_events")
      .select("id, source_type, source_id, event_type, gross_amount, net_amount, quantity, metadata, occurred_at")
      .order("occurred_at", { ascending: false })
      .limit(300),
    supabaseAdmin
      .from("evntszn_compensation_plan_assignments")
      .select("id, status, is_primary, effective_starts_at, effective_ends_at, notes, evntszn_compensation_plans!inner(id, slug, label)")
      .eq("user_id", userId)
      .order("effective_starts_at", { ascending: false }),
  ]);

  if (attributionsRes.error) throw new Error(attributionsRes.error.message);
  if (commissionEventsRes.error) throw new Error(commissionEventsRes.error.message);
  if (revenueEventsRes.error) throw new Error(revenueEventsRes.error.message);
  if (planAssignmentsRes.error) throw new Error(planAssignmentsRes.error.message);

  const attributions = (attributionsRes.data || []) as Array<AttributionRow & { updated_at?: string }>;
  const commissionEvents = (commissionEventsRes.data || []) as Array<Record<string, unknown>>;
  const sourceKeys = new Set(attributions.map((row) => `${row.source_type}:${row.source_id}`));
  const revenueEvents = ((revenueEventsRes.data || []) as Array<Record<string, unknown>>).filter((event) =>
    sourceKeys.has(`${event.source_type}:${event.source_id}`),
  );

  const totalPendingUsd = commissionEvents
    .filter((event) => event.status === "pending" || event.status === "approved")
    .reduce((sum, event) => sum + Number(event.amount || 0), 0);
  const totalPaidUsd = commissionEvents
    .filter((event) => event.status === "paid")
    .reduce((sum, event) => sum + Number(event.amount || 0), 0);
  const activeAccounts = attributions.filter((row) => row.active_status === "active");

  const earningsByCategory = commissionEvents.reduce<Record<string, number>>((acc, event) => {
    const key = String(event.source_type || "other");
    acc[key] = roundUsd((acc[key] || 0) + Number(event.amount || 0));
    return acc;
  }, {});

  return {
    planAssignments: (planAssignmentsRes.data || []).map((row) => {
      const plan = row.evntszn_compensation_plans as { id: string; slug: string; label: string } | { id: string; slug: string; label: string }[] | null;
      const normalizedPlan = Array.isArray(plan) ? plan[0] || null : plan;
      return {
        id: row.id,
        status: row.status,
        isPrimary: Boolean(row.is_primary),
        effectiveStartsAt: row.effective_starts_at,
        effectiveEndsAt: row.effective_ends_at,
        notes: row.notes,
        plan: normalizedPlan,
      };
    }),
    managedAccounts: attributions.map((row) => ({
      id: row.id,
      sourceType: row.source_type,
      sourceId: row.source_id,
      activeStatus: row.active_status,
      attributionStartedAt: row.attribution_started_at,
      attributionEndedAt: row.attribution_ended_at,
      notes: row.notes,
      label: String(row.metadata?.displayName || row.metadata?.title || row.source_id),
      city: String(row.metadata?.city || row.metadata?.market || ""),
      planLabel: String(row.metadata?.planLabel || ""),
      relationshipOwner: row.account_owner_user_id,
    })),
    earnings: {
      totalPendingUsd: roundUsd(totalPendingUsd),
      totalPaidUsd: roundUsd(totalPaidUsd),
      totalLifetimeUsd: roundUsd(totalPendingUsd + totalPaidUsd),
      byCategory: Object.entries(earningsByCategory)
        .sort((left, right) => right[1] - left[1])
        .map(([key, amount]) => ({ key, amount: roundUsd(amount) })),
    },
    summary: {
      activeAccountCount: activeAccounts.length,
      totalManagedAccounts: attributions.length,
      recentRevenueEventCount: revenueEvents.length,
      recentCommissionEventCount: commissionEvents.length,
    },
    recentRevenueEvents: revenueEvents.slice(0, 12).map((event) => ({
      id: String(event.id),
      sourceType: String(event.source_type),
      sourceId: String(event.source_id),
      eventType: String(event.event_type),
      grossAmount: roundUsd(Number(event.gross_amount || 0)),
      quantity: Number(event.quantity || 1),
      occurredAt: String(event.occurred_at),
      label: String((event.metadata as Record<string, unknown> | null)?.displayName || (event.metadata as Record<string, unknown> | null)?.title || event.source_id || ""),
    })),
    recentCommissionEvents: commissionEvents.slice(0, 12).map((event) => ({
      id: String(event.id),
      sourceType: String(event.source_type),
      sourceId: String(event.source_id),
      eventType: String(event.event_type),
      amount: roundUsd(Number(event.amount || 0)),
      status: String(event.status || "pending"),
      occurredAt: String(event.occurred_at),
      ruleKey: String(event.rule_key || ""),
      planSlug: String((event.metadata as Record<string, unknown> | null)?.planSlug || ""),
      label: String(((event.metadata as Record<string, unknown> | null)?.sourceMetadata as Record<string, unknown> | null)?.displayName || event.source_id || ""),
    })),
  };
}
