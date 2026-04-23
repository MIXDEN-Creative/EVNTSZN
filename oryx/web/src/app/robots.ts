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
        "/venue",
        "/venue/",
        "/venue-program",
        "/venue/pro",
        "/venue/pro-reserve",
        "/venue/agreement",
        "/tap-to-pour",
        "/nodes",
        "/hosts",
        "/curator",
        "/curator-network",
        "/organizer",
        "/partner",
        "/partners",
        "/partners/packages",
        "/sponsors",
        "/sponsors/apply",
        "/sponsors/packages",
        "/baltimore",
        "/dc",
        "/epl",
        "/epl/schedule",
        "/epl/teams",
        "/stayops",
        "/stayops/intake",
        "/stayops/confirmation",
        "/privacy",
        "/terms",
        "/refund-policy",
        "/liability-notice",
        "/crew",
        "/link",
        "/pulse",
      ],
      disallow: [
        "/account",
        "/scanner",
        "/epl/admin",
        "/ops",
        "/api/",
      ],
    },
    sitemap: `${origin}/sitemap.xml`,
    host: new URL(origin).host,
  };
}
