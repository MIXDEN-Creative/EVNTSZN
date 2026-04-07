import type { MetadataRoute } from "next";
import { getWebOrigin } from "@/lib/domains";
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
  ];

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
