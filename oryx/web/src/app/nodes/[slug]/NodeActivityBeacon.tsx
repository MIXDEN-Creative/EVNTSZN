"use client";

import { useEffect } from "react";

function getSessionKey(slug: string) {
  const key = `evntszn-node-session:${slug}`;
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  const next = `${slug}-${Math.random().toString(36).slice(2, 10)}`;
  window.sessionStorage.setItem(key, next);
  return next;
}

export default function NodeActivityBeacon({ slug, city }: { slug: string; city?: string | null }) {
  useEffect(() => {
    const sessionKey = getSessionKey(slug);
    const width = window.innerWidth;
    void fetch(`/api/evntszn/nodes/${slug}/interactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        interactionType: "view",
        sessionKey,
        source: "node_page",
        city,
        deviceType: width < 768 ? "mobile" : width < 1100 ? "tablet" : "desktop",
      }),
    }).catch(() => undefined);
  }, [slug, city]);

  return null;
}
