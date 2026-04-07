import type { MetadataRoute } from "next";
import { getWebOrigin } from "@/lib/domains";

export default function robots(): MetadataRoute.Robots {
  const origin = getWebOrigin();

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/events", "/events/", "/baltimore", "/atlanta", "/newyork", "/miami", "/dc", "/privacy", "/terms", "/refund-policy", "/liability-notice"],
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
