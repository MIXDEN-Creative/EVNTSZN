"use client";

import { useEffect } from "react";
import SaveToggle from "@/components/evntszn/SaveToggle";
import ReturnTrigger from "@/components/evntszn/ReturnTrigger";
import { Button } from "@/components/ui/button";

function getSessionKey(nodeKey: string) {
  const key = `evntszn-node-session:${nodeKey}`;
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  const next = `${nodeKey}-${Math.random().toString(36).slice(2, 10)}`;
  window.sessionStorage.setItem(key, next);
  return next;
}

function getDeviceType() {
  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1100) return "tablet";
  return "desktop";
}

export default function NodeActionState({
  nodeSlug,
  nodeKey,
  city,
  areaLabel,
  title,
  actionLine,
  destinationHref,
  destinationLabel,
  entityType = "node",
  entityKey,
}: {
  nodeSlug: string;
  nodeKey: string;
  city?: string | null;
  areaLabel?: string | null;
  title: string;
  actionLine: string;
  destinationHref: string;
  destinationLabel: string;
  entityType?: "node" | "venue" | "reserve" | "link" | "event" | "epl_city";
  entityKey: string;
}) {
  useEffect(() => {
    const sessionKey = getSessionKey(nodeKey);
    const timer = window.setTimeout(() => {
      void fetch(`/api/evntszn/nodes/${nodeSlug}/interactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interactionType: "tap",
          sessionKey,
          source: "node_action_autoforward",
          city,
          areaLabel,
          deviceType: getDeviceType(),
          resolvedDestinationSlug: entityKey,
        }),
      }).catch(() => undefined);
      window.location.href = destinationHref;
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [areaLabel, city, destinationHref, entityKey, nodeKey, nodeSlug]);

  return (
    <section className="ev-public-section py-12">
      <div className="mx-auto max-w-3xl space-y-6 rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(162,89,255,0.12),rgba(255,255,255,0.03))] p-7 text-white shadow-[0_32px_80px_rgba(0,0,0,0.32)]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#d7c0ff]">
          {city ? `${city}${areaLabel ? ` · ${areaLabel}` : ""}` : "EVNTSZN Node"}
        </div>
        <h1 className="text-4xl font-black tracking-tight">{title}</h1>
        <p className="text-base leading-7 text-white/72">{actionLine}</p>

        <div className="flex flex-wrap gap-3">
          <a href={destinationHref}>
            <Button>{destinationLabel}</Button>
          </a>
          <SaveToggle
            item={{
              intent: "save",
              entityType,
              entityKey,
              title,
              href: destinationHref,
              city: city || null,
            }}
            inactiveLabel="Save this spot"
            activeLabel="Saved spot"
          />
          <SaveToggle
            item={{
              intent: "watch",
              entityType,
              entityKey: `${entityKey}:watch`,
              title: `${title} watch`,
              href: destinationHref,
              city: city || null,
            }}
            inactiveLabel="Watch this area"
            activeLabel="Watching"
          />
        </div>

        <ReturnTrigger href={destinationHref} />
      </div>
    </section>
  );
}
