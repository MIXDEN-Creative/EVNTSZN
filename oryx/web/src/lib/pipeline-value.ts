import { roundUsd } from "@/lib/money";

function parseMoneyToken(input: string) {
  const cleaned = input.trim().toLowerCase().replace(/[$,\s]/g, "");
  if (!cleaned) return null;

  const multiplier = cleaned.endsWith("m") ? 1_000_000 : cleaned.endsWith("k") ? 1_000 : 1;
  const numeric = Number(cleaned.replace(/[mk]$/g, ""));
  if (!Number.isFinite(numeric)) return null;
  return roundUsd(numeric * multiplier);
}

export function parseMoneyInput(input: string | null | undefined) {
  const value = String(input || "").trim();
  if (!value) return null;

  const range = value.split("-").map(parseMoneyToken).filter((token): token is number => token !== null);
  if (range.length >= 2) {
    return roundUsd((range[0] + range[1]) / 2);
  }

  const direct = parseMoneyToken(value);
  if (direct !== null) return direct;

  const looseMatch = value.match(/(\d+(?:\.\d+)?)(k|m)?/i);
  if (!looseMatch) return null;
  return parseMoneyToken(`${looseMatch[1]}${looseMatch[2] || ""}`);
}

export function estimateStayOpsValueUsd(expectedRevenue: string | null | undefined, serviceTier: string | null | undefined) {
  const revenue = parseMoneyInput(expectedRevenue);
  const tier = Number(serviceTier || 0);
  if (!revenue || !tier) return null;
  return roundUsd(revenue * (tier / 100));
}

export function estimateSponsorBudgetUsd(budgetRange: string | null | undefined) {
  const value = String(budgetRange || "").trim();
  if (!value) return null;

  const mappedRanges: Record<string, number> = {
    "$1k-$2.5k": 1750,
    "$2.5k-$5k": 3750,
    "$5k-$10k": 7500,
    "$10k+": 10000,
  };

  if (mappedRanges[value]) {
    return mappedRanges[value];
  }

  return parseMoneyInput(value);
}

export function normalizePipelineStatus(value: string | null | undefined) {
  const status = String(value || "").trim().toLowerCase();
  if (["new", "reviewing", "contacted", "converted", "closed"].includes(status)) {
    return status as "new" | "reviewing" | "contacted" | "converted" | "closed";
  }
  if (status === "inquiry") return "new";
  if (["paid", "pending", "won", "completed"].includes(status)) return "converted";
  if (["cancelled", "rejected", "archived"].includes(status)) return "closed";
  return "new";
}
