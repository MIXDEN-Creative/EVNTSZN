"use client";

import type { MouseEvent, ReactNode } from "react";

type TrackedEventLinkProps = {
  slug: string;
  eventId: string;
  href: string;
  className: string;
  children: ReactNode;
};

export default function TrackedEventLink({ slug, eventId, href, className, children }: TrackedEventLinkProps) {
  async function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    const targetPath = href;
    const sessionStorageKey = `evntszn-link-session:${slug}`;
    let sessionKey = "";

    if (typeof window !== "undefined") {
      sessionKey = window.sessionStorage.getItem(sessionStorageKey) || "";
      if (!sessionKey) {
        sessionKey = crypto.randomUUID();
        window.sessionStorage.setItem(sessionStorageKey, sessionKey);
      }
    }

    try {
      await Promise.race([
        fetch(`/api/evntszn/link/${slug}/click`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId,
            targetPath,
            sessionKey,
            source: "link_page",
          }),
          keepalive: true,
        }),
        new Promise((resolve) => setTimeout(resolve, 180)),
      ]);
    } catch {
      // Navigation should continue even if tracking fails.
    }

    window.location.href = href;
  }

  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
