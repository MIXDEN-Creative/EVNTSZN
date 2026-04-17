import { supabaseAdmin } from "@/lib/supabase-admin";

type GrowthEntityType = "host" | "organizer" | "venue" | "partner" | "epl_player_source";

type PlatformFeeRuleRow = {
  rule_key: string;
  ticket_type: string | null;
  price_threshold: number | string | null;
  fee_amount: number | string;
};

function toMoney(value: number | string | null | undefined) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function normalizeToken(value: string | null | undefined) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function resolvePlatformFeeRule(ticketTypeName: string, unitGrossAmount: number) {
  const { data, error } = await supabaseAdmin
    .from("platform_fee_rules")
    .select("rule_key, ticket_type, price_threshold, fee_amount")
    .eq("is_active", true);

  if (error) {
    throw new Error(error.message);
  }

  const rules = ((data || []) as PlatformFeeRuleRow[]).sort((left, right) => {
    const leftTicket = normalizeToken(left.ticket_type).length;
    const rightTicket = normalizeToken(right.ticket_type).length;
    if (leftTicket !== rightTicket) return rightTicket - leftTicket;
    return toMoney(right.price_threshold) - toMoney(left.price_threshold);
  });

  const normalizedTicketType = normalizeToken(ticketTypeName);
  const matchedTicketRule = rules.find((rule) => {
    const token = normalizeToken(rule.ticket_type);
    return token && normalizedTicketType.includes(token);
  });
  if (matchedTicketRule) return matchedTicketRule;

  const thresholdRule = rules.find((rule) => {
    const threshold = toMoney(rule.price_threshold);
    return threshold > 0 && unitGrossAmount >= threshold;
  });
  if (thresholdRule) return thresholdRule;

  return rules.find((rule) => rule.rule_key === "default") || null;
}

async function refreshGrowthCompensationSummary(userId: string) {
  const { error } = await supabaseAdmin.rpc("refresh_growth_compensation_summary", {
    p_user_id: userId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

async function getActiveGrowthAttribution(entityType: GrowthEntityType, entityId: string) {
  const { data, error } = await supabaseAdmin
    .from("growth_attributions")
    .select("id, attributed_to_user_id, attribution_source, attribution_start_date, attribution_active")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .eq("attribution_active", true)
    .order("attribution_start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function syncHostGrowthCompensationForTicketOrder(input: {
  orderId: string;
  eventId: string;
  organizerUserId: string | null;
  ticketTypeName: string;
  unitGrossAmount: number;
  quantity: number;
}) {
  if (!input.organizerUserId) {
    return { ok: true, created: false, reason: "missing_host" as const };
  }

  const [{ data: hostProfile, error: hostError }, attribution, feeRule] = await Promise.all([
    supabaseAdmin
      .from("evntszn_operator_profiles")
      .select("user_id, is_active, organizer_classification")
      .eq("user_id", input.organizerUserId)
      .maybeSingle(),
    getActiveGrowthAttribution("host", input.organizerUserId),
    resolvePlatformFeeRule(input.ticketTypeName, input.unitGrossAmount),
  ]);

  if (hostError) {
    throw new Error(hostError.message);
  }

  const isHost =
    hostProfile?.is_active &&
    (hostProfile.organizer_classification === "evntszn_host" ||
      hostProfile.organizer_classification === "city_host");

  if (!isHost || !attribution?.attributed_to_user_id) {
    return { ok: true, created: false, reason: "unattributed_or_inactive" as const };
  }

  const revenueAmountUsd = toMoney(input.unitGrossAmount * input.quantity);
  const isPremiumTicket = feeRule ? toMoney(feeRule.fee_amount) >= 1.99 || feeRule.rule_key === "premium" : input.unitGrossAmount > 30;
  const feeShareUsd = isPremiumTicket ? 0.3 : 0.15;
  const compensationAmountUsd = toMoney((revenueAmountUsd * 3) / 100 + input.quantity * feeShareUsd);

  const { error: eventError } = await supabaseAdmin.from("growth_compensation_events").upsert(
    {
      entity_type: "host",
      entity_id: input.organizerUserId,
      attributed_to_user_id: attribution.attributed_to_user_id,
      event_type: "ticket_sale",
      revenue_amount_usd: revenueAmountUsd,
      compensation_amount_usd: compensationAmountUsd,
      source_order_id: input.orderId,
      source_event_id: input.eventId,
      metadata_json: {
        ticketTypeName: input.ticketTypeName,
        quantity: input.quantity,
        unitGrossAmountUsd: toMoney(input.unitGrossAmount),
        platformFeeRuleKey: feeRule?.rule_key || "fallback",
        feeShareUsd,
        isPremiumTicket,
        attributionSource: attribution.attribution_source,
      },
    },
    {
      onConflict: "event_type,entity_type,entity_id,attributed_to_user_id,source_order_id",
    },
  );

  if (eventError) {
    throw new Error(eventError.message);
  }

  await refreshGrowthCompensationSummary(attribution.attributed_to_user_id);

  return {
    ok: true,
    created: true,
    attributedToUserId: attribution.attributed_to_user_id,
    revenueAmountUsd,
    compensationAmountUsd,
  };
}
