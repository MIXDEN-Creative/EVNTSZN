const DEFAULT_OSM_BASE_URL = "https://nominatim.openstreetmap.org";
const DEFAULT_OSM_USER_AGENT = "EVNTSZN/1.0 (hello@evntszn.com)";
const DEFAULT_CLEARBIT_LOGO_BASE_URL = "https://logo.clearbit.com";
const DEFAULT_GOOGLE_FAVICON_BASE_URL = "https://www.google.com/s2/favicons";

export function getOsmConfig() {
  return {
    baseUrl: (process.env.OSM_NOMINATIM_BASE_URL || DEFAULT_OSM_BASE_URL).replace(/\/$/, ""),
    userAgent: process.env.OSM_NOMINATIM_USER_AGENT || DEFAULT_OSM_USER_AGENT,
  };
}

export async function normalizeCitySearchInput(city: string) {
  const trimmed = city.trim();
  if (!trimmed) return null;

  try {
    const { baseUrl, userAgent } = getOsmConfig();
    const url = new URL(`${baseUrl}/search`);
    url.searchParams.set("q", trimmed);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "1");
    url.searchParams.set("addressdetails", "1");

    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": userAgent,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`OSM returned ${response.status}`);
    }

    const payload = (await response.json()) as Array<{
      address?: {
        city?: string;
        town?: string;
        village?: string;
        municipality?: string;
        county?: string;
        state?: string;
      };
      display_name?: string;
      lat?: string;
      lon?: string;
    }>;

    const top = payload[0];
    const address = top?.address || {};
    const normalizedCity =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.county ||
      trimmed;

    return {
      city: normalizedCity,
      state: address.state || "",
      label: top?.display_name || normalizedCity,
      lat: top?.lat ? Number(top.lat) : null,
      lng: top?.lon ? Number(top.lon) : null,
    };
  } catch (error) {
    console.warn("[external-integrations] city normalization failed", {
      city: trimmed,
      error,
    });
    return null;
  }
}

export function getLogoFallbackUrl(websiteUrl?: string | null) {
  if (!websiteUrl) return null;

  try {
    const url = new URL(websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`);
    const host = url.hostname.replace(/^www\./, "");
    const clearbitBase = (process.env.CLEARBIT_LOGO_BASE_URL || DEFAULT_CLEARBIT_LOGO_BASE_URL).replace(/\/$/, "");
    return `${clearbitBase}/${host}`;
  } catch {
    return null;
  }
}

export function getFaviconFallbackUrl(websiteUrl?: string | null) {
  if (!websiteUrl) return null;

  try {
    const url = new URL(websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`);
    const host = url.hostname.replace(/^www\./, "");
    const faviconBase = (process.env.GOOGLE_FAVICON_BASE_URL || DEFAULT_GOOGLE_FAVICON_BASE_URL).replace(/\/$/, "");
    return `${faviconBase}?domain=${encodeURIComponent(host)}&sz=128`;
  } catch {
    return null;
  }
}
