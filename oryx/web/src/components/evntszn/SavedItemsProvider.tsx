"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  buildSavedItemFingerprint,
  normalizeSavedItems,
  sortSavedItems,
  type SavedItemIntent,
  type SavedItemRecord,
} from "@/lib/saved-items";

const LOCAL_STORAGE_KEY = "evntszn:saved-items:v1";

type SavedItemsContextValue = {
  items: SavedItemRecord[];
  signedIn: boolean;
  loaded: boolean;
  isActive: (intent: SavedItemIntent, entityType: SavedItemRecord["entityType"], entityKey: string) => boolean;
  toggleItem: (item: SavedItemRecord) => Promise<boolean>;
  upsertItem: (item: SavedItemRecord) => Promise<void>;
  removeItem: (intent: SavedItemIntent, entityType: SavedItemRecord["entityType"], entityKey: string) => Promise<void>;
};

const SavedItemsContext = createContext<SavedItemsContextValue | null>(null);

function readLocalItems() {
  if (typeof window === "undefined") return [];
  try {
    return normalizeSavedItems(JSON.parse(window.localStorage.getItem(LOCAL_STORAGE_KEY) || "[]"));
  } catch {
    return [];
  }
}

function writeLocalItems(items: SavedItemRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
}

export default function SavedItemsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<SavedItemRecord[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const localItems = readLocalItems();
      setItems(sortSavedItems(localItems));
      try {
        const response = await fetch("/api/saved-items", { cache: "no-store" });
        const payload = (await response.json()) as { signedIn?: boolean; items?: SavedItemRecord[] };
        if (cancelled) return;
        if (response.ok && payload.signedIn) {
          const merged = mergeItems(normalizeSavedItems(payload.items), localItems);
          setItems(sortSavedItems(merged));
          setSignedIn(true);
        }
      } catch {
        // Keep local mode.
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function persistRemote(method: "POST" | "DELETE", body: Record<string, unknown>) {
    const response = await fetch("/api/saved-items", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error("Remote save failed.");
    }
  }

  const upsertItem = useCallback(async (item: SavedItemRecord) => {
    const nextItems = mergeItems([item], items);
    setItems(sortSavedItems(nextItems));
    writeLocalItems(nextItems);

    if (signedIn) {
      try {
        await persistRemote("POST", item);
      } catch {
        // Keep optimistic local state.
      }
    }
  }, [items, signedIn]);

  const removeItem = useCallback(async (intent: SavedItemIntent, entityType: SavedItemRecord["entityType"], entityKey: string) => {
    const nextItems = items.filter(
      (item) => buildSavedItemFingerprint(item) !== buildSavedItemFingerprint({ intent, entityType, entityKey }),
    );
    setItems(sortSavedItems(nextItems));
    writeLocalItems(nextItems);

    if (signedIn) {
      try {
        await persistRemote("DELETE", { intent, entityType, entityKey });
      } catch {
        // Keep optimistic local state.
      }
    }
  }, [items, signedIn]);

  const toggleItem = useCallback(async (item: SavedItemRecord) => {
    const active = items.some(
      (entry) => buildSavedItemFingerprint(entry) === buildSavedItemFingerprint(item),
    );
    if (active) {
      await removeItem(item.intent, item.entityType, item.entityKey);
      return false;
    }
    await upsertItem(item);
    return true;
  }, [items, removeItem, upsertItem]);

  const value = useMemo<SavedItemsContextValue>(
    () => ({
      items,
      signedIn,
      loaded,
      isActive: (intent, entityType, entityKey) =>
        items.some(
          (item) =>
            item.intent === intent &&
            item.entityType === entityType &&
            item.entityKey === entityKey,
        ),
      toggleItem,
      upsertItem,
      removeItem,
    }),
    [items, signedIn, loaded, toggleItem, upsertItem, removeItem],
  );

  return <SavedItemsContext.Provider value={value}>{children}</SavedItemsContext.Provider>;
}

export function useSavedItems() {
  const context = useContext(SavedItemsContext);
  if (!context) {
    throw new Error("useSavedItems must be used inside SavedItemsProvider.");
  }
  return context;
}

function mergeItems(primary: SavedItemRecord[], secondary: SavedItemRecord[]) {
  const map = new Map<string, SavedItemRecord>();
  for (const item of [...secondary, ...primary]) {
    map.set(buildSavedItemFingerprint(item), item);
  }
  return [...map.values()];
}
