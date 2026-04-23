import {
  normalizeDiscoveryCityKey,
  rankDiscoveryListings,
  type DiscoveryCityPolicyProfile,
  type DiscoverySurfaceSource,
} from "@/lib/discovery";
import { supabaseAdmin } from "@/lib/supabase-admin";

type RuntimePolicyRow = {
  city_key: string;
  metadata?: Record<string, unknown> | null;
};

type RankableListing = {
  source: DiscoverySurfaceSource;
  city?: string | null;
  featured?: boolean;
  isPrimary?: boolean;
  listingPriority?: number;
  startAt?: string | null;
};

export async function getStoredDiscoveryRuntimePolicyMap(cityKeys: string[]) {
  const normalizedKeys = [...new Set(cityKeys.map((cityKey) => normalizeDiscoveryCityKey(cityKey)).filter(Boolean))];
  if (!normalizedKeys.length) {
    return new Map<string, Pick<DiscoveryCityPolicyProfile, "nativeBoost" | "curatorBoost" | "partnerBoost" | "importedPenalty">>();
  }

  const { data, error } = await supabaseAdmin
    .from("city_automation_snapshots")
    .select("city_key, metadata")
    .in("city_key", normalizedKeys);

  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") {
      return new Map<string, Pick<DiscoveryCityPolicyProfile, "nativeBoost" | "curatorBoost" | "partnerBoost" | "importedPenalty">>();
    }
    throw new Error(error.message);
  }

  const policyMap = new Map<string, Pick<DiscoveryCityPolicyProfile, "nativeBoost" | "curatorBoost" | "partnerBoost" | "importedPenalty">>();

  for (const row of (data || []) as RuntimePolicyRow[]) {
    const metadata = row.metadata || {};
    const nativeBoost = typeof metadata.nativeBoost === "number" ? metadata.nativeBoost : null;
    const curatorBoost = typeof metadata.curatorBoost === "number" ? metadata.curatorBoost : nativeBoost;
    const partnerBoost = typeof metadata.partnerBoost === "number" ? metadata.partnerBoost : nativeBoost;
    const importedPenalty = typeof metadata.importedPenalty === "number" ? metadata.importedPenalty : null;

    if (nativeBoost === null || importedPenalty === null) continue;

    policyMap.set(row.city_key, {
      nativeBoost,
      curatorBoost: typeof curatorBoost === "number" ? curatorBoost : nativeBoost,
      partnerBoost: typeof partnerBoost === "number" ? partnerBoost : nativeBoost,
      importedPenalty,
    });
  }

  return policyMap;
}

export async function rankDiscoveryListingsWithStoredPolicies<T extends RankableListing>(items: T[]) {
  const policyMap = await getStoredDiscoveryRuntimePolicyMap(items.map((item) => item.city || ""));
  return rankDiscoveryListings(items, {
    cityPoliciesByKey: policyMap,
  });
}
