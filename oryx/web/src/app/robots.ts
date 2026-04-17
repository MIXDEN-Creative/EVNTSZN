// src/app/robots.ts
import type { MetadataRoute } from "next";
import { getWebOrigin } from "@/lib/domains";

export default function robots(): MetadataRoute.Robots {
  const origin = getWebOrigin();

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/events", "/events/", "/baltimore", "/dc", "/privacy", "/terms", "/refund-policy", "/liability-notice", "/reserve", "/crew", "/link", "/partners", "/epl", "/epl/schedule", "/epl/teams"], // Added new routes, removed old cities
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
