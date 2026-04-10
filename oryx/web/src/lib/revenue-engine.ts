import { supabaseAdmin } from "@/lib/supabase-admin";

export type RevenueEventType = "host" | "city_leader" | "independent";
type RevenueRecipientType = "hq" | "city_office" | "host" | "city_leader" | "override";
type RevenueSourceType = "ticket_split" | "platform_fee" | "override";
type RevenueAuditType = "purchase" | "rebuild" | "manual_check";

type RevenueProfileRow = {
  id: string;
  event_id: string;
  event_type: RevenueEventType;
  city_office_id: string | null;
  created_by_role: string | null;
  is_independent: boolean;
  independent_origin: "city" | "hq" | null;
};

type CommissionSplitRow = {
  role_type: Exclude<RevenueRecipientType, "override">;
  percentage: number | string;
};

type PlatformFeeRuleRow = {
  id: string;
  rule_key: string;
  ticket_type: string | null;
  price_threshold: number | string | null;
  fee_amount: number | string;
  city_percentage: number | string;
  hq_percentage: number | string;
};

type CommissionOverrideRow = {
  role_type: string;
  percentage: number | string;
  applies_to_city_share: boolean;
  is_active: boolean;
};

type EventRevenueContext = {
  id: string;
  city: string | null;
  organizer_user_id: string | null;
  event_class?: string | null;
};

type LedgerDraft = {
  recipient_type: RevenueRecipientType;
  recipient_id: string | null;
  amount: number;
  source_type: RevenueSourceType;
  status: "pending";
};

type RevenueComputation = {
  profile: RevenueProfileRow;
  feeRule: PlatformFeeRuleRow;
  grossAmount: number;
  platformFeeAmount: number;
  netAmount: number;
  ledgerDrafts: LedgerDraft[];
  notes: string[];
};

const OVERRIDE_ROLE_MAP: Record<string, string> = {
  commissioner: "city_commissioner",
  deputy_commissioner: "deputy_commissioner",
  host_development_manager: "host_development_manager",
  city_leader_override: "city_leader",
};

function toMoney(value: number | string | null | undefined) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function normalizeToken(value: string | null | undefined) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function buildRecipientKey(recipientType: RevenueRecipientType, recipientId: string | null) {
  return `${recipientType}:${recipientId || "none"}`;
}

function buildLedgerKey(row: Pick<LedgerDraft, "recipient_type" | "recipient_id" | "source_type">) {
  return `${row.source_type}:${row.recipient_type}:${row.recipient_id || "none"}`;
}

function allocateByPercentages<T extends { percentage: number }>(
  totalAmount: number,
  rows: T[],
): Array<T & { amount: number }> {
  const total = roundCurrency(totalAmount);
  if (total <= 0 || rows.length === 0) {
    return rows.map((row) => ({ ...row, amount: 0 }));
  }

  let remaining = total;
  return rows.map((row, index) => {
    if (index === rows.length - 1) {
      const amount = roundCurrency(remaining);
      return { ...row, amount };
    }
    const amount = roundCurrency((total * row.percentage) / 100);
    remaining = roundCurrency(remaining - amount);
    return { ...row, amount };
  });
}

async function inferCityOfficeId(city: string | null | undefined) {
  if (!city) return null;
  const { data } = await supabaseAdmin
    .from("city_offices")
    .select("id")
    .eq("city", city)
    .in("office_status", ["active", "launching"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.id || null;
}

async function getCommissionSplitDefaults(eventType: RevenueEventType) {
  if (eventType === "independent") return [];
  const { data, error } = await supabaseAdmin
    .from("commission_split_defaults")
    .select("role_type, percentage")
    .eq("event_type", eventType)
    .eq("is_active", true)
    .order("percentage", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as CommissionSplitRow[];
}

export async function ensureEventRevenueProfileForEvent(
  event: EventRevenueContext,
  options?: {
    eventType?: RevenueEventType | null;
    cityOfficeId?: string | null;
    createdByRole?: string | null;
    independentOrigin?: "city" | "hq" | null;
  },
) {
  const existingProfileRes = await supabaseAdmin
    .from("event_revenue_profiles")
    .select("id, event_id, event_type, city_office_id, created_by_role, is_independent, independent_origin")
    .eq("event_id", event.id)
    .maybeSingle();

  if (existingProfileRes.error) {
    throw new Error(existingProfileRes.error.message);
  }

  let profile = (existingProfileRes.data || null) as RevenueProfileRow | null;
  if (!profile) {
    const inferredType: RevenueEventType =
      options?.eventType ||
      (event.event_class === "independent_organizer" ? "independent" : "host");
    const resolvedCityOfficeId = options?.cityOfficeId ?? (await inferCityOfficeId(event.city));
    const independentOrigin =
      inferredType === "independent"
        ? options?.independentOrigin || (resolvedCityOfficeId ? "city" : "hq")
        : null;

    const { data, error } = await supabaseAdmin
      .from("event_revenue_profiles")
      .insert({
        event_id: event.id,
        event_type: inferredType,
        city_office_id: resolvedCityOfficeId,
        created_by_role: options?.createdByRole || null,
        is_independent: inferredType === "independent",
        independent_origin: independentOrigin,
      })
      .select("id, event_id, event_type, city_office_id, created_by_role, is_independent, independent_origin")
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Could not create revenue profile.");
    }

    profile = data as RevenueProfileRow;
  }

  const { data: existingSplits, error: splitError } = await supabaseAdmin
    .from("commission_splits")
    .select("role_type, percentage")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: true });

  if (splitError) {
    throw new Error(splitError.message);
  }

  if (profile.event_type !== "independent" && !(existingSplits || []).length) {
    const defaults = await getCommissionSplitDefaults(profile.event_type);
    if (defaults.length) {
      const { error } = await supabaseAdmin.from("commission_splits").insert(
        defaults.map((row) => ({
          profile_id: profile.id,
          role_type: row.role_type,
          percentage: toMoney(row.percentage),
        })),
      );

      if (error) {
        throw new Error(error.message);
      }
    }
  }

  return profile;
}

async function resolvePlatformFeeRule(ticketTypeName: string, unitGrossAmount: number) {
  const { data, error } = await supabaseAdmin
    .from("platform_fee_rules")
    .select("id, rule_key, ticket_type, price_threshold, fee_amount, city_percentage, hq_percentage")
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

  if (matchedTicketRule) {
    return matchedTicketRule;
  }

  const thresholdRule = rules.find((rule) => {
    const threshold = toMoney(rule.price_threshold);
    return threshold > 0 && unitGrossAmount >= threshold;
  });

  if (thresholdRule) {
    return thresholdRule;
  }

  const fallbackRule = rules.find((rule) => rule.rule_key === "default") || rules[0];
  if (!fallbackRule) {
    throw new Error("No platform fee rule is active.");
  }

  return fallbackRule;
}

async function resolveOfficeLeadUserId(cityOfficeId: string | null) {
  if (!cityOfficeId) return null;
  const { data, error } = await supabaseAdmin
    .from("city_offices")
    .select("office_lead_user_id")
    .eq("id", cityOfficeId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.office_lead_user_id || null;
}

async function resolveOverrideRecipients(eventCity: string | null, notes: string[]) {
  const { data: overrides, error: overridesError } = await supabaseAdmin
    .from("commission_overrides")
    .select("role_type, percentage, applies_to_city_share, is_active")
    .eq("is_active", true)
    .eq("applies_to_city_share", true);

  if (overridesError) {
    throw new Error(overridesError.message);
  }

  const activeOverrides = ((overrides || []) as CommissionOverrideRow[]).filter((row) => row.is_active);
  if (!activeOverrides.length) return [];

  const roleKeys = activeOverrides
    .map((row) => OVERRIDE_ROLE_MAP[row.role_type])
    .filter(Boolean);

  const { data: operators, error: operatorsError } = await supabaseAdmin
    .from("evntszn_operator_profiles")
    .select("user_id, role_key, city_scope, is_active")
    .eq("is_active", true)
    .in("role_key", roleKeys);

  if (operatorsError) {
    throw new Error(operatorsError.message);
  }

  const scopedOperators = (operators || []) as Array<{
    user_id: string;
    role_key: string;
    city_scope: string[] | null;
    is_active: boolean;
  }>;

  return activeOverrides.map((override) => {
    const roleKey = OVERRIDE_ROLE_MAP[override.role_type];
    const matches = scopedOperators.filter((operator) => {
      const scopedCities = Array.isArray(operator.city_scope) ? operator.city_scope : [];
      return operator.role_key === roleKey && (!eventCity || scopedCities.includes(eventCity));
    });

    if (matches.length > 1) {
      notes.push(`Multiple active recipients found for override role ${override.role_type}.`);
      return {
        ...override,
        recipientId: null,
        hasConflict: true,
      };
    }

    return {
      ...override,
      recipientId: matches[0]?.user_id || null,
      hasConflict: false,
    };
  });
}

async function computeTicketRevenue({
  ticketId,
  event,
  ticketTypeName,
  unitGrossAmount,
  profile,
}: {
  ticketId: string;
  event: EventRevenueContext;
  ticketTypeName: string;
  unitGrossAmount: number;
  profile: RevenueProfileRow;
}): Promise<RevenueComputation> {
  const notes: string[] = [];
  const feeRule = await resolvePlatformFeeRule(ticketTypeName, unitGrossAmount);
  const platformFeeAmount = toMoney(feeRule.fee_amount);
  const grossAmount = roundCurrency(unitGrossAmount);
  const netAmount = roundCurrency(grossAmount - platformFeeAmount);

  if (netAmount < 0) {
    throw new Error(`Revenue allocation for ticket ${ticketId} would create a negative net amount.`);
  }

  const officeLeadUserId = await resolveOfficeLeadUserId(profile.city_office_id);
  const baseRecipientIdByRole: Record<Exclude<RevenueRecipientType, "override">, string | null> = {
    host: event.organizer_user_id || null,
    city_leader: officeLeadUserId,
    city_office: profile.city_office_id || null,
    hq: null,
  };

  const ledgerDrafts: LedgerDraft[] = [];

  if (!profile.is_independent) {
    const { data: splitRows, error: splitError } = await supabaseAdmin
      .from("commission_splits")
      .select("role_type, percentage")
      .eq("profile_id", profile.id)
      .order("created_at", { ascending: true });

    if (splitError) {
      throw new Error(splitError.message);
    }

    const allocatedSplits = allocateByPercentages(
      netAmount,
      ((splitRows || []) as CommissionSplitRow[]).map((row) => ({
        role_type: row.role_type,
        percentage: toMoney(row.percentage),
      })),
    );

    for (const split of allocatedSplits) {
      if (split.amount <= 0) continue;
      ledgerDrafts.push({
        recipient_type: split.role_type,
        recipient_id: baseRecipientIdByRole[split.role_type],
        amount: split.amount,
        source_type: "ticket_split",
        status: "pending",
      });
    }
  }

  const feeRows = allocateByPercentages(platformFeeAmount, [
    { role_type: "city_office" as const, percentage: toMoney(feeRule.city_percentage) },
    { role_type: "hq" as const, percentage: toMoney(feeRule.hq_percentage) },
  ]);

  for (const feeRow of feeRows) {
    if (feeRow.amount <= 0) continue;
    ledgerDrafts.push({
      recipient_type: feeRow.role_type,
      recipient_id: baseRecipientIdByRole[feeRow.role_type],
      amount: feeRow.amount,
      source_type: "platform_fee",
      status: "pending",
    });
  }

  const cityShareBeforeOverride = roundCurrency(
    ledgerDrafts
      .filter((row) => row.recipient_type === "city_office")
      .reduce((sum, row) => sum + row.amount, 0),
  );

  const overrideRecipients = await resolveOverrideRecipients(event.city, notes);
  const validOverrides = overrideRecipients.filter((row) => !row.hasConflict);
  const overridePercentTotal = validOverrides.reduce((sum, row) => sum + toMoney(row.percentage), 0);
  const totalOverrideAmount = roundCurrency((cityShareBeforeOverride * overridePercentTotal) / 100);

  if (totalOverrideAmount > 0 && validOverrides.length) {
    const allocatedOverrides = allocateByPercentages(
      totalOverrideAmount,
      validOverrides.map((row) => ({
        role_type: row.role_type,
        recipientId: row.recipientId,
        percentage: (toMoney(row.percentage) / overridePercentTotal) * 100,
      })),
    );

    let remainingOverride = totalOverrideAmount;
    const cityRows = ledgerDrafts
      .map((row, index) => ({ row, index }))
      .filter((entry) => entry.row.recipient_type === "city_office")
      .sort((left, right) => {
        if (left.row.source_type === right.row.source_type) return 0;
        return left.row.source_type === "ticket_split" ? -1 : 1;
      });

    for (const entry of cityRows) {
      if (remainingOverride <= 0) break;
      const deduction = Math.min(entry.row.amount, remainingOverride);
      ledgerDrafts[entry.index] = {
        ...entry.row,
        amount: roundCurrency(entry.row.amount - deduction),
      };
      remainingOverride = roundCurrency(remainingOverride - deduction);
    }

    if (remainingOverride > 0) {
      notes.push("Override deductions exceeded the available city share.");
    }

    for (const override of allocatedOverrides) {
      if (override.amount <= 0) continue;
      ledgerDrafts.push({
        recipient_type: "override",
        recipient_id: override.recipientId || null,
        amount: override.amount,
        source_type: "override",
        status: "pending",
      });
    }
  }

  return {
    profile,
    feeRule,
    grossAmount,
    platformFeeAmount,
    netAmount,
    ledgerDrafts: ledgerDrafts.filter((row) => row.amount > 0),
    notes,
  };
}

function validateLedger({
  ledgerDrafts,
  grossAmount,
  platformFeeAmount,
  netAmount,
  notes,
}: {
  ledgerDrafts: LedgerDraft[];
  grossAmount: number;
  platformFeeAmount: number;
  netAmount: number;
  notes: string[];
}) {
  const draftKeys = new Set<string>();
  for (const row of ledgerDrafts) {
    const key = buildLedgerKey(row);
    if (draftKeys.has(key)) {
      notes.push(`Duplicate revenue row detected for ${key}.`);
    }
    draftKeys.add(key);
  }

  const totalAllocated = roundCurrency(ledgerDrafts.reduce((sum, row) => sum + row.amount, 0));
  const ticketSplitTotal = roundCurrency(
    ledgerDrafts
      .filter((row) => row.source_type === "ticket_split")
      .reduce((sum, row) => sum + row.amount, 0),
  );
  const platformFeeTotal = roundCurrency(
    ledgerDrafts
      .filter((row) => row.source_type === "platform_fee")
      .reduce((sum, row) => sum + row.amount, 0),
  );
  const overrideTotal = roundCurrency(
    ledgerDrafts
      .filter((row) => row.source_type === "override")
      .reduce((sum, row) => sum + row.amount, 0),
  );
  const cityShareAfterOverride = roundCurrency(
    ledgerDrafts
      .filter((row) => row.recipient_type === "city_office")
      .reduce((sum, row) => sum + row.amount, 0),
  );

  if (ticketSplitTotal > netAmount) {
    notes.push("Ticket split allocation exceeded the event net revenue.");
  }

  if (platformFeeTotal !== platformFeeAmount) {
    notes.push("Platform fee allocation did not match the configured fee rule.");
  }

  if (totalAllocated > grossAmount) {
    notes.push("Revenue allocation exceeded the gross ticket amount.");
  }

  if (roundCurrency(cityShareAfterOverride + overrideTotal) < overrideTotal) {
    notes.push("Override deductions were not applied exclusively against the city share.");
  }

  return {
    totalAllocated,
    ticketSplitTotal,
    platformFeeTotal,
    overrideTotal,
    isBalanced:
      notes.length === 0 &&
      totalAllocated === grossAmount &&
      ticketSplitTotal <= netAmount &&
      platformFeeTotal === platformFeeAmount,
  };
}

export async function ensureTicketRevenueAllocation({
  ticketId,
  eventId,
  ticketTypeName,
  unitGrossAmount,
  auditType = "purchase",
}: {
  ticketId: string;
  eventId: string;
  ticketTypeName: string;
  unitGrossAmount: number;
  auditType?: RevenueAuditType;
}) {
  const existingLocked = await supabaseAdmin
    .from("revenue_ledger")
    .select("id", { count: "exact", head: true })
    .eq("ticket_id", ticketId)
    .eq("status", "locked");

  if (existingLocked.error) {
    throw new Error(existingLocked.error.message);
  }

  if ((existingLocked.count || 0) > 0) {
    return { ok: true, alreadyLocked: true };
  }

  await Promise.all([
    supabaseAdmin.from("revenue_ledger").delete().eq("ticket_id", ticketId).eq("status", "pending"),
    supabaseAdmin.from("revenue_recipients_snapshot").delete().eq("ticket_id", ticketId),
    supabaseAdmin.from("revenue_audit_runs").delete().eq("ticket_id", ticketId),
    supabaseAdmin.from("ticket_revenue_records").delete().eq("ticket_id", ticketId),
  ]);

  const { data: eventRow, error: eventError } = await supabaseAdmin
    .from("evntszn_events")
    .select("id, city, organizer_user_id, event_class")
    .eq("id", eventId)
    .single();

  if (eventError || !eventRow) {
    throw new Error(eventError?.message || "Event revenue context is missing.");
  }

  const profile = await ensureEventRevenueProfileForEvent(eventRow);
  const computation = await computeTicketRevenue({
    ticketId,
    event: eventRow,
    ticketTypeName,
    unitGrossAmount,
    profile,
  });

  const validation = validateLedger({
    ledgerDrafts: computation.ledgerDrafts,
    grossAmount: computation.grossAmount,
    platformFeeAmount: computation.platformFeeAmount,
    netAmount: computation.netAmount,
    notes: computation.notes,
  });

  const { error: recordError } = await supabaseAdmin.from("ticket_revenue_records").insert({
    ticket_id: ticketId,
    event_id: eventId,
    gross_amount: computation.grossAmount,
    platform_fee_amount: computation.platformFeeAmount,
    net_amount: computation.netAmount,
  });

  if (recordError) {
    throw new Error(recordError.message);
  }

  if (computation.ledgerDrafts.length) {
    const { error: ledgerInsertError } = await supabaseAdmin.from("revenue_ledger").insert(
      computation.ledgerDrafts.map((row) => ({
        event_id: eventId,
        ticket_id: ticketId,
        recipient_type: row.recipient_type,
        recipient_id: row.recipient_id,
        amount: row.amount,
        source_type: row.source_type,
        status: "pending",
      })),
    );

    if (ledgerInsertError) {
      throw new Error(ledgerInsertError.message);
    }
  }

  const { data: actualRows, error: actualRowsError } = await supabaseAdmin
    .from("revenue_ledger")
    .select("recipient_type, recipient_id, amount, source_type, status")
    .eq("ticket_id", ticketId);

  if (actualRowsError) {
    throw new Error(actualRowsError.message);
  }

  const expectedByRecipient = new Map<string, { recipientType: RevenueRecipientType; recipientId: string | null; amount: number }>();
  for (const row of computation.ledgerDrafts) {
    const key = buildRecipientKey(row.recipient_type, row.recipient_id);
    const current = expectedByRecipient.get(key);
    expectedByRecipient.set(key, {
      recipientType: row.recipient_type,
      recipientId: row.recipient_id,
      amount: roundCurrency((current?.amount || 0) + row.amount),
    });
  }

  const actualByRecipient = new Map<string, number>();
  for (const row of actualRows || []) {
    const key = buildRecipientKey(row.recipient_type as RevenueRecipientType, row.recipient_id || null);
    actualByRecipient.set(key, roundCurrency((actualByRecipient.get(key) || 0) + toMoney(row.amount)));
  }

  const snapshotPayload = Array.from(expectedByRecipient.entries()).map(([key, row]) => {
    const actualAmount = actualByRecipient.get(key) || 0;
    return {
      event_id: eventId,
      ticket_id: ticketId,
      recipient_type: row.recipientType,
      recipient_id: row.recipientId,
      expected_amount: row.amount,
      actual_amount: actualAmount,
      variance_amount: roundCurrency(actualAmount - row.amount),
    };
  });

  if (snapshotPayload.length) {
    const { error: snapshotError } = await supabaseAdmin.from("revenue_recipients_snapshot").insert(snapshotPayload);
    if (snapshotError) {
      throw new Error(snapshotError.message);
    }
  }

  const actualTotal = roundCurrency(
    (actualRows || []).reduce((sum, row) => sum + toMoney(row.amount), 0),
  );
  const isBalanced =
    validation.isBalanced &&
    actualTotal === computation.grossAmount &&
    snapshotPayload.every((row) => row.variance_amount === 0);

  const { error: auditError } = await supabaseAdmin.from("revenue_audit_runs").insert({
    event_id: eventId,
    ticket_id: ticketId,
    audit_type: auditType,
    expected_total: computation.grossAmount,
    actual_total: actualTotal,
    is_balanced: isBalanced,
    notes: computation.notes.join(" ").trim() || null,
  });

  if (auditError) {
    throw new Error(auditError.message);
  }

  if (isBalanced) {
    const { error: lockError } = await supabaseAdmin
      .from("revenue_ledger")
      .update({ status: "locked" })
      .eq("ticket_id", ticketId)
      .eq("status", "pending");

    if (lockError) {
      throw new Error(lockError.message);
    }
  } else {
    throw new Error(computation.notes.join(" ").trim() || "Revenue allocation audit did not balance.");
  }

  return {
    ok: true,
    alreadyLocked: false,
    feeRuleKey: computation.feeRule.rule_key,
  };
}
