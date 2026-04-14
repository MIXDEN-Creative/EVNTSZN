export type EvntsznSurface =
  | "web"
  | "app"
  | "scanner"
  | "epl"
  | "hosts"
  | "ops"
  | "hq"
  | "admin";

export type RestrictedSurface = Exclude<EvntsznSurface, "web" | "hosts">;

const DEFAULT_BASE_DOMAIN = "evntszn.com";
const DEFAULT_DEV_ORIGIN = "http://localhost:3000";

const DEFAULT_ORIGINS: Record<EvntsznSurface, string> = {
  web: "https://evntszn.com",
  app: "https://app.evntszn.com",
  scanner: "https://scanner.evntszn.com",
  epl: "https://epl.evntszn.com",
  hosts: "https://hosts.evntszn.com",
  ops: "https://ops.evntszn.com",
  hq: "https://hq.evntszn.com",
  admin: "https://admin.evntszn.com",
};

const SURFACE_ENV_KEYS: Record<EvntsznSurface, string[]> = {
  web: ["NEXT_PUBLIC_PUBLIC_ORIGIN", "NEXT_PUBLIC_SITE_URL"],
  app: ["NEXT_PUBLIC_APP_ORIGIN", "NEXT_PUBLIC_APP_URL"],
  scanner: ["NEXT_PUBLIC_SCANNER_ORIGIN"],
  epl: ["NEXT_PUBLIC_EPL_ORIGIN"],
  hosts: ["NEXT_PUBLIC_HOSTS_ORIGIN"],
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

function getLocalRuntimeOrigin(runtimeHost?: string) {
  if (runtimeHost && isLocalHost(runtimeHost)) {
    return `http://${runtimeHost}`;
  }

  return cleanOrigin(process.env.NEXT_PUBLIC_DEV_ORIGIN || DEFAULT_DEV_ORIGIN);
}

function getEnvValue(keys: string[]) {
  for (const key of keys) {
    const value = process.env[key];
    if (value) return cleanOrigin(value);
  }
  return null;
}

function getExpectedHost(surface: EvntsznSurface) {
  const baseDomain = getBaseDomain();

  switch (surface) {
    case "web":
      return baseDomain;
    case "app":
      return `app.${baseDomain}`;
    case "scanner":
      return `scanner.${baseDomain}`;
    case "epl":
      return `epl.${baseDomain}`;
    case "ops":
      return `ops.${baseDomain}`;
    case "hosts":
      return `hosts.${baseDomain}`;
    case "hq":
      return `hq.${baseDomain}`;
    case "admin":
      return `admin.${baseDomain}`;
  }
}

function getConfiguredOrigin(surface: EvntsznSurface) {
  const configured = getEnvValue(SURFACE_ENV_KEYS[surface]);
  if (!configured) return null;

  try {
    const configuredHost = stripPort(new URL(configured).host);
    const expectedHost = getExpectedHost(surface);
    if (
      isLocalHost(configuredHost) ||
      configuredHost === expectedHost ||
      (surface === "web" && configuredHost === `www.${expectedHost}`)
    ) {
      return configured;
    }
  } catch {
    return null;
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
    return getLocalRuntimeOrigin(runtimeHost);
  }

  const configured = getConfiguredOrigin(surface);
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

export function getHostsOrigin(runtimeHost?: string) {
  return getCanonicalOrigin("hosts", runtimeHost);
}

export function getSurfaceHost(surface: EvntsznSurface) {
  return new URL(getCanonicalOrigin(surface)).host;
}

export function getSurfaceFromHost(host = ""): EvntsznSurface | null {
  const bare = stripPort(host);

  if (isLocalHost(bare)) return null;

  const matched = (Object.keys(DEFAULT_ORIGINS) as EvntsznSurface[]).find((surface) => {
    const expectedHost = getExpectedHost(surface);
    const configuredHost = getConfiguredOrigin(surface)
      ? stripPort(new URL(getConfiguredOrigin(surface)!).host)
      : null;

    return (
      bare === expectedHost ||
      (surface === "web" && bare === `www.${expectedHost}`) ||
      (configuredHost !== null &&
        (bare === configuredHost || (surface === "web" && bare === `www.${configuredHost}`)))
    );
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

    return "/account";
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
  if (normalized.startsWith("/organizer") || normalized.startsWith("/venue") || normalized.startsWith("/ops")) {
    return "ops";
  }
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

  if (surface === "hosts") {
    const trimmed = normalized.replace(/^\/hosts(?=\/|$)/, "");
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
  const surface = inferSurfaceForNext(nextPath, runtimeHost);
  const internalAccessSurfaces: RestrictedSurface[] = ["scanner", "ops", "hq", "admin"];
  const loginPath = internalAccessSurfaces.includes(surface as RestrictedSurface)
    ? `/admin-login?next=${encodeURIComponent(nextPath)}`
    : `/account/login?next=${encodeURIComponent(nextPath)}`;

  if (!runtimeHost) {
    return loginPath;
  }

  const origin = internalAccessSurfaces.includes(surface as RestrictedSurface)
    ? getAppOrigin(runtimeHost)
    : getLoginRedirectOrigin(nextPath, runtimeHost);

  return new URL(loginPath, origin).toString();
}

export function getSurfaceLabel(surface: RestrictedSurface) {
  switch (surface) {
    case "app":
      return "Member Access";
    case "scanner":
      return "Scanner Access";
    case "epl":
      return "League Access";
    case "ops":
      return "Operations Access";
    case "hq":
      return "HQ Access";
    case "admin":
      return "Admin Access";
  }
}

export function getRestrictedSurfaceForPath(path: string): RestrictedSurface {
  const surface = getSurfaceForPath(path);
  if (surface === "web" || surface === "hosts") {
    return "app";
  }

  return surface;
}

export function getSurfaceFallback(
  surface: RestrictedSurface
): { surface: EvntsznSurface; path: string; label: string } {
  switch (surface) {
    case "scanner":
      return { surface: "app", path: "/account", label: "Return to my account" };
    case "ops":
      return { surface: "app", path: "/account", label: "Return to my account" };
    case "hq":
      return { surface: "app", path: "/account", label: "Return to my account" };
    case "admin":
      return { surface: "app", path: "/account", label: "Return to my account" };
    case "epl":
      return { surface: "epl", path: "/", label: "Return to EPL" };
    case "app":
    default:
      return { surface: "web", path: "/", label: "Back to EVNTSZN" };
  }
}

export function getRestrictedUrl(
  restrictedSurface: RestrictedSurface,
  options: {
    runtimeHost?: string;
    fallbackSurface?: EvntsznSurface;
    fallbackPath?: string;
    fallbackLabel?: string;
  } = {}
) {
  const fallback =
    options.fallbackSurface && options.fallbackPath
      ? {
          surface: options.fallbackSurface,
          path: normalizeNextPath(options.fallbackPath),
          label: options.fallbackLabel || "Continue",
        }
      : getSurfaceFallback(restrictedSurface);

  const params = new URLSearchParams({
    surface: restrictedSurface,
    fallbackSurface: fallback.surface,
    fallbackPath: fallback.path,
    fallbackLabel: fallback.label,
  });

  const path = `/access-restricted?${params.toString()}`;

  if (!options.runtimeHost) {
    return path;
  }

  return getCanonicalUrl(path, restrictedSurface, options.runtimeHost);
}
