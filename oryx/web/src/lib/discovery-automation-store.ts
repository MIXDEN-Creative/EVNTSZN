import { getDiscoveryIntelligenceSnapshot, type DiscoveryCityIntelligence } from "@/lib/discovery-intelligence";
import { supabaseAdmin } from "@/lib/supabase-admin";

export type DiscoveryAutomationSnapshotRow = {
  city_key: string;
  city_label: string;
  maturity_state: string;
  automation_status: string;
  promotion_status: string;
  next_maturity_state: string | null;
  policy_label: string;
  policy_reason: string;
  confidence_score: number;
  override_active: boolean;
  override_reason: string | null;
  forced_policy_status: string | null;
  forced_maturity_state: string | null;
  suppress_promotion: boolean;
  last_evaluated_at: string;
  next_evaluation_at: string | null;
  total_usable_inventory: number;
  trend_direction: string;
  trend_delta_percent: number;
  source_mix: Record<string, unknown>;
  momentum_source_mix: Record<string, unknown>;
  top_slots: Record<string, unknown>;
  metadata: Record<string, unknown>;
};

export type DiscoveryAutomationOverrideInput = {
  cityKey: string;
  cityLabel: string;
  forcedPolicyStatus: "monitoring" | "accelerating" | "recovering" | "intervening" | null;
  forcedMaturityState: "strong" | "growing" | "imported_fallback" | null;
  suppressPromotion: boolean;
  overrideReason: string | null;
};

function toIsoOrNull(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function normalizeCityKey(cityKey: string) {
  return cityKey.toLowerCase().replace(/[^a-z]/g, "") || "default";
}

function toSnapshotRow(row: DiscoveryCityIntelligence): DiscoveryAutomationSnapshotRow {
  return {
    city_key: normalizeCityKey(row.citySlug || row.city),
    city_label: row.city,
    maturity_state: row.maturityLabel,
    automation_status: row.automationStatus,
    promotion_status: row.promotionEvaluation.status,
    next_maturity_state: row.promotionEvaluation.nextLevel,
    policy_label: row.policy.label,
    policy_reason: row.policyReason,
    confidence_score: row.automationIntelligence.policy.confidence,
    override_active: row.automationIntelligence.isOverridden,
    override_reason: row.automationIntelligence.overrideReason || null,
    forced_policy_status: row.automationIntelligence.forcedPolicyStatus || null,
    forced_maturity_state: row.automationIntelligence.forcedMaturityState || null,
    suppress_promotion: Boolean(row.automationIntelligence.suppressPromotion),
    last_evaluated_at: row.automationIntelligence.lastEvaluatedAt || new Date().toISOString(),
    next_evaluation_at: toIsoOrNull(row.automationIntelligence.nextEvaluationAt),
    total_usable_inventory: row.totalUsableInventory,
    trend_direction: row.trendDirection,
    trend_delta_percent: row.trendDeltaPercent,
    source_mix: row.sourceMix,
    momentum_source_mix: row.momentumSourceMix,
    top_slots: row.topSlots,
    metadata: {
      nativeBoost: row.policy.nativeBoost,
      curatorBoost: row.policy.curatorBoost,
      partnerBoost: row.policy.partnerBoost,
      importedPenalty: row.policy.importedPenalty,
      policyState: row.policy.state,
      policyExplanation: row.policy.explanation,
      promotionReason: row.promotionEvaluation.promotionReason,
      missingSignals: row.promotionEvaluation.missingSignals,
      isEligibleForPromotion: row.promotionEvaluation.isEligibleForPromotion,
      actionPlan: row.automationIntelligence.policy.actionPlan,
      opsFlags: row.automationIntelligence.policy.opsFlags,
      nativeLifted: row.nativeLifted,
      importedDominating: row.importedDominating,
      outcomeLabel: row.outcomeLabel,
    },
  };
}

function buildAuditRows(input: {
  previous: DiscoveryAutomationSnapshotRow | null;
  next: DiscoveryAutomationSnapshotRow;
  actor: string;
}) {
  const rows: Record<string, unknown>[] = [
    {
      city_key: input.next.city_key,
      action_type: "evaluation_completed",
      previous_state: input.previous?.maturity_state || null,
      new_state: input.next.maturity_state,
      previous_promotion_status: input.previous?.promotion_status || null,
      new_promotion_status: input.next.promotion_status,
      policy_applied: input.next.policy_label,
      automation_status: input.next.automation_status,
      previous_policy_label: input.previous?.policy_label || null,
      new_policy_label: input.next.policy_label,
      previous_automation_status: input.previous?.automation_status || null,
      new_automation_status: input.next.automation_status,
      previous_override_active: input.previous?.override_active || false,
      new_override_active: input.next.override_active,
      reason: input.next.policy_reason,
      metadata: input.next.metadata,
      triggered_by: input.actor,
    },
  ];

  if (input.previous?.maturity_state !== input.next.maturity_state) {
    rows.push({
      city_key: input.next.city_key,
      action_type: "maturity_state_changed",
      previous_state: input.previous?.maturity_state || null,
      new_state: input.next.maturity_state,
      policy_applied: input.next.policy_label,
      automation_status: input.next.automation_status,
      previous_policy_label: input.previous?.policy_label || null,
      new_policy_label: input.next.policy_label,
      reason: input.next.policy_reason,
      metadata: {
        previous: input.previous?.metadata || null,
        next: input.next.metadata,
      },
      triggered_by: input.actor,
    });
  }

  if (input.previous?.automation_status !== input.next.automation_status) {
    rows.push({
      city_key: input.next.city_key,
      action_type: "automation_status_changed",
      previous_state: input.previous?.maturity_state || null,
      new_state: input.next.maturity_state,
      previous_promotion_status: input.previous?.promotion_status || null,
      new_promotion_status: input.next.promotion_status,
      policy_applied: input.next.policy_label,
      automation_status: input.next.automation_status,
      previous_automation_status: input.previous?.automation_status || null,
      new_automation_status: input.next.automation_status,
      reason: input.next.policy_reason,
      metadata: input.next.metadata,
      triggered_by: input.actor,
    });
  }

  if (input.previous?.policy_label !== input.next.policy_label) {
    rows.push({
      city_key: input.next.city_key,
      action_type: "policy_profile_changed",
      previous_state: input.previous?.maturity_state || null,
      new_state: input.next.maturity_state,
      previous_promotion_status: input.previous?.promotion_status || null,
      new_promotion_status: input.next.promotion_status,
      policy_applied: input.next.policy_label,
      automation_status: input.next.automation_status,
      previous_policy_label: input.previous?.policy_label || null,
      new_policy_label: input.next.policy_label,
      reason: input.next.policy_reason,
      metadata: input.next.metadata,
      triggered_by: input.actor,
    });
  }

  if (input.previous?.promotion_status !== "promotion_ready" && input.next.promotion_status === "promotion_ready") {
    rows.push({
      city_key: input.next.city_key,
      action_type: "promotion_ready_reached",
      previous_state: input.previous?.maturity_state || null,
      new_state: input.next.maturity_state,
      previous_promotion_status: input.previous?.promotion_status || null,
      new_promotion_status: input.next.promotion_status,
      policy_applied: input.next.policy_label,
      automation_status: input.next.automation_status,
      reason: input.next.policy_reason,
      metadata: input.next.metadata,
      triggered_by: input.actor,
    });
  }

  if (input.previous?.automation_status !== "recovering" && input.next.automation_status === "recovering") {
    rows.push({
      city_key: input.next.city_key,
      action_type: "fallback_support_mode_entered",
      previous_state: input.previous?.maturity_state || null,
      new_state: input.next.maturity_state,
      previous_promotion_status: input.previous?.promotion_status || null,
      new_promotion_status: input.next.promotion_status,
      policy_applied: input.next.policy_label,
      automation_status: input.next.automation_status,
      reason: input.next.policy_reason,
      metadata: input.next.metadata,
      triggered_by: input.actor,
    });
  }

  if (input.previous?.promotion_status !== input.next.promotion_status && ["declining", "hold"].includes(input.next.promotion_status)) {
    rows.push({
      city_key: input.next.city_key,
      action_type: input.next.promotion_status === "declining" ? "declining_state_entered" : "hold_state_entered",
      previous_state: input.previous?.maturity_state || null,
      new_state: input.next.maturity_state,
      previous_promotion_status: input.previous?.promotion_status || null,
      new_promotion_status: input.next.promotion_status,
      policy_applied: input.next.policy_label,
      automation_status: input.next.automation_status,
      reason: input.next.policy_reason,
      metadata: input.next.metadata,
      triggered_by: input.actor,
    });
  }

  return rows;
}

export async function getDiscoveryAutomationSnapshotMap(cityKeys?: string[]) {
  let query = supabaseAdmin.from("city_automation_snapshots").select("*");
  if (cityKeys?.length) {
    query = query.in("city_key", cityKeys.map(normalizeCityKey));
  }
  const { data, error } = await query;
  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") return new Map<string, DiscoveryAutomationSnapshotRow>();
    throw new Error(error.message);
  }
  return new Map<string, DiscoveryAutomationSnapshotRow>(
    ((data || []) as DiscoveryAutomationSnapshotRow[]).map((row) => [row.city_key, row]),
  );
}

export async function getDiscoveryRuntimePolicyMap(cityKeys: string[]) {
  const snapshotMap = await getDiscoveryAutomationSnapshotMap(cityKeys);
  const policyMap = new Map<
    string,
    {
      nativeBoost: number;
      curatorBoost: number;
      partnerBoost: number;
      importedPenalty: number;
    }
  >();

  for (const [cityKey, snapshot] of snapshotMap.entries()) {
    const metadata = snapshot.metadata || {};
    const nativeBoost = typeof metadata.nativeBoost === "number" ? metadata.nativeBoost : null;
    const curatorBoost = typeof metadata.curatorBoost === "number" ? metadata.curatorBoost : nativeBoost;
    const partnerBoost = typeof metadata.partnerBoost === "number" ? metadata.partnerBoost : nativeBoost;
    const importedPenalty = typeof metadata.importedPenalty === "number" ? metadata.importedPenalty : null;

    if (nativeBoost === null || importedPenalty === null) continue;

    policyMap.set(cityKey, {
      nativeBoost,
      curatorBoost: typeof curatorBoost === "number" ? curatorBoost : nativeBoost,
      partnerBoost: typeof partnerBoost === "number" ? partnerBoost : nativeBoost,
      importedPenalty,
    });
  }

  return policyMap;
}

export async function persistDiscoveryAutomationEvaluation(input?: {
  cityKey?: string;
  actor?: string;
}) {
  const actor = input?.actor || "system";
  const intelligence = await getDiscoveryIntelligenceSnapshot();
  const filteredRows = input?.cityKey
    ? intelligence.cityRows.filter((row) => normalizeCityKey(row.citySlug || row.city) === normalizeCityKey(input.cityKey || ""))
    : intelligence.cityRows;

  const previousSnapshots = await getDiscoveryAutomationSnapshotMap(filteredRows.map((row) => row.citySlug || row.city));
  const nextRows = filteredRows.map(toSnapshotRow);

  if (!nextRows.length) {
    return {
      evaluated: 0,
      rows: [],
    };
  }

  const { error: upsertError } = await supabaseAdmin
    .from("city_automation_snapshots")
    .upsert(nextRows, { onConflict: "city_key" });

  if (upsertError) {
    throw new Error(upsertError.message);
  }

  const auditRows = nextRows.flatMap((row) =>
    buildAuditRows({
      previous: previousSnapshots.get(row.city_key) || null,
      next: row,
      actor,
    }),
  );

  if (auditRows.length) {
    const { error: auditError } = await supabaseAdmin.from("city_automation_audit").insert(auditRows);
    if (auditError) {
      throw new Error(auditError.message);
    }
  }

  return {
    evaluated: nextRows.length,
    rows: nextRows,
  };
}

export async function setDiscoveryAutomationOverride(input: DiscoveryAutomationOverrideInput & { actor: string }) {
  const cityKey = normalizeCityKey(input.cityKey);
  const payload = {
    city_key: cityKey,
    forced_policy_status: input.forcedPolicyStatus,
    forced_maturity_state: input.forcedMaturityState,
    suppress_promotion: input.suppressPromotion,
    override_reason: input.overrideReason,
    updated_at: new Date().toISOString(),
    updated_by_user_id: input.actor.startsWith("founder:") ? null : input.actor,
  };

  const { data: existing } = await supabaseAdmin
    .from("city_automation_overrides")
    .select("*")
    .eq("city_key", cityKey)
    .maybeSingle();

  const { error } = await supabaseAdmin
    .from("city_automation_overrides")
    .upsert(payload, { onConflict: "city_key" });

  if (error) {
    throw new Error(error.message);
  }

  const actionType = existing ? "override_updated" : "override_created";
  const { error: auditError } = await supabaseAdmin.from("city_automation_audit").insert({
    city_key: cityKey,
    action_type: actionType,
    previous_state: existing?.forced_maturity_state || null,
    new_state: input.forcedMaturityState,
    previous_promotion_status: null,
    new_promotion_status: null,
    policy_applied: input.forcedPolicyStatus,
    automation_status: input.forcedPolicyStatus,
    previous_policy_label: existing?.forced_policy_status || null,
    new_policy_label: input.forcedPolicyStatus,
    previous_automation_status: existing?.forced_policy_status || null,
    new_automation_status: input.forcedPolicyStatus,
    previous_override_active: Boolean(existing),
    new_override_active: true,
    reason: input.overrideReason || "Manual override updated",
    metadata: {
      cityLabel: input.cityLabel,
      suppressPromotion: input.suppressPromotion,
      forcedMaturityState: input.forcedMaturityState,
      forcedPolicyStatus: input.forcedPolicyStatus,
    },
    triggered_by: input.actor,
  });

  if (auditError) {
    throw new Error(auditError.message);
  }

  return persistDiscoveryAutomationEvaluation({ cityKey, actor: input.actor });
}

export async function clearDiscoveryAutomationOverride(input: {
  cityKey: string;
  cityLabel: string;
  actor: string;
}) {
  const cityKey = normalizeCityKey(input.cityKey);
  const { data: existing } = await supabaseAdmin
    .from("city_automation_overrides")
    .select("*")
    .eq("city_key", cityKey)
    .maybeSingle();

  const { error } = await supabaseAdmin.from("city_automation_overrides").delete().eq("city_key", cityKey);
  if (error) {
    throw new Error(error.message);
  }

  const { error: auditError } = await supabaseAdmin.from("city_automation_audit").insert({
    city_key: cityKey,
    action_type: "override_cleared",
    previous_state: existing?.forced_maturity_state || null,
    new_state: null,
    previous_promotion_status: null,
    new_promotion_status: null,
    policy_applied: null,
    automation_status: null,
    previous_policy_label: existing?.forced_policy_status || null,
    new_policy_label: null,
    previous_automation_status: existing?.forced_policy_status || null,
    new_automation_status: null,
    previous_override_active: true,
    new_override_active: false,
    reason: existing?.override_reason || "Manual override cleared",
    metadata: { cityLabel: input.cityLabel },
    triggered_by: input.actor,
  });

  if (auditError) {
    throw new Error(auditError.message);
  }

  return persistDiscoveryAutomationEvaluation({ cityKey, actor: input.actor });
}
