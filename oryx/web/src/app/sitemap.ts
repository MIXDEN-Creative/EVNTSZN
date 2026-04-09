import type { MetadataRoute } from "next";
import { getWebOrigin } from "@/lib/domains";
import { EPL_TEAM_PROFILES } from "@/lib/epl-teams";
import { PUBLIC_CITIES } from "@/lib/public-cities";
import { supabaseAdmin } from "@/lib/supabase-admin";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = getWebOrigin();

  const { data: events } = await supabaseAdmin
    .from("evntszn_events")
    .select("slug, updated_at")
    .eq("visibility", "published")
    .order("start_at", { ascending: true })
    .limit(200);

  const entries: MetadataRoute.Sitemap = [
    {
      url: `${origin}/`,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${origin}/events`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: "https://hosts.evntszn.com/",
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${origin}/partners/packages`,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${origin}/support`,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${origin}/signal/apply`,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${origin}/ambassador/apply`,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${origin}/privacy`,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${origin}/terms`,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${origin}/refund-policy`,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${origin}/liability-notice`,
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  for (const city of PUBLIC_CITIES) {
    entries.push({
      url: `${origin}/${city.slug}`,
      changeFrequency: "daily",
      priority: 0.8,
    });
  }

  for (const team of EPL_TEAM_PROFILES) {
    entries.push({
      url: `https://epl.evntszn.com/teams/${team.slug}`,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  entries.push({
    url: "https://epl.evntszn.com/standings",
    changeFrequency: "daily",
    priority: 0.7,
  });

  entries.push({
    url: "https://epl.evntszn.com/opportunities",
    changeFrequency: "daily",
    priority: 0.7,
  });

  for (const event of events || []) {
    entries.push({
      url: `${origin}/events/${event.slug}`,
      lastModified: event.updated_at || undefined,
      changeFrequency: "daily",
      priority: 0.8,
    });
  }

  return entries;
}
