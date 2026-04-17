import { createPerformanceAlertWorkItem } from "@/lib/internal-os";
import { roundUsd } from "@/lib/money";
import { supabaseAdmin } from "@/lib/supabase-admin";

type EntityType = "host" | "organizer" | "venue" | "reserve" | "patience";

type MetricDetail = {
  key: string;
  label: string;
  weight: number;
  value: number;
  score: number;
  available: boolean;
  benchmarkValue?: number | null;
};

type PerformanceSnapshot = {
  entityType: EntityType;
  entityId: string;
  score: number;
  trend: number;
  benchmarkScore: number;
  breakdown: {
    weightedScore: number;
    availableWeight: number;
    metrics: MetricDetail[];
    totals?: Record<string, unknown>;
  };
  lastUpdatedAt: string;
};

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value * 100) / 100));
}

function safePercent(numerator: number, denominator: number) {
  if (!denominator) return null;
  return clampScore((numerator / denominator) * 100);
}

function normalizeAgainstBenchmark(value: number, benchmark: number) {
  if (benchmark <= 0) return null;
  return clampScore((value / benchmark) * 100);
}

function average(values: number[]) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function uniqueCount(values: Array<string | null | undefined>) {
  return new Set(values.filter(Boolean)).size;
}

async function readAverageScore(entityType: EntityType, excludeEntityId?: string) {
  let query = supabaseAdmin
    .from("performance_scores")
    .select("score")
    .eq("entity_type", entityType);

  if (excludeEntityId) {
    query = query.neq("entity_id", excludeEntityId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const values = (data || []).map((row) => Number(row.score || 0)).filter((value) => Number.isFinite(value));
  return average(values) ?? 0;
}

async function persistPerformanceMetrics(entityType: EntityType, entityId: string, metrics: MetricDetail[]) {
  if (!metrics.length) return;
  const payload = metrics
    .filter((metric) => metric.available)
    .map((metric) => ({
      entity_type: entityType,
      entity_id: entityId,
      metric_key: metric.key,
      metric_value: roundUsd(metric.value),
    }));

  if (!payload.length) return;

  const { error } = await supabaseAdmin.from("performance_metrics").insert(payload);
  if (error) {
    throw new Error(error.message);
  }
}

async function upsertPerformanceScore(snapshot: PerformanceSnapshot) {
  const { data: previousRow, error: previousError } = await supabaseAdmin
    .from("performance_scores")
    .select("id, score")
    .eq("entity_type", snapshot.entityType)
    .eq("entity_id", snapshot.entityId)
    .maybeSingle();

  if (previousError) throw new Error(previousError.message);

  const trend = clampScore(snapshot.score - Number(previousRow?.score || 0));
  const payload = {
    entity_type: snapshot.entityType,
    entity_id: snapshot.entityId,
    score: snapshot.score,
    trend,
    breakdown: {
      ...snapshot.breakdown,
      benchmarkScore: snapshot.benchmarkScore,
    },
    last_updated_at: snapshot.lastUpdatedAt,
  };

  const { error } = await supabaseAdmin
    .from("performance_scores")
    .upsert(payload, { onConflict: "entity_type,entity_id" });

  if (error) throw new Error(error.message);

  snapshot.trend = trend;
}

async function maybeTriggerAlerts(snapshot: PerformanceSnapshot) {
  const activationMetric = snapshot.breakdown.metrics.find((metric) => metric.key === "activation");
  const retentionMetric = snapshot.breakdown.metrics.find((metric) => metric.key === "retention");

  if (snapshot.score < 60) {
    await createPerformanceAlertWorkItem({
      entityType: snapshot.entityType,
      entityId: snapshot.entityId,
      title: `${snapshot.entityType.toUpperCase()} score below 60`,
      score: snapshot.score,
      priority: "critical",
      payload: { threshold: 60, metric: "score" },
    });
  }

  if ((activationMetric?.value ?? 100) < 50) {
    await createPerformanceAlertWorkItem({
      entityType: snapshot.entityType,
      entityId: snapshot.entityId,
      title: `${snapshot.entityType.toUpperCase()} activation below 50%`,
      score: snapshot.score,
      priority: "high",
      payload: { threshold: 50, metric: "activation", metricValue: activationMetric?.value ?? 0 },
    });
  }

  if ((retentionMetric?.value ?? 100) < 60) {
    await createPerformanceAlertWorkItem({
      entityType: snapshot.entityType,
      entityId: snapshot.entityId,
      title: `${snapshot.entityType.toUpperCase()} retention below 60%`,
      score: snapshot.score,
      priority: "high",
      payload: { threshold: 60, metric: "retention", metricValue: retentionMetric?.value ?? 0 },
    });
  }
}

function buildSnapshot(
  entityType: EntityType,
  entityId: string,
  metrics: MetricDetail[],
  benchmarkScore: number,
  totals?: Record<string, unknown>,
): PerformanceSnapshot {
  const availableWeight = metrics.reduce((sum, metric) => sum + (metric.available ? metric.weight : 0), 0);
  const weightedValue = metrics.reduce((sum, metric) => {
    if (!metric.available) return sum;
    return sum + metric.score * metric.weight;
  }, 0);
  const score = availableWeight > 0 ? clampScore(weightedValue / availableWeight) : 0;

  return {
    entityType,
    entityId,
    score,
    trend: 0,
    benchmarkScore: clampScore(benchmarkScore),
    breakdown: {
      weightedScore: score,
      availableWeight,
      metrics,
      totals,
    },
    lastUpdatedAt: new Date().toISOString(),
  };
}

async function calculateHostOrOrganizerScore(entityType: "host" | "organizer", userId: string) {
  const [{ data: events }, { data: ticketTypes }, { data: orders }, { data: conversions }, { data: pulses }] =
    await Promise.all([
      supabaseAdmin
        .from("evntszn_events")
        .select("id, capacity, check_in_count, status, created_at")
        .eq("organizer_user_id", userId),
      supabaseAdmin
        .from("evntszn_ticket_types")
        .select("id, event_id, quantity_total, quantity_sold")
        .in(
          "event_id",
          (
            (
              await supabaseAdmin
                .from("evntszn_events")
                .select("id")
                .eq("organizer_user_id", userId)
            ).data || []
          ).map((row) => row.id),
        ),
      supabaseAdmin
        .from("evntszn_ticket_orders")
        .select("id, event_id, purchaser_email, amount_total_usd, status")
        .eq("status", "paid")
        .in(
          "event_id",
          (
            (
              await supabaseAdmin
                .from("evntszn_events")
                .select("id")
                .eq("organizer_user_id", userId)
            ).data || []
          ).map((row) => row.id),
        ),
      supabaseAdmin
        .from("evntszn_link_conversions")
        .select("id, attributed_order_count, attributed_ticket_count, attributed_gross_revenue_usd")
        .eq("link_owner_user_id", userId)
        .eq("attribution_status", "attributed"),
      supabaseAdmin
        .from("evntszn_event_pulse_votes")
        .select("event_id, energy_level, crowd_density, music_vibe, bar_activity")
        .in(
          "event_id",
          (
            (
              await supabaseAdmin
                .from("evntszn_events")
                .select("id")
                .eq("organizer_user_id", userId)
            ).data || []
          ).map((row) => row.id),
        ),
    ]);

  const eventRows = events || [];
  const eventIds = eventRows.map((row) => row.id);
  const ticketRows = (ticketTypes || []).filter((row) => eventIds.includes(row.event_id));
  const orderRows = (orders || []).filter((row) => eventIds.includes(row.event_id));
  const pulseRows = (pulses || []).filter((row) => eventIds.includes(row.event_id));

  const totalCapacity = eventRows.reduce((sum, row) => sum + Number(row.capacity || 0), 0);
  const totalCheckIns = eventRows.reduce((sum, row) => sum + Number(row.check_in_count || 0), 0);
  const totalTicketInventory = ticketRows.reduce((sum, row) => sum + Number(row.quantity_total || 0), 0);
  const totalTicketsSold = ticketRows.reduce((sum, row) => sum + Number(row.quantity_sold || 0), 0);
  const totalRevenueUsd = orderRows.reduce((sum, row) => sum + Number(row.amount_total_usd || 0), 0);
  const repeatPurchasers = uniqueCount(orderRows.map((row) => row.purchaser_email));
  const repeatRate = orderRows.length > 0 ? clampScore(((orderRows.length - repeatPurchasers) / orderRows.length) * 100) : null;
  const pulseAverage = average(
    pulseRows.map((row) => average([row.energy_level, row.crowd_density, row.music_vibe, row.bar_activity]) || 0),
  );

  const attendanceRate = safePercent(totalCheckIns, totalCapacity || totalTicketsSold);
  const sellThroughRate = safePercent(totalTicketsSold, totalTicketInventory);
  const noShowRate = totalTicketsSold > 0 ? clampScore(100 - (attendanceRate ?? 0)) : null;
  const opsCoverage = eventRows.length
    ? clampScore(
        (eventRows.filter((row) => row.status === "published").length / Math.max(eventRows.length, 1)) * 100,
      )
    : null;
  const referralTickets = (conversions || []).reduce((sum, row) => sum + Number(row.attributed_ticket_count || 0), 0);
  const benchmarkRevenueUsd = Math.max(await readAverageScore(entityType, userId), 1);

  const metrics: MetricDetail[] = entityType === "host"
    ? [
        { key: "attendance", label: "Attendance", weight: 20, value: attendanceRate ?? 0, score: attendanceRate ?? 0, available: attendanceRate !== null },
        { key: "sell_through", label: "Sell-through", weight: 15, value: sellThroughRate ?? 0, score: sellThroughRate ?? 0, available: sellThroughRate !== null },
        { key: "revenue", label: "Revenue", weight: 15, value: totalRevenueUsd, score: normalizeAgainstBenchmark(totalRevenueUsd, benchmarkRevenueUsd) ?? 0, available: totalRevenueUsd > 0, benchmarkValue: benchmarkRevenueUsd },
        { key: "referrals", label: "Referrals", weight: 10, value: referralTickets, score: clampScore(referralTickets * 5), available: referralTickets > 0 },
        { key: "repeat", label: "Repeat", weight: 10, value: repeatRate ?? 0, score: repeatRate ?? 0, available: repeatRate !== null },
        { key: "rating", label: "Rating", weight: 10, value: pulseAverage ?? 0, score: pulseAverage !== null ? clampScore((pulseAverage / 10) * 100) : 0, available: pulseAverage !== null },
        { key: "no_show", label: "No-show control", weight: 10, value: noShowRate ?? 0, score: noShowRate !== null ? clampScore(100 - noShowRate) : 0, available: noShowRate !== null },
        { key: "ops", label: "Ops discipline", weight: 10, value: opsCoverage ?? 0, score: opsCoverage ?? 0, available: opsCoverage !== null },
      ]
    : [
        { key: "attendance", label: "Attendance", weight: 20, value: attendanceRate ?? 0, score: attendanceRate ?? 0, available: attendanceRate !== null },
        { key: "frequency", label: "Frequency", weight: 15, value: eventRows.length, score: clampScore(eventRows.length * 10), available: eventRows.length > 0 },
        { key: "usage", label: "Platform usage", weight: 15, value: ticketRows.length, score: clampScore(ticketRows.length * 8), available: ticketRows.length > 0 },
        { key: "revenue_stability", label: "Revenue stability", weight: 15, value: totalRevenueUsd, score: normalizeAgainstBenchmark(totalRevenueUsd, benchmarkRevenueUsd) ?? 0, available: totalRevenueUsd > 0, benchmarkValue: benchmarkRevenueUsd },
        { key: "referrals", label: "Referrals", weight: 10, value: referralTickets, score: clampScore(referralTickets * 5), available: referralTickets > 0 },
        { key: "repeat", label: "Repeat", weight: 10, value: repeatRate ?? 0, score: repeatRate ?? 0, available: repeatRate !== null },
        { key: "activation", label: "Activation", weight: 15, value: opsCoverage ?? 0, score: opsCoverage ?? 0, available: opsCoverage !== null },
      ];

  return buildSnapshot(entityType, userId, metrics, await readAverageScore(entityType, userId), {
    events: eventRows.length,
    ticketRevenueUsd: totalRevenueUsd,
    ticketsSold: totalTicketsSold,
    checkIns: totalCheckIns,
  });
}

async function calculateVenueScore(userId: string) {
  const { data: venues, error: venueError } = await supabaseAdmin
    .from("evntszn_venues")
    .select("id, slug, is_active")
    .eq("owner_user_id", userId);
  if (venueError) throw new Error(venueError.message);

  const venueIds = (venues || []).map((venue) => venue.id);
  if (!venueIds.length) {
    return buildSnapshot("venue", userId, [], await readAverageScore("venue", userId), { venues: 0 });
  }

  const [{ data: events }, { data: orders }, { data: reserveVenues }, { data: bookings }] = await Promise.all([
    supabaseAdmin.from("evntszn_events").select("id, venue_id, organizer_user_id, capacity, check_in_count, scanner_status").in("venue_id", venueIds),
    supabaseAdmin.from("evntszn_ticket_orders").select("id, event_id, amount_total_usd, status").eq("status", "paid"),
    supabaseAdmin.from("evntszn_reserve_venues").select("id, venue_id, is_active").in("venue_id", venueIds),
    supabaseAdmin.from("evntszn_reserve_bookings").select("id, reserve_venue_id, status, guest_email"),
  ]);

  const eventRows = events || [];
  const eventIds = eventRows.map((event) => event.id);
  const paidOrders = (orders || []).filter((order) => eventIds.includes(order.event_id));
  const reserveVenueIds = (reserveVenues || []).map((row) => row.id);
  const venueBookings = (bookings || []).filter((row) => reserveVenueIds.includes(row.reserve_venue_id));

  const eventsMetric = clampScore(eventRows.length * 10);
  const utilization = safePercent(
    eventRows.reduce((sum, row) => sum + Number(row.check_in_count || 0), 0),
    eventRows.reduce((sum, row) => sum + Number(row.capacity || 0), 0),
  );
  const revenueUsd = paidOrders.reduce((sum, row) => sum + Number(row.amount_total_usd || 0), 0);
  const repeatBookings = uniqueCount(venueBookings.map((row) => row.guest_email));
  const repeatRate = venueBookings.length
    ? clampScore(((venueBookings.length - repeatBookings) / venueBookings.length) * 100)
    : null;
  const readiness = eventRows.length
    ? clampScore((eventRows.filter((row) => row.scanner_status === "ready").length / eventRows.length) * 100)
    : null;

  const metrics: MetricDetail[] = [
    { key: "events", label: "Events", weight: 20, value: eventRows.length, score: eventsMetric, available: eventRows.length > 0 },
    { key: "utilization", label: "Utilization", weight: 20, value: utilization ?? 0, score: utilization ?? 0, available: utilization !== null },
    { key: "revenue", label: "Revenue", weight: 15, value: revenueUsd, score: normalizeAgainstBenchmark(revenueUsd, Math.max(await readAverageScore("venue", userId), 1)) ?? 0, available: revenueUsd > 0 },
    { key: "repeat_bookings", label: "Repeat bookings", weight: 15, value: repeatRate ?? 0, score: repeatRate ?? 0, available: repeatRate !== null },
    { key: "rating", label: "Guest quality", weight: 15, value: repeatRate ?? 0, score: repeatRate ?? 0, available: repeatRate !== null },
    { key: "readiness", label: "Readiness", weight: 15, value: readiness ?? 0, score: readiness ?? 0, available: readiness !== null },
  ];

  return buildSnapshot("venue", userId, metrics, await readAverageScore("venue", userId), {
    venues: venueIds.length,
    events: eventRows.length,
    revenueUsd,
    reserveBookings: venueBookings.length,
  });
}

async function calculateReserveScore(userId: string) {
  const { data: reserveRows, error: reserveError } = await supabaseAdmin
    .from("evntszn_reserve_venues")
    .select("id, venue_id, is_active, evntszn_venues!inner(owner_user_id)")
    .eq("evntszn_venues.owner_user_id", userId);
  if (reserveError) throw new Error(reserveError.message);

  const reserveVenueIds = (reserveRows || []).map((row) => row.id);
  if (!reserveVenueIds.length) {
    return buildSnapshot("reserve", userId, [], await readAverageScore("reserve", userId), { reserveVenues: 0 });
  }

  const [{ data: slots }, { data: bookings }] = await Promise.all([
    supabaseAdmin.from("evntszn_reserve_slots").select("id, reserve_venue_id, capacity_limit, is_active").in("reserve_venue_id", reserveVenueIds),
    supabaseAdmin.from("evntszn_reserve_bookings").select("id, reserve_venue_id, status, guest_email, created_at").in("reserve_venue_id", reserveVenueIds),
  ]);

  const slotCapacity = (slots || []).reduce((sum, row) => sum + Number(row.capacity_limit || 0), 0);
  const bookingRows = bookings || [];
  const activeBookings = bookingRows.filter((row) => row.status !== "cancelled").length;
  const checkedInBookings = bookingRows.filter((row) => row.status === "checked_in").length;
  const fill = safePercent(activeBookings, slotCapacity || activeBookings);
  const attendance = safePercent(checkedInBookings, activeBookings);
  const repeatGuests = uniqueCount(bookingRows.map((row) => row.guest_email));
  const repeat = bookingRows.length ? clampScore(((bookingRows.length - repeatGuests) / bookingRows.length) * 100) : null;
  const speed = bookingRows.length
    ? clampScore(
        bookingRows.filter((row) => Date.now() - new Date(row.created_at).getTime() <= 1000 * 60 * 60 * 24 * 7).length /
          bookingRows.length *
          100,
      )
    : null;

  const metrics: MetricDetail[] = [
    { key: "fill", label: "Fill", weight: 25, value: fill ?? 0, score: fill ?? 0, available: fill !== null },
    { key: "attendance", label: "Attendance", weight: 20, value: attendance ?? 0, score: attendance ?? 0, available: attendance !== null },
    { key: "revenue", label: "Revenue", weight: 15, value: 0, score: 0, available: false },
    { key: "repeat", label: "Repeat", weight: 15, value: repeat ?? 0, score: repeat ?? 0, available: repeat !== null },
    { key: "cross_conversion", label: "Cross conversion", weight: 15, value: 0, score: 0, available: false },
    { key: "speed", label: "Speed", weight: 10, value: speed ?? 0, score: speed ?? 0, available: speed !== null },
  ];

  return buildSnapshot("reserve", userId, metrics, await readAverageScore("reserve", userId), {
    reserveVenues: reserveVenueIds.length,
    bookings: bookingRows.length,
    activeBookings,
    checkedInBookings,
  });
}

async function calculatePatienceScore() {
  const [{ data: applications }, { data: programs }, { data: sponsorAccounts }, { data: workItems }] = await Promise.all([
    supabaseAdmin.from("evntszn_applications").select("id, status, submitted_at"),
    supabaseAdmin.from("evntszn_program_members").select("id, status, activation_readiness"),
    supabaseAdmin.from("evntszn_sponsor_accounts").select("id, activation_status, status"),
    supabaseAdmin.from("internal_work_items").select("id, status, created_at, updated_at"),
  ]);

  const acquisition = clampScore((applications || []).filter((row) => {
    const submittedAt = row.submitted_at ? new Date(row.submitted_at).getTime() : 0;
    return submittedAt >= Date.now() - 1000 * 60 * 60 * 24 * 30;
  }).length * 5);

  const activationDenominator = (programs || []).length + (sponsorAccounts || []).length;
  const activationNumerator =
    (programs || []).filter((row) => row.activation_readiness === "active" || row.status === "active").length +
    (sponsorAccounts || []).filter((row) => row.activation_status === "active").length;
  const activation = safePercent(activationNumerator, activationDenominator);

  const revenueImpact = clampScore(
    ((await readAverageScore("host")) + (await readAverageScore("organizer")) + (await readAverageScore("venue")) + (await readAverageScore("reserve"))) / 4,
  );

  const retention = safePercent(
    (programs || []).filter((row) => row.status === "active").length +
      (sponsorAccounts || []).filter((row) => row.activation_status === "active").length,
    activationDenominator,
  );

  const pipelineDiscipline = (workItems || []).length
    ? clampScore(
        ((workItems || []).filter((row) => row.status === "completed" || row.status === "in_progress").length / (workItems || []).length) * 100,
      )
    : null;

  const metrics: MetricDetail[] = [
    { key: "acquisition", label: "Acquisition", weight: 20, value: acquisition, score: acquisition, available: true },
    { key: "activation", label: "Activation", weight: 20, value: activation ?? 0, score: activation ?? 0, available: activation !== null },
    { key: "revenue_impact", label: "Revenue impact", weight: 20, value: revenueImpact, score: revenueImpact, available: true },
    { key: "retention", label: "Retention", weight: 20, value: retention ?? 0, score: retention ?? 0, available: retention !== null },
    { key: "pipeline_discipline", label: "Pipeline discipline", weight: 20, value: pipelineDiscipline ?? 0, score: pipelineDiscipline ?? 0, available: pipelineDiscipline !== null },
  ];

  return buildSnapshot("patience", "00000000-0000-0000-0000-000000000001", metrics, await readAverageScore("patience"), {
    applicationsLast30d: (applications || []).length,
    activePrograms: (programs || []).filter((row) => row.status === "active").length,
    activeSponsors: (sponsorAccounts || []).filter((row) => row.activation_status === "active").length,
    openWorkItems: (workItems || []).filter((row) => row.status === "open").length,
  });
}

export async function refreshPerformanceSnapshot(scope: EntityType, entityId: string) {
  const snapshot =
    scope === "host" || scope === "organizer"
      ? await calculateHostOrOrganizerScore(scope, entityId)
      : scope === "venue"
        ? await calculateVenueScore(entityId)
        : scope === "reserve"
          ? await calculateReserveScore(entityId)
          : await calculatePatienceScore();

  await persistPerformanceMetrics(snapshot.entityType, snapshot.entityId, snapshot.breakdown.metrics);
  await upsertPerformanceScore(snapshot);
  await maybeTriggerAlerts(snapshot);
  return snapshot;
}

export async function getPerformanceSnapshot(scope: EntityType, entityId: string, options?: { force?: boolean }) {
  const { data: existing, error } = await supabaseAdmin
    .from("performance_scores")
    .select("score, breakdown, trend, last_updated_at")
    .eq("entity_type", scope)
    .eq("entity_id", scope === "patience" ? "00000000-0000-0000-0000-000000000001" : entityId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  const isStale =
    !existing?.last_updated_at ||
    Date.now() - new Date(existing.last_updated_at).getTime() > 1000 * 60 * 60 * 24;

  if (options?.force || !existing || isStale) {
    return refreshPerformanceSnapshot(scope, entityId);
  }

  const benchmarkScore = Number((existing.breakdown as Record<string, unknown> | null)?.benchmarkScore || 0);
  return {
    entityType: scope,
    entityId: scope === "patience" ? "00000000-0000-0000-0000-000000000001" : entityId,
    score: Number(existing.score || 0),
    trend: Number(existing.trend || 0),
    benchmarkScore,
    breakdown: (existing.breakdown as PerformanceSnapshot["breakdown"]) || { weightedScore: 0, availableWeight: 0, metrics: [] },
    lastUpdatedAt: existing.last_updated_at,
  } satisfies PerformanceSnapshot;
}
