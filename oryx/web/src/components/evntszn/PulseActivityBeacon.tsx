"use client";

import { useEffect } from "react";

function buildSessionKey(seed: string) {
  const key = `evntszn-pulse-session:${seed}`;
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  const next = `${seed}-${Math.random().toString(36).slice(2, 10)}`;
  window.sessionStorage.setItem(key, next);
  return next;
}

function getDeviceType() {
  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1100) return "tablet";
  return "desktop";
}

export default function PulseActivityBeacon({
  sourceType,
  city,
  areaLabel,
  referenceType,
  referenceId,
}: {
  sourceType:
    | "discover_view"
    | "discover_interaction"
    | "reserve_view"
    | "epl_view";
  city?: string | null;
  areaLabel?: string | null;
  referenceType?: string;
  referenceId?: string;
}) {
  useEffect(() => {
    const sessionKey = buildSessionKey(sourceType);
    void fetch("/api/pulse/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceType,
        city,
        areaLabel,
        referenceType,
        referenceId,
        sessionKey,
        deviceType: getDeviceType(),
      }),
    }).catch(() => undefined);
  }, [areaLabel, city, referenceId, referenceType, sourceType]);

  return null;
}
