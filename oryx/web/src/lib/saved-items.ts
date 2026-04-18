export const SAVED_ITEM_ENTITY_TYPES = [
  "event",
  "venue",
  "reserve",
  "epl_city",
  "epl_team",
  "link",
  "node",
] as const;

export const SAVED_ITEM_INTENTS = ["save", "watch", "plan"] as const;

export type SavedItemEntityType = (typeof SAVED_ITEM_ENTITY_TYPES)[number];
export type SavedItemIntent = (typeof SAVED_ITEM_INTENTS)[number];

export type SavedItemRecord = {
  id?: string;
  intent: SavedItemIntent;
  entityType: SavedItemEntityType;
  entityKey: string;
  title: string;
  href: string;
  city?: string | null;
  state?: string | null;
  startsAt?: string | null;
  metadata?: Record<string, unknown>;
  createdAt?: string;
};

export function buildSavedItemFingerprint(input: Pick<SavedItemRecord, "intent" | "entityType" | "entityKey">) {
  return `${input.intent}:${input.entityType}:${input.entityKey}`;
}

export function normalizeSavedItems(input: unknown): SavedItemRecord[] {
  if (!Array.isArray(input)) return [];
  return input
    .map<SavedItemRecord | null>((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const record = entry as Record<string, unknown>;
      const intent = String(record.intent || "").trim().toLowerCase() as SavedItemIntent;
      const entityType = String(record.entityType || record.entity_type || "").trim().toLowerCase() as SavedItemEntityType;
      const entityKey = String(record.entityKey || record.entity_key || "").trim();
      if (!entityKey || !SAVED_ITEM_INTENTS.includes(intent) || !SAVED_ITEM_ENTITY_TYPES.includes(entityType)) {
        return null;
      }
      const normalized: SavedItemRecord = {
        id: record.id ? String(record.id) : undefined,
        intent,
        entityType,
        entityKey,
        title: String(record.title || "Saved item"),
        href: String(record.href || "/"),
        city: record.city ? String(record.city) : null,
        state: record.state ? String(record.state) : null,
        startsAt: record.startsAt || record.starts_at ? String(record.startsAt || record.starts_at) : null,
        metadata: typeof record.metadata === "object" && record.metadata ? (record.metadata as Record<string, unknown>) : {},
        createdAt: record.createdAt || record.created_at ? String(record.createdAt || record.created_at) : undefined,
      };
      return normalized;
    })
    .filter((value): value is SavedItemRecord => value !== null);
}

export function sortSavedItems(items: SavedItemRecord[]) {
  return [...items].sort((left, right) => {
    const leftTime = left.startsAt ? new Date(left.startsAt).getTime() : 0;
    const rightTime = right.startsAt ? new Date(right.startsAt).getTime() : 0;
    if (leftTime !== rightTime) return leftTime - rightTime;
    return (right.createdAt || "").localeCompare(left.createdAt || "");
  });
}
