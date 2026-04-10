import { supabaseAdmin } from "@/lib/supabase-admin";

type RecipientType = "hq" | "city_office" | "host" | "city_leader" | "override";
type PayoutStatus = "pending" | "sent" | "failed" | "void";

type LedgerRow = {
  id: string;
  event_id: string;
  ticket_id: string;
  recipient_type: RecipientType;
  recipient_id: string | null;
  amount: number | string;
  source_type: "ticket_split" | "platform_fee" | "override";
  status: "pending" | "locked" | "void";
  created_at: string;
};

type PayoutRow = {
  id: string;
  user_id: string | null;
  recipient_type: RecipientType;
  recipient_label: string | null;
  amount: number | string;
  status: PayoutStatus;
  method: "manual";
  notes: string | null;
  created_by: string | null;
  created_at: string;
  paid_at: string | null;
};

type PayoutLinkRow = {
  id: string;
  payout_id: string;
  ledger_id: string;
  amount: number | string;
  released_at: string | null;
  created_at: string;
};

function toMoney(value: number | string | null | undefined) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function buildRecipientKey(recipientType: RecipientType, recipientId: string | null) {
  return `${recipientType}:${recipientId || "none"}`;
}

function isActivePayoutStatus(status: PayoutStatus) {
  return status === "pending" || status === "sent" || status === "failed";
}

async function getRecipientLabels(recipientKeys: Array<{ recipientType: RecipientType; recipientId: string | null }>) {
  const officeIds = recipientKeys
    .filter((row) => row.recipientType === "city_office" && row.recipientId)
    .map((row) => row.recipientId as string);
  const userIds = recipientKeys
    .filter((row) => row.recipientType !== "hq" && row.recipientType !== "city_office" && row.recipientId)
    .map((row) => row.recipientId as string);

  const [officesRes, profilesRes] = await Promise.all([
    officeIds.length
      ? supabaseAdmin.from("city_offices").select("id, office_name, city").in("id", officeIds)
      : Promise.resolve({ data: [] as Array<{ id: string; office_name: string; city: string }>, error: null }),
    userIds.length
      ? supabaseAdmin.from("evntszn_profiles").select("user_id, full_name, city").in("user_id", userIds)
      : Promise.resolve({ data: [] as Array<{ user_id: string; full_name: string | null; city: string | null }>, error: null }),
  ]);

  if (officesRes.error) throw new Error(officesRes.error.message);
  if (profilesRes.error) throw new Error(profilesRes.error.message);

  const officeMap = new Map((officesRes.data || []).map((office) => [office.id, `${office.office_name} · ${office.city}`]));
  const profileMap = new Map(
    (profilesRes.data || []).map((profile) => [
      profile.user_id,
      profile.full_name || (profile.city ? `${profile.user_id} · ${profile.city}` : profile.user_id),
    ]),
  );

  return recipientKeys.reduce<Record<string, string>>((labels, row) => {
    const key = buildRecipientKey(row.recipientType, row.recipientId);
    if (row.recipientType === "hq") {
      labels[key] = "EVNTSZN HQ";
      return labels;
    }
    if (row.recipientType === "city_office") {
      labels[key] = row.recipientId ? officeMap.get(row.recipientId) || "City office" : "Unassigned city office";
      return labels;
    }
    labels[key] = row.recipientId ? profileMap.get(row.recipientId) || row.recipientId : `${row.recipientType} recipient`;
    return labels;
  }, {});
}

export async function getPayoutWorkspace(recipientKey?: string | null) {
  const [ledgerRes, payoutsRes, linksRes, eventsRes, ticketsRes] = await Promise.all([
    supabaseAdmin
      .from("revenue_ledger")
      .select("id, event_id, ticket_id, recipient_type, recipient_id, amount, source_type, status, created_at")
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("payouts")
      .select("id, user_id, recipient_type, recipient_label, amount, status, method, notes, created_by, created_at, paid_at")
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("payout_ledger_links")
      .select("id, payout_id, ledger_id, amount, released_at, created_at")
      .order("created_at", { ascending: false }),
    supabaseAdmin.from("evntszn_events").select("id, title, city"),
    supabaseAdmin.from("evntszn_tickets").select("id, ticket_code"),
  ]);

  if (ledgerRes.error) throw new Error(ledgerRes.error.message);
  if (payoutsRes.error) throw new Error(payoutsRes.error.message);
  if (linksRes.error) throw new Error(linksRes.error.message);
  if (eventsRes.error) throw new Error(eventsRes.error.message);
  if (ticketsRes.error) throw new Error(ticketsRes.error.message);

  const ledgerRows = (ledgerRes.data || []) as LedgerRow[];
  const payouts = (payoutsRes.data || []) as PayoutRow[];
  const links = (linksRes.data || []) as PayoutLinkRow[];
  const payoutMap = new Map(payouts.map((payout) => [payout.id, payout]));
  const eventMap = new Map((eventsRes.data || []).map((event) => [event.id, event]));
  const ticketMap = new Map((ticketsRes.data || []).map((ticket) => [ticket.id, ticket]));

  const recipientKeys = Array.from(
    new Set(ledgerRows.map((row) => buildRecipientKey(row.recipient_type, row.recipient_id))),
  ).map((key) => {
    const [recipientType, recipientId] = key.split(":");
    return {
      recipientType: recipientType as RecipientType,
      recipientId: recipientId === "none" ? null : recipientId,
    };
  });
  const recipientLabels = await getRecipientLabels(recipientKeys);

  const activeLinkByLedgerId = new Map<string, { payout: PayoutRow; link: PayoutLinkRow }>();
  const paidLinkByLedgerId = new Map<string, { payout: PayoutRow; link: PayoutLinkRow }>();
  for (const link of links) {
    if (link.released_at) continue;
    const payout = payoutMap.get(link.payout_id);
    if (!payout) continue;
    if (isActivePayoutStatus(payout.status)) {
      activeLinkByLedgerId.set(link.ledger_id, { payout, link });
    }
    if (payout.status === "sent") {
      paidLinkByLedgerId.set(link.ledger_id, { payout, link });
    }
  }

  const recipientSummaries = recipientKeys
    .map(({ recipientType, recipientId }) => {
      const key = buildRecipientKey(recipientType, recipientId);
      const rows = ledgerRows.filter(
        (row) => row.recipient_type === recipientType && (row.recipient_id || null) === recipientId,
      );
      const pendingAmount = rows
        .filter((row) => row.status === "pending")
        .reduce((sum, row) => sum + toMoney(row.amount), 0);
      const availableAmount = rows
        .filter((row) => row.status === "locked" && !activeLinkByLedgerId.has(row.id))
        .reduce((sum, row) => sum + toMoney(row.amount), 0);
      const paidAmount = rows
        .filter((row) => paidLinkByLedgerId.has(row.id))
        .reduce((sum, row) => sum + toMoney(row.amount), 0);

      return {
        recipientKey: key,
        recipientType,
        recipientId,
        recipientLabel: recipientLabels[key] || key,
        availableAmount: toMoney(availableAmount),
        pendingAmount: toMoney(pendingAmount),
        paidAmount: toMoney(paidAmount),
      };
    })
    .sort((left, right) => right.availableAmount - left.availableAmount || left.recipientLabel.localeCompare(right.recipientLabel));

  const activeRecipientKey =
    recipientKey && recipientSummaries.some((recipient) => recipient.recipientKey === recipientKey)
      ? recipientKey
      : recipientSummaries[0]?.recipientKey || null;

  const selectedRecipient = recipientSummaries.find((recipient) => recipient.recipientKey === activeRecipientKey) || null;
  const availableLedgerRows = selectedRecipient
    ? ledgerRows
        .filter(
          (row) =>
            buildRecipientKey(row.recipient_type, row.recipient_id) === selectedRecipient.recipientKey &&
            row.status === "locked" &&
            !activeLinkByLedgerId.has(row.id),
        )
        .map((row) => ({
          id: row.id,
          amount: toMoney(row.amount),
          sourceType: row.source_type,
          createdAt: row.created_at,
          eventTitle: eventMap.get(row.event_id)?.title || "Event",
          eventCity: eventMap.get(row.event_id)?.city || null,
          ticketCode: ticketMap.get(row.ticket_id)?.ticket_code || null,
        }))
    : [];

  const payoutHistory = payouts
    .filter((payout) =>
      !selectedRecipient
        ? true
        : buildRecipientKey(payout.recipient_type, payout.user_id || null) === selectedRecipient.recipientKey,
    )
    .map((payout) => {
      const payoutLinks = links.filter((link) => link.payout_id === payout.id);
      return {
        id: payout.id,
        recipientType: payout.recipient_type,
        recipientLabel:
          payout.recipient_label ||
          recipientLabels[buildRecipientKey(payout.recipient_type, payout.user_id || null)] ||
          "Recipient",
        amount: toMoney(payout.amount),
        status: payout.status,
        method: payout.method,
        notes: payout.notes,
        createdAt: payout.created_at,
        paidAt: payout.paid_at,
        linkCount: payoutLinks.length,
        linkedAmount: toMoney(payoutLinks.reduce((sum, link) => sum + toMoney(link.amount), 0)),
      };
    });

  return {
    recipients: recipientSummaries,
    selectedRecipient,
    availableLedgerRows,
    payoutHistory,
  };
}

export async function createManualPayout({
  recipientType,
  recipientId,
  recipientLabel,
  amount,
  notes,
  ledgerIds,
  createdBy,
}: {
  recipientType: RecipientType;
  recipientId: string | null;
  recipientLabel: string | null;
  amount: number;
  notes: string | null;
  ledgerIds: string[];
  createdBy: string | null;
}) {
  if (!ledgerIds.length) {
    throw new Error("Select at least one ledger row.");
  }

  const { data: ledgerRows, error: ledgerError } = await supabaseAdmin
    .from("revenue_ledger")
    .select("id, recipient_type, recipient_id, amount, status, created_at")
    .in("id", ledgerIds)
    .order("created_at", { ascending: true });

  if (ledgerError) throw new Error(ledgerError.message);
  if ((ledgerRows || []).length !== ledgerIds.length) throw new Error("One or more ledger rows could not be loaded.");

  const { data: existingLinks, error: existingLinksError } = await supabaseAdmin
    .from("payout_ledger_links")
    .select("ledger_id, released_at, payouts(status)")
    .in("ledger_id", ledgerIds);

  if (existingLinksError) throw new Error(existingLinksError.message);

  for (const row of ledgerRows || []) {
    if (row.status !== "locked") {
      throw new Error("Only locked ledger rows can be included in a payout.");
    }
    if (row.recipient_type !== recipientType || (row.recipient_id || null) !== recipientId) {
      throw new Error("All selected ledger rows must belong to the same recipient.");
    }
  }

  const existingPayoutLinks = (existingLinks || []) as Array<{
    ledger_id: string;
    released_at: string | null;
    payouts: { status?: PayoutStatus } | Array<{ status?: PayoutStatus }> | null;
  }>;

  const activeExistingLinks = existingPayoutLinks.filter((link) => {
    const status = Array.isArray(link.payouts) ? link.payouts[0]?.status : link.payouts?.status;
    return !link.released_at && status && isActivePayoutStatus(status as PayoutStatus);
  });
  if (activeExistingLinks.length) {
    throw new Error("One or more selected ledger rows are already linked to an active payout.");
  }

  const availableAmount = toMoney((ledgerRows || []).reduce((sum, row) => sum + toMoney(row.amount), 0));
  const payoutAmount = toMoney(amount);
  if (payoutAmount <= 0) throw new Error("Payout amount must be greater than zero.");
  if (payoutAmount > availableAmount) throw new Error("Payout amount exceeds the selected available balance.");

  const { data: payout, error: payoutError } = await supabaseAdmin
    .from("payouts")
    .insert({
      user_id: recipientId,
      recipient_type: recipientType,
      recipient_label: recipientLabel,
      amount: payoutAmount,
      status: "pending",
      method: "manual",
      notes,
      created_by: createdBy,
    })
    .select("id")
    .single();

  if (payoutError || !payout) {
    throw new Error(payoutError?.message || "Could not create payout.");
  }

  let remaining = payoutAmount;
  const linkPayload = [];
  for (const row of ledgerRows || []) {
    if (remaining <= 0) break;
    const appliedAmount = Math.min(toMoney(row.amount), remaining);
    if (appliedAmount <= 0) continue;
    linkPayload.push({
      payout_id: payout.id,
      ledger_id: row.id,
      amount: appliedAmount,
    });
    remaining = toMoney(remaining - appliedAmount);
  }

  if (remaining > 0) {
    throw new Error("Could not allocate the payout amount across the selected ledger rows.");
  }

  const { error: linkError } = await supabaseAdmin.from("payout_ledger_links").insert(linkPayload);
  if (linkError) throw new Error(linkError.message);

  return payout.id;
}

export async function updatePayoutStatus({
  payoutId,
  status,
}: {
  payoutId: string;
  status: PayoutStatus;
}) {
  const { data: payout, error: payoutError } = await supabaseAdmin
    .from("payouts")
    .select("id, status")
    .eq("id", payoutId)
    .maybeSingle();

  if (payoutError || !payout) {
    throw new Error(payoutError?.message || "Payout not found.");
  }

  if (status === "void") {
    if (payout.status !== "pending" && payout.status !== "failed") {
      throw new Error("Only pending or failed payouts can be voided safely.");
    }

    const [{ error: payoutUpdateError }, { error: releaseError }] = await Promise.all([
      supabaseAdmin.from("payouts").update({ status: "void", paid_at: null }).eq("id", payoutId),
      supabaseAdmin
        .from("payout_ledger_links")
        .update({ released_at: new Date().toISOString() })
        .eq("payout_id", payoutId)
        .is("released_at", null),
    ]);

    if (payoutUpdateError) throw new Error(payoutUpdateError.message);
    if (releaseError) throw new Error(releaseError.message);
    return;
  }

  if (status === "sent") {
    if (payout.status !== "pending") {
      throw new Error("Only pending payouts can be marked sent.");
    }
    const { error } = await supabaseAdmin
      .from("payouts")
      .update({ status: "sent", paid_at: new Date().toISOString() })
      .eq("id", payoutId);
    if (error) throw new Error(error.message);
    return;
  }

  if (status === "failed") {
    if (payout.status !== "pending") {
      throw new Error("Only pending payouts can be marked failed.");
    }
    const { error } = await supabaseAdmin.from("payouts").update({ status: "failed", paid_at: null }).eq("id", payoutId);
    if (error) throw new Error(error.message);
  }
}
