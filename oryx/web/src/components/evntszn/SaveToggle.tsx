"use client";

import { useState } from "react";
import { useSavedItems } from "@/components/evntszn/SavedItemsProvider";
import { cn } from "@/lib/utils";
import type { SavedItemRecord } from "@/lib/saved-items";

export default function SaveToggle({
  item,
  activeLabel,
  inactiveLabel,
  className,
}: {
  item: SavedItemRecord;
  activeLabel?: string;
  inactiveLabel?: string;
  className?: string;
}) {
  const { isActive, toggleItem } = useSavedItems();
  const [busy, setBusy] = useState(false);
  const active = isActive(item.intent, item.entityType, item.entityKey);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await toggleItem(item);
        } finally {
          setBusy(false);
        }
      }}
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition",
        active
          ? "border-white bg-white text-black"
          : "border-white/15 bg-white/6 text-white/74 hover:bg-white/10",
        className,
      )}
    >
      {busy ? "Saving..." : active ? activeLabel || "Saved" : inactiveLabel || "Save"}
    </button>
  );
}
