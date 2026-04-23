export type ActivitySourceKey = "evntszn_native" | "curator_network" | "partner" | "imported";
export type ActivitySourceLabel = "EVNTSZN Native" | "Curator Network" | "Partner" | "Imported signal";

export type ActivitySourceInput = {
  sourceType?: string | null;
  sourceLabel?: string | null;
  referenceType?: string | null;
  entityType?: string | null;
  metadata?: Record<string, unknown> | null;
};

const SOURCE_ALIASES: Array<{ pattern: RegExp; key: ActivitySourceKey; label: ActivitySourceLabel }> = [
  { pattern: /^(evntszn|native|evntszn_native)$/i, key: "evntszn_native", label: "EVNTSZN Native" },
  { pattern: /^(host|curator|curator_network)$/i, key: "curator_network", label: "Curator Network" },
  { pattern: /^(partner|independent_organizer|venue_partner)$/i, key: "partner", label: "Partner" },
  { pattern: /^(imported|external|ticketmaster|eventbrite)$/i, key: "imported", label: "Imported signal" },
];

export function normalizeActivitySource(input: ActivitySourceInput = {}) {
  const candidates = [
    input.sourceType,
    input.sourceLabel,
    typeof input.metadata?.source_type === "string" ? input.metadata.source_type : null,
    typeof input.metadata?.source === "string" ? input.metadata.source : null,
    input.referenceType,
    input.entityType,
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  for (const candidate of candidates) {
    for (const alias of SOURCE_ALIASES) {
      if (alias.pattern.test(candidate)) {
        return {
          sourceKey: alias.key,
          sourceLabel: alias.label,
          sourceIdentity: alias.key,
          sourceOrigin: candidate,
        };
      }
    }
  }

  return {
    sourceKey: "imported" as const,
    sourceLabel: "Imported signal" as const,
    sourceIdentity: "imported" as const,
    sourceOrigin: candidates[0] || null,
  };
}

export function buildActivitySourceMetadata(input: ActivitySourceInput = {}) {
  const normalized = normalizeActivitySource(input);
  return {
    source_type: normalized.sourceKey,
    source_label: normalized.sourceLabel,
    source_identity: normalized.sourceIdentity,
    source_origin: normalized.sourceOrigin,
  };
}
