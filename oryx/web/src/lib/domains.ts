export type EvntsznSurface =
  | "web"
  | "app"
  | "scanner"
  | "epl"
  | "ops"
  | "hq"
  | "admin";

const DEFAULT_BASE_DOMAIN = "evntszn.com";
const DEFAULT_DEV_ORIGIN = "http://localhost:3000";

const DEFAULT_ORIGINS: Record<EvntsznSurface, string> = {
  web: "https://evntszn.com",
  app: "https://app.evntszn.com",
  scanner: "https://scanner.evntszn.com",
  epl: "https://epl.evntszn.com",
  ops: "https://ops.evntszn.com",
  hq: "https://hq.evntszn.com",
  admin: "https://admin.evntszn.com",
};

const SURFACE_ENV_KEYS: Record<EvntsznSurface, string[]> = {
  web: ["NEXT_PUBLIC_PUBLIC_ORIGIN", "NEXT_PUBLIC_SITE_URL"],
  app: ["NEXT_PUBLIC_APP_ORIGIN", "NEXT_PUBLIC_APP_URL"],
  scanner: ["NEXT_PUBLIC_SCANNER_ORIGIN"],
  epl: ["NEXT_PUBLIC_EPL_ORIGIN"],
  ops: ["NEXT_PUBLIC_OPS_ORIGIN"],
  hq: ["NEXT_PUBLIC_HQ_ORIGIN"],
  admin: ["NEXT_PUBLIC_ADMIN_ORIGIN"],
};

function cleanOrigin(origin: string) {
  return origin.replace(/\/$/, "");
}

function stripPort(host: string) {
  return host.replace(/:\d+$/, "").toLowerCase();
}

function getEnvValue(keys: string[]) {
  for (const key of keys) {
    const value = process.env[key];
    if (value) return cleanOrigin(value);
  }
  return null;
}

export function isLocalHost(host = "") {
  const bare = stripPort(host);
  return (
    bare === "localhost" ||
    bare === "127.0.0.1" ||
    bare === "0.0.0.0" ||
    bare.endsWith(".localhost")
  );
}

export function getBaseDomain() {
  return process.env.NEXT_PUBLIC_BASE_DOMAIN || DEFAULT_BASE_DOMAIN;
}

export function getCanonicalOrigin(surface: EvntsznSurface, runtimeHost?: string) {
  if (runtimeHost && isLocalHost(runtimeHost)) {
    return cleanOrigin(process.env.NEXT_PUBLIC_DEV_ORIGIN || DEFAULT_DEV_ORIGIN);
  }

  const configured = getEnvValue(SURFACE_ENV_KEYS[surface]);
  if (configured) return configured;

  return DEFAULT_ORIGINS[surface];
}

export function getWebOrigin(runtimeHost?: string) {
  return getCanonicalOrigin("web", runtimeHost);
}

export function getAppOrigin(runtimeHost?: string) {
  return getCanonicalOrigin("app", runtimeHost);
}

export function getScannerOrigin(runtimeHost?: string) {
  return getCanonicalOrigin("scanner", runtimeHost);
}

export function getEplOrigin(runtimeHost?: string) {
  return getCanonicalOrigin("epl", runtimeHost);
}

export function getOpsOrigin(runtimeHost?: string) {
  return getCanonicalOrigin("ops", runtimeHost);
}

export function getHqOrigin(runtimeHost?: string) {
  return getCanonicalOrigin("hq", runtimeHost);
}

export function getAdminOrigin(runtimeHost?: string) {
  return getCanonicalOrigin("admin", runtimeHost);
}

export function getSurfaceHost(surface: EvntsznSurface) {
  return new URL(getCanonicalOrigin(surface)).host;
}

export function getSurfaceFromHost(host = ""): EvntsznSurface | null {
  const bare = stripPort(host);

  if (isLocalHost(bare)) return null;

  const matched = (Object.keys(DEFAULT_ORIGINS) as EvntsznSurface[]).find((surface) => {
    const canonicalHost = new URL(getCanonicalOrigin(surface)).host.toLowerCase();
    return bare === canonicalHost || bare === `www.${canonicalHost}`;
  });

  return matched || null;
}

export function normalizeNextPath(next?: string | null) {
  if (!next) return "/account";

  try {
    const url = new URL(next);
    const nextPath = `${url.pathname}${url.search}${url.hash}` || "/account";
    const allowedHost = stripPort(url.host);
    const baseDomain = getBaseDomain();
    if (
      isLocalHost(allowedHost) ||
      allowedHost === baseDomain ||
      allowedHost.endsWith(`.${baseDomain}`)
    ) {
      return nextPath;
    }

    return nextPath;
  } catch {
    // Relative paths fall through.
  }

  if (!next.startsWith("/")) {
    return `/${next}`;
  }

  return next;
}

export function getSurfaceForPath(path: string): EvntsznSurface {
  const normalized = normalizeNextPath(path);

  if (normalized.startsWith("/scanner")) return "scanner";
  if (normalized.startsWith("/epl/admin/operations")) return "hq";
  if (
    normalized.startsWith("/epl/admin") ||
    normalized.startsWith("/admin-invite") ||
    normalized.startsWith("/api/admin")
  ) {
    return "admin";
  }
  if (normalized.startsWith("/epl") || normalized.startsWith("/api/epl")) return "epl";
  if (normalized.startsWith("/organizer") || normalized.startsWith("/venue")) return "ops";
  return "app";
}

function inferSurfaceForNext(path: string, runtimeHost?: string) {
  const normalized = normalizeNextPath(path);
  const surfaceFromPath = getSurfaceForPath(normalized);
  const currentSurface = runtimeHost ? getSurfaceFromHost(runtimeHost) : null;

  if (
    currentSurface &&
    currentSurface !== "web" &&
    surfaceFromPath === "app"
  ) {
    const appOwnedPrefixes = ["/account", "/events", "/orders", "/checkout", "/auth/callback"];
    const isAppOwned = appOwnedPrefixes.some(
      (prefix) =>
        normalized === prefix ||
        normalized.startsWith(`${prefix}/`) ||
        normalized.startsWith(`${prefix}?`),
    );

    if (!isAppOwned) {
      return currentSurface;
    }
  }

  return surfaceFromPath;
}

export function getCanonicalPath(path: string, surface: EvntsznSurface) {
  const normalized = normalizeNextPath(path);

  if (surface === "scanner") {
    const trimmed = normalized.replace(/^\/scanner(?=\/|$)/, "");
    return trimmed || "/";
  }

  if (surface === "epl") {
    const trimmed = normalized.replace(/^\/epl(?=\/|$)/, "");
    return trimmed || "/";
  }

  if (surface === "admin") {
    if (normalized === "/epl/admin") return "/";
    if (normalized.startsWith("/epl/admin/")) {
      return normalized.replace("/epl/admin", "") || "/";
    }
    return normalized;
  }

  if (surface === "hq") {
    if (normalized === "/epl/admin/operations") return "/";
    if (normalized.startsWith("/epl/admin/operations/")) {
      return normalized.replace("/epl/admin/operations", "") || "/";
    }
    if (normalized.startsWith("/epl/admin/")) {
      return normalized.replace("/epl/admin", "") || "/";
    }
    return normalized;
  }

  return normalized;
}

export function getCanonicalUrl(path: string, surface: EvntsznSurface, runtimeHost?: string) {
  return new URL(getCanonicalPath(path, surface), getCanonicalOrigin(surface, runtimeHost)).toString();
}

export function resolveNextRedirectUrl(next?: string | null, runtimeHost?: string) {
  const nextPath = normalizeNextPath(next);
  const surface = inferSurfaceForNext(nextPath, runtimeHost);
  return getCanonicalUrl(nextPath, surface, runtimeHost);
}

export function getLoginRedirectOrigin(next?: string | null, runtimeHost?: string) {
  const nextPath = normalizeNextPath(next);
  const surface = inferSurfaceForNext(nextPath, runtimeHost);

  if (surface === "web") {
    return getAppOrigin(runtimeHost);
  }

  return getCanonicalOrigin(surface, runtimeHost);
}

export function getLoginUrl(next?: string | null, runtimeHost?: string) {
  const nextPath = normalizeNextPath(next);
  if (!runtimeHost) {
    return `/account/login?next=${encodeURIComponent(nextPath)}`;
  }
  return new URL(
    `/account/login?next=${encodeURIComponent(nextPath)}`,
    getLoginRedirectOrigin(nextPath, runtimeHost),
  ).toString();
}
