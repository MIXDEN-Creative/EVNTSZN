// src/app/robots.ts
import type { MetadataRoute } from "next";
import { getWebOrigin } from "@/lib/domains";

export default function robots(): MetadataRoute.Robots {
  const origin = getWebOrigin();

  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/events",
        "/events/",
        "/city",
        "/city/",
        "/reserve",
        "/reserve/",
        "/baltimore",
        "/dc",
        "/privacy",
        "/terms",
        "/refund-policy",
        "/liability-notice",
        "/crew",
        "/link",
        "/partners",
        "/sponsors",
        "/pulse",
        "/epl",
        "/epl/schedule",
        "/epl/teams",
      ],
      disallow: [
        "/account",
        "/scanner",
        "/epl/admin",
        "/organizer",
        "/venue",
        "/ops",
        "/api/",
      ],
    },
    sitemap: `${origin}/sitemap.xml`,
    host: new URL(origin).host,
  };
}
