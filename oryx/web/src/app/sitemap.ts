import type { MetadataRoute } from "next";
import { getReserveOrigin, getStayOpsOrigin, getWebOrigin } from "@/lib/domains";
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

  const reserveVenuesRes = await supabaseAdmin
    .from("evntszn_reserve_venues")
    .select("created_at, evntszn_venues!inner(slug)")
    .eq("is_active", true)
    .limit(200);
  const reserveVenues = reserveVenuesRes.error ? [] : reserveVenuesRes.data || [];

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
      url: `${origin}/city`,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${origin}/hosts`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${origin}/curator`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${origin}/curator-network`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${origin}/link`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${origin}/venue-program`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${origin}/crew`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${origin}/pulse`,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${getReserveOrigin()}/`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${origin}/reserve`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${origin}/partners`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${origin}/partners/packages`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${origin}/partner`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${origin}/sponsors`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${origin}/sponsors/apply`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${origin}/sponsors/packages`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${origin}/venue`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${origin}/venue/pro`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${origin}/venue/pro-reserve`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${origin}/venue/agreement`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${origin}/tap-to-pour`,
      changeFrequency: "weekly",
      priority: 0.75,
    },
    {
      url: `${origin}/nodes`,
      changeFrequency: "weekly",
      priority: 0.75,
    },
    {
      url: `${origin}/organizer`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${origin}/stayops`,
      changeFrequency: "weekly",
      priority: 0.75,
    },
    {
      url: `${getStayOpsOrigin()}/`,
      changeFrequency: "weekly",
      priority: 0.75,
    },
    {
      url: `${origin}/stayops/intake`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${getStayOpsOrigin()}/intake`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${origin}/stayops/confirmation`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${getStayOpsOrigin()}/confirmation`,
      changeFrequency: "weekly",
      priority: 0.7,
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
    entries.push({
      url: `${origin}/city/${city.slug}`,
      changeFrequency: "daily",
      priority: 0.8,
    });
    entries.push({
      url: `${origin}/city/${city.slug}/events`,
      changeFrequency: "daily",
      priority: 0.8,
    });
    entries.push({
      url: `${origin}/city/${city.slug}/nightlife`,
      changeFrequency: "daily",
      priority: 0.78,
    });
    entries.push({
      url: `${origin}/city/${city.slug}/reservations`,
      changeFrequency: "daily",
      priority: 0.78,
    });
    entries.push({
      url: `${origin}/city/${city.slug}/venues`,
      changeFrequency: "daily",
      priority: 0.76,
    });
    entries.push({
      url: `${getReserveOrigin()}/${city.slug}`,
      changeFrequency: "daily",
      priority: 0.75,
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

  for (const row of reserveVenues || []) {
    const venue = Array.isArray(row.evntszn_venues) ? row.evntszn_venues[0] : row.evntszn_venues;
    if (!venue?.slug) continue;
    entries.push({
      url: `${getReserveOrigin()}/${venue.slug}`,
      lastModified: row.created_at || undefined,
      changeFrequency: "daily",
      priority: 0.76,
    });
  }

  return entries;
}
