"use client";

import { useEffect } from "react";
import type { EngagementEventType } from "@/lib/engagement";

export default function EngagementBeacon({
  eventType,
  city,
  referenceType,
  referenceId,
  dedupeKey,
  value,
  metadata,
}: {
  eventType: EngagementEventType;
  city?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  dedupeKey?: string | null;
  value?: number | null;
  metadata?: Record<string, unknown>;
}) {
  useEffect(() => {
    const dayKey = new Date().toISOString().slice(0, 10);
    const payload = {
      eventType,
      city: city || null,
      referenceType: referenceType || null,
      referenceId: referenceId || null,
      dedupeKey: `${dedupeKey || `${eventType}:${referenceType || "surface"}:${referenceId || "default"}`}:${dayKey}`,
      value: value ?? null,
      metadata: metadata || {},
    };

    void fetch("/api/engagement/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => null);
  }, [city, dedupeKey, eventType, metadata, referenceId, referenceType, value]);

  return null;
}
