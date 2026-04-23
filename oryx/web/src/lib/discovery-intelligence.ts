import { normalizeActivitySource, type ActivitySourceKey } from "@/lib/activity-source";
import { 
  classifyDiscoveryCityMaturity, 
  evaluateDiscoveryCityPromotion,
  getDiscoveryCityMaturity, 
  getDiscoveryCityPolicyProfile, 
  getDiscoveryNativeEvents, 
  normalizeDiscoveryCityKey,
  rankDiscoveryListings, 
  type DiscoveryCityAutomationIntelligence,
  type DiscoveryCityAutomationOverride,
  type DiscoveryCityAutomationStatus,
  type DiscoveryCityMaturityState, 
  type DiscoveryCityPolicyProfile,
  type DiscoveryCityPromotionEvaluation
} from "@/lib/discovery";
import { applyExternalDiscoveryControls } from "@/lib/external-discovery-controls";
import { searchEventbriteEvents } from "@/lib/eventbrite";
import { PUBLIC_CITIES } from "@/lib/public-cities";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { searchTicketmasterEvents } from "@/lib/ticketmaster";

type SourceBucketCounts = Record<ActivitySourceKey, number>;

type IntelligenceListing = {
  source: "evntszn" | "host" | "independent_organizer" | "ticketmaster" | "eventbrite";
  city: string | null;
  featured?: boolean;
  isPrimary?: boolean;
  listingPriority?: number;
  startAt?: string | null;
};

export type DiscoveryCityIntelligence = {
  city: string;
  citySlug: string;
  totalUsableInventory: number;
  sourceMix: Record<ActivitySourceKey, { count: number; share: number }>;
  maturityScore: number;
  maturityLabel: DiscoveryCityMaturityState;
  policy: DiscoveryCityPolicyProfile;
  policyReason: string;
  promotionEvaluation: DiscoveryCityPromotionEvaluation;
  automationStatus: DiscoveryCityAutomationStatus;
  automationIntelligence: DiscoveryCityAutomationIntelligence;
  trendDirection: "up" | "down" | "flat";
  trendDeltaPercent: number;
  momentumSourceMix: Record<ActivitySourceKey, { count: number; share: number }>;
  dominantMomentumSource: ActivitySourceKey | null;
  topSlots: Record<ActivitySourceKey, { count: number; share: number }>;
  nativeLifted: boolean;
  importedDominating: boolean;
  outcomeLabel: string;
};

export type DiscoveryIntelligenceSnapshot = {
  generatedAt: string;
  overallInventory: number;
  overallSourceMix: Record<ActivitySourceKey, { count: number; share: number }>;
  overallMomentumSourceMix: Record<ActivitySourceKey, { count: number; share: number }>;
  cityRows: DiscoveryCityIntelligence[];
};

function emptySourceCounts(): SourceBucketCounts {
  return {
    evntszn_native: 0,
    curator_network: 0,
    partner: 0,
    imported: 0,
  };
}

function toMix(counts: SourceBucketCounts) {
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
  return {
    evntszn_native: { count: counts.evntszn_native, share: total ? counts.evntszn_native / total : 0 },
    curator_network: { count: counts.curator_network, share: total ? counts.curator_network / total : 0 },
    partner: { count: counts.partner, share: total ? counts.partner / total : 0 },
    imported: { count: counts.imported, share: total ? counts.imported / total : 0 },
  };
}

function incrementSource(counts: SourceBucketCounts, key: ActivitySourceKey, amount = 1) {
  counts[key] += amount;
}

function toBucketKey(source: IntelligenceListing["source"]): ActivitySourceKey {
  switch (source) {
    case "evntszn":
      return "evntszn_native";
    case "host":
      return "curator_network";
    case "independent_organizer":
      return "partner";
    default:
      return "imported";
  }
}

function toSurfaceSource(key: ActivitySourceKey): "evntszn" | "host" | "independent_organizer" | "ticketmaster" {
  switch (key) {
    case "evntszn_native":
      return "evntszn";
    case "curator_network":
      return "host";
    case "partner":
      return "independent_organizer";
    default:
      return "ticketmaster";
  }
}

function getOutcomeLabel(input: {
  nativeLifted: boolean;
  importedDominating: boolean;
  maturityLabel: DiscoveryCityIntelligence["maturityLabel"];
  sourceMix: Record<ActivitySourceKey, { count: number; share: number }>;
}) {
  if (input.importedDominating) {
    return input.maturityLabel === "imported_fallback"
      ? "Imported inventory is still carrying this market."
      : "Imported fallback is still dominating the visible mix.";
  }
  if (input.nativeLifted) {
    return "Native and semi-native inventory is being lifted successfully.";
  }
  if (input.sourceMix.curator_network.count || input.sourceMix.partner.count) {
    return "Curator and Partner supply is visible, but still has room to rise.";
  }
  return "This city is ready for stronger EVNTSZN-owned supply.";
}

function getTrendDirection(current: number, previous: number): DiscoveryCityIntelligence["trendDirection"] {
  if (current > previous) return "up";
  if (current < previous) return "down";
  return "flat";
}

function toTrendDeltaPercent(current: number, previous: number) {
  if (!previous) return current ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export async function getDiscoveryIntelligenceSnapshot(): Promise<DiscoveryIntelligenceSnapshot> {
  const fourteenDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString();

  const [activityRes, citiesData, overridesRes] = await Promise.all([
    supabaseAdmin
      .from("evntszn_activity_events")
      .select("city, metadata, occurred_at")
      .not("city", "is", null)
      .gte("occurred_at", fourteenDaysAgo)
      .limit(5000),
    Promise.all(
      PUBLIC_CITIES.map(async (city) => {
        const [native, ticketmaster, eventbrite] = await Promise.all([
          getDiscoveryNativeEvents({ city: city.name, limit: 36 }),
          searchTicketmasterEvents({ city: city.name, size: 16 }).catch(() => []),
          searchEventbriteEvents({ city: city.name, size: 16 }).catch(() => []),
        ]);

        const moderatedTicketmaster = await applyExternalDiscoveryControls("ticketmaster", ticketmaster);
        return {
          city,
          native: native.events,
          ticketmaster: moderatedTicketmaster,
          eventbrite,
        };
      }),
    ),
    supabaseAdmin.from("city_automation_overrides").select("*"),
  ]);

  if (activityRes.error) {
    throw new Error(activityRes.error.message);
  }

  const overridesMap = new Map<string, DiscoveryCityAutomationOverride>(
    (overridesRes.data || []).map((row) => [row.city_key, row as DiscoveryCityAutomationOverride])
  );
  const { data: persistedSnapshots, error: persistedSnapshotsError } = await supabaseAdmin
    .from("city_automation_snapshots")
    .select("*");

  if (persistedSnapshotsError && persistedSnapshotsError.code !== "42P01" && persistedSnapshotsError.code !== "PGRST205") {
    throw new Error(persistedSnapshotsError.message);
  }

  const snapshotMap = new Map<string, Record<string, unknown>>(
    ((persistedSnapshots || []) as Array<Record<string, unknown>>).map((row) => [String(row.city_key || ""), row]),
  );

  const recentActivity = (activityRes.data || []) as Array<{
    city: string | null;
    metadata?: Record<string, unknown> | null;
    occurred_at: string;
  }>;

  const overallInventoryCounts = emptySourceCounts();
  const overallMomentumCounts = emptySourceCounts();

  const cityRows = citiesData.map((entry) => {
    const listings: IntelligenceListing[] = [
      ...entry.native.map((event) => ({
        source: event.source,
        city: event.city,
        featured: event.featured,
        isPrimary: event.isPrimary,
        listingPriority: event.listingPriority,
        startAt: event.startAt,
      })),
      ...entry.ticketmaster.map((event) => ({
        source: "ticketmaster" as const,
        city: event.city,
        startAt: event.startAt,
        isPrimary: false,
        listingPriority: -(event.priorityAdjustment || 0),
        featured: event.moderationStatus === "featured",
      })),
      ...entry.eventbrite.map((event) => ({
        source: "eventbrite" as const,
        city: event.city,
        startAt: event.startAt,
        isPrimary: false,
      })),
    ];

    const sourceCounts = emptySourceCounts();
    for (const listing of listings) {
      incrementSource(sourceCounts, toBucketKey(listing.source));
      incrementSource(overallInventoryCounts, toBucketKey(listing.source));
    }

    const ranked = rankDiscoveryListings(listings).slice(0, 8);
    const topCounts = emptySourceCounts();
    for (const listing of ranked) {
      incrementSource(topCounts, toBucketKey(listing.source));
    }

    const cityActivity = recentActivity.filter((row) => String(row.city || "").trim().toLowerCase() === entry.city.name.toLowerCase());
    const recentWindow = cityActivity.filter((row) => new Date(row.occurred_at).getTime() >= Date.now() - 1000 * 60 * 60 * 24 * 7);
    const previousWindow = cityActivity.filter((row) => {
      const ts = new Date(row.occurred_at).getTime();
      return ts < Date.now() - 1000 * 60 * 60 * 24 * 7 && ts >= Date.now() - 1000 * 60 * 60 * 24 * 14;
    });

    const momentumCounts = emptySourceCounts();
    for (const row of cityActivity) {
      const ts = new Date(row.occurred_at).getTime();
      if (ts < Date.now() - 1000 * 60 * 60 * 48) continue;
      const normalized = normalizeActivitySource({
        sourceType: typeof row.metadata?.source_type === "string" ? row.metadata.source_type : null,
        sourceLabel: typeof row.metadata?.source_label === "string" ? row.metadata.source_label : null,
        metadata: row.metadata || null,
      });
      incrementSource(momentumCounts, normalized.sourceKey);
      incrementSource(overallMomentumCounts, normalized.sourceKey);
    }

    const discoveryMaturity = getDiscoveryCityMaturity(entry.city.name, {
      evntszn: sourceCounts.evntszn_native,
      host: sourceCounts.curator_network,
      independent_organizer: sourceCounts.partner,
      ticketmaster: entry.ticketmaster.length,
      eventbrite: entry.eventbrite.length,
    });

    const sourceMix = toMix(sourceCounts);
    const topSlots = toMix(topCounts);
    const momentumSourceMix = toMix(momentumCounts);
    const classification = classifyDiscoveryCityMaturity({
      city: entry.city.name,
      sourceMix: {
        evntszn: sourceCounts.evntszn_native,
        host: sourceCounts.curator_network,
        independent_organizer: sourceCounts.partner,
        ticketmaster: entry.ticketmaster.length,
        eventbrite: entry.eventbrite.length,
      },
      trendDirection: getTrendDirection(recentWindow.length, previousWindow.length),
      topSlotMix: {
        evntszn: topCounts.evntszn_native,
        host: topCounts.curator_network,
        independent_organizer: topCounts.partner,
        ticketmaster: topCounts.imported,
      },
      momentumSourceMix: momentumCounts,
    });

    const cityKey = normalizeDiscoveryCityKey(entry.city.name);
    const cityOverride = overridesMap.get(cityKey);
    const persistedSnapshot = snapshotMap.get(cityKey);

    const policy = getDiscoveryCityPolicyProfile({
      city: entry.city.name,
      sourceMix: {
        evntszn: sourceCounts.evntszn_native,
        host: sourceCounts.curator_network,
        independent_organizer: sourceCounts.partner,
        ticketmaster: entry.ticketmaster.length,
        eventbrite: entry.eventbrite.length,
      },
      trendDirection: getTrendDirection(recentWindow.length, previousWindow.length),
      topSlotMix: {
        evntszn: topCounts.evntszn_native,
        host: topCounts.curator_network,
        independent_organizer: topCounts.partner,
        ticketmaster: topCounts.imported,
      },
      momentumSourceMix: momentumCounts,
      override: cityOverride,
    });
    const nativeInventoryShare = sourceMix.evntszn_native.share + sourceMix.curator_network.share + sourceMix.partner.share;
    const topNativeShare = topSlots.evntszn_native.share + topSlots.curator_network.share + topSlots.partner.share;
    const importedDominating = topSlots.imported.share >= 0.6;
    const nativeLifted = topNativeShare > nativeInventoryShare + 0.12;
    const dominantMomentumSource = (Object.entries(momentumCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null) as ActivitySourceKey | null;
    const maturityLabel = classification.state;
    const promotionEvaluation = evaluateDiscoveryCityPromotion({
      city: entry.city.name,
      currentState: maturityLabel,
      sourceMix: {
        evntszn: sourceCounts.evntszn_native,
        host: sourceCounts.curator_network,
        independent_organizer: sourceCounts.partner,
        ticketmaster: entry.ticketmaster.length,
        eventbrite: entry.eventbrite.length,
      },
      trendDirection: getTrendDirection(recentWindow.length, previousWindow.length),
      topSlotMix: {
        evntszn: topCounts.evntszn_native,
        host: topCounts.curator_network,
        independent_organizer: topCounts.partner,
        ticketmaster: topCounts.imported,
      },
      momentumSourceMix: momentumCounts,
    });

    return {
      city: entry.city.name,
      citySlug: entry.city.slug,
      totalUsableInventory: listings.length,
      sourceMix,
      maturityScore: discoveryMaturity,
      maturityLabel,
      policy,
      policyReason: classification.reason,
      promotionEvaluation,
      automationStatus: policy.automationStatus,
      automationIntelligence: {
        ...policy.automationIntelligence,
        lastEvaluatedAt: typeof persistedSnapshot?.last_evaluated_at === "string" ? persistedSnapshot.last_evaluated_at : null,
        nextEvaluationAt:
          typeof persistedSnapshot?.next_evaluation_at === "string"
            ? persistedSnapshot.next_evaluation_at
            : policy.automationIntelligence.nextEvaluationAt,
      },
      trendDirection: getTrendDirection(recentWindow.length, previousWindow.length),
      trendDeltaPercent: toTrendDeltaPercent(recentWindow.length, previousWindow.length),
      momentumSourceMix,
      dominantMomentumSource,
      topSlots,
      nativeLifted,
      importedDominating,
      outcomeLabel: getOutcomeLabel({
        nativeLifted,
        importedDominating,
        maturityLabel,
        sourceMix,
      }),
    } satisfies DiscoveryCityIntelligence;
  });

  return {
    generatedAt: new Date().toISOString(),
    overallInventory: cityRows.reduce((sum, row) => sum + row.totalUsableInventory, 0),
    overallSourceMix: toMix(overallInventoryCounts),
    overallMomentumSourceMix: toMix(overallMomentumCounts),
    cityRows: cityRows.sort((a, b) => b.maturityScore - a.maturityScore || b.totalUsableInventory - a.totalUsableInventory),
  };
}

export function getSourceMixLabel(key: ActivitySourceKey) {
  switch (key) {
    case "evntszn_native":
      return "EVNTSZN Native";
    case "curator_network":
      return "Curator Network";
    case "partner":
      return "Partner";
    default:
      return "Imported";
  }
}

export function getTopSourceFromMix(mix: Record<ActivitySourceKey, { count: number; share: number }>) {
  const top = Object.entries(mix).sort((a, b) => b[1].count - a[1].count)[0];
  if (!top || !top[1].count) return null;
  return {
    key: top[0] as ActivitySourceKey,
    label: getSourceMixLabel(top[0] as ActivitySourceKey),
    share: top[1].share,
  };
}

export function toDiscoveryWeightPreview(row: DiscoveryCityIntelligence) {
  const dominant = getTopSourceFromMix(row.topSlots);
  const maturityPercent = Math.round(row.maturityScore * 100);
  return {
    maturityPercent,
    dominantLabel: dominant?.label || "No dominant source yet",
    note: row.outcomeLabel,
    weightedNativeSource: toSurfaceSource("evntszn_native"),
  };
}
