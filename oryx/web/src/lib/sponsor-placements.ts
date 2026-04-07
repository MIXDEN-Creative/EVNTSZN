import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSupabaseRuntimeSnapshot, isSupabaseCredentialError } from "@/lib/runtime-env";

export type SponsorPlacement = {
  id: string;
  name: string;
  type: string;
  logo_url: string | null;
  website_url: string | null;
  cta_label: string | null;
  status: string;
  visibility_locations: string[];
  display_order: number;
  is_featured: boolean;
  starts_at: string | null;
  ends_at: string | null;
};

function isMissingPlacementsTableError(error: unknown) {
  const code = typeof error === "object" && error !== null && "code" in error ? String((error as { code?: unknown }).code) : "";
  const message = typeof error === "object" && error !== null && "message" in error ? String((error as { message?: unknown }).message) : "";

  return code === "42P01" || code === "PGRST205" || /evntszn_sponsor_placements/i.test(message);
}

export async function getPublicSponsorPlacements(location: string | string[]) {
  try {
    const { data, error } = await supabaseAdmin
      .from("evntszn_sponsor_placements")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      if (isMissingPlacementsTableError(error)) {
        return [] as SponsorPlacement[];
      }
      throw new Error(error.message);
    }

    const now = Date.now();
    const requestedLocations = Array.isArray(location) ? location : [location];

    return ((data || []) as SponsorPlacement[]).filter((placement) => {
      const locations = Array.isArray(placement.visibility_locations) ? placement.visibility_locations : [];
      const statusActive = placement.status === "ready" || placement.status === "live";
      const startsAtOkay = !placement.starts_at || new Date(placement.starts_at).getTime() <= now;
      const endsAtOkay = !placement.ends_at || new Date(placement.ends_at).getTime() >= now;
      return statusActive && startsAtOkay && endsAtOkay && requestedLocations.some((requestedLocation) => locations.includes(requestedLocation));
    });
  } catch (error) {
    console.error("[sponsor-placements] public placement load failed", {
      error,
      credentialIssue: isSupabaseCredentialError(error),
      supabase: getSupabaseRuntimeSnapshot(),
      location,
    });
    return [] as SponsorPlacement[];
  }
}
