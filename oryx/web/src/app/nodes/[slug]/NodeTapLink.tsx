"use client";

import type { MouseEvent, ReactNode } from "react";

function getSessionKey(slug: string) {
  const key = `evntszn-node-session:${slug}`;
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  const next = `${slug}-${Math.random().toString(36).slice(2, 10)}`;
  window.sessionStorage.setItem(key, next);
  return next;
}

export default function NodeTapLink({
  slug,
  href,
  city,
  className,
  children,
}: {
  slug: string;
  href: string;
  city?: string | null;
  className?: string;
  children: ReactNode;
}) {
  async function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    const sessionKey = getSessionKey(slug);
    const width = window.innerWidth;

    await Promise.race([
      fetch(`/api/evntszn/nodes/${slug}/interactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interactionType: "tap",
          sessionKey,
          source: "node_cta",
          city,
          deviceType: width < 768 ? "mobile" : width < 1100 ? "tablet" : "desktop",
        }),
      }).catch(() => undefined),
      new Promise((resolve) => window.setTimeout(resolve, 180)),
    ]);

    window.location.href = href;
  }

  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
