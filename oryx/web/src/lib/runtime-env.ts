type SupabaseRuntimeMode = "public-browser" | "server-auth" | "server-admin";

type SupabaseRuntimeConfig = {
  ok: boolean;
  url: string | null;
  anonKey: string | null;
  serviceRoleKey: string | null;
  urlSource: string | null;
  anonKeySource: string | null;
  serviceRoleKeySource: string | null;
  issues: string[];
};

const loggedEnvIssues = new Set<string>();

const URL_ENV_KEYS = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL"] as const;
const ANON_ENV_KEYS = ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_ANON_KEY"] as const;
const SERVICE_ENV_KEYS = ["SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SERVICE_KEY"] as const;

function logEnvIssueOnce(source: string, issues: string[]) {
  const key = `${source}:${issues.join("|")}`;
  if (loggedEnvIssues.has(key)) {
    return;
  }

  loggedEnvIssues.add(key);
  console.error(`[runtime-env] ${source} invalid`, {
    issues,
    snapshot: getSupabaseRuntimeSnapshot(),
  });
}

function isPlaceholderValue(value: string) {
  return /^(your_|your-|replace_|replace-|changeme|example|placeholder|<)/i.test(value);
}

function readEnvValue(keys: readonly string[]) {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === "string" && value.trim()) {
      return {
        value: value.trim(),
        source: key,
      };
    }
  }

  return {
    value: null,
    source: null,
  };
}

function readBrowserPublicEnvValue(keys: readonly string[]) {
  for (const key of keys) {
    let value: string | undefined;

    if (key === "NEXT_PUBLIC_SUPABASE_URL") {
      value = process.env.NEXT_PUBLIC_SUPABASE_URL;
    } else if (key === "NEXT_PUBLIC_SUPABASE_ANON_KEY") {
      value = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    }

    if (typeof value === "string" && value.trim()) {
      return {
        value: value.trim(),
        source: key,
      };
    }
  }

  return {
    value: null,
    source: null,
  };
}

function getSupabaseProjectRef(url: string | null) {
  if (!url) return null;

  try {
    return new URL(url).hostname.split(".")[0] || null;
  } catch {
    return null;
  }
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));

  try {
    if (typeof atob === "function") {
      return atob(normalized + padding);
    }
  } catch {
    // Fall through to Buffer when available.
  }

  try {
    if (typeof Buffer !== "undefined") {
      return Buffer.from(normalized + padding, "base64").toString("utf8");
    }
  } catch {
    // Ignore parse failures.
  }

  return null;
}

function getSupabaseKeyDetails(value: string | null) {
  if (!value) {
    return {
      fingerprint: null,
      role: null,
      issuerProjectRef: null,
    };
  }

  const parts = value.split(".");
  if (parts.length < 2) {
    return {
      fingerprint: `${value.slice(0, 6)}...${value.slice(-4)}`,
      role: null,
      issuerProjectRef: null,
    };
  }

  const payloadRaw = decodeBase64Url(parts[1]);
  if (!payloadRaw) {
    return {
      fingerprint: `${value.slice(0, 6)}...${value.slice(-4)}`,
      role: null,
      issuerProjectRef: null,
    };
  }

  try {
    const payload = JSON.parse(payloadRaw) as { role?: string; iss?: string };
    const issuerProjectRef = payload.iss ? getSupabaseProjectRef(payload.iss) : null;
    return {
      fingerprint: `${value.slice(0, 6)}...${value.slice(-4)}`,
      role: typeof payload.role === "string" ? payload.role : null,
      issuerProjectRef,
    };
  } catch {
    return {
      fingerprint: `${value.slice(0, 6)}...${value.slice(-4)}`,
      role: null,
      issuerProjectRef: null,
    };
  }
}

function validateSupabaseUrl(value: string | undefined) {
  if (!value?.trim()) {
    return "missing NEXT_PUBLIC_SUPABASE_URL";
  }

  try {
    const url = new URL(value);
    if (url.protocol !== "https:") {
      return "NEXT_PUBLIC_SUPABASE_URL must use https";
    }

    if (!url.hostname.endsWith(".supabase.co")) {
      return "NEXT_PUBLIC_SUPABASE_URL must point at a Supabase project host";
    }
  } catch {
    return "NEXT_PUBLIC_SUPABASE_URL is not a valid URL";
  }

  return null;
}

function validateSupabaseKey(name: "NEXT_PUBLIC_SUPABASE_ANON_KEY" | "SUPABASE_SERVICE_ROLE_KEY", value: string | undefined) {
  if (!value?.trim()) {
    return `missing ${name}`;
  }

  if (isPlaceholderValue(value.trim())) {
    return `${name} is still a placeholder`;
  }

  if (value.trim().length < 24) {
    return `${name} looks too short`;
  }

  return null;
}

export function getSupabaseRuntimeSnapshot() {
  const isBrowser = typeof window !== "undefined";
  const url = isBrowser ? readBrowserPublicEnvValue(URL_ENV_KEYS) : readEnvValue(URL_ENV_KEYS);
  const anon = isBrowser ? readBrowserPublicEnvValue(ANON_ENV_KEYS) : readEnvValue(ANON_ENV_KEYS);
  const service = isBrowser ? { value: null, source: null } : readEnvValue(SERVICE_ENV_KEYS);
  const projectRef = getSupabaseProjectRef(url.value);
  const anonDetails = getSupabaseKeyDetails(anon.value);
  const serviceDetails = getSupabaseKeyDetails(service.value);

  return {
    runtime: typeof window === "undefined" ? "server" : "browser",
    urlConfigured: Boolean(url.value),
    anonConfigured: Boolean(anon.value),
    serviceRoleConfigured: Boolean(service.value),
    urlSource: url.source,
    anonSource: anon.source,
    serviceRoleSource: service.source,
    projectRef,
    anonRole: anonDetails.role,
    serviceRole: serviceDetails.role,
    anonIssuerProjectRef: anonDetails.issuerProjectRef,
    serviceIssuerProjectRef: serviceDetails.issuerProjectRef,
    anonFingerprint: anonDetails.fingerprint,
    serviceFingerprint: serviceDetails.fingerprint,
  };
}

export function getSupabaseRuntimeConfig(mode: SupabaseRuntimeMode, source: string): SupabaseRuntimeConfig {
  const isBrowser = typeof window !== "undefined";
  const urlConfig = isBrowser ? readBrowserPublicEnvValue(URL_ENV_KEYS) : readEnvValue(URL_ENV_KEYS);
  const anonConfig = isBrowser ? readBrowserPublicEnvValue(ANON_ENV_KEYS) : readEnvValue(ANON_ENV_KEYS);
  const serviceConfig = isBrowser ? { value: null, source: null } : readEnvValue(SERVICE_ENV_KEYS);
  const url = urlConfig.value;
  const anonKey = anonConfig.value;
  const serviceRoleKey = serviceConfig.value;
  const projectRef = getSupabaseProjectRef(url);

  const issues: string[] = [];
  const urlIssue = validateSupabaseUrl(url ?? undefined);
  if (urlIssue) {
    issues.push(urlIssue);
  }

  if (mode === "public-browser" || mode === "server-auth") {
    const anonIssue = validateSupabaseKey("NEXT_PUBLIC_SUPABASE_ANON_KEY", anonKey ?? undefined);
    if (anonIssue) {
      issues.push(anonIssue);
    }

    const anonDetails = getSupabaseKeyDetails(anonKey);
    if (anonDetails.role && anonDetails.role !== "anon") {
      issues.push(`NEXT_PUBLIC_SUPABASE_ANON_KEY resolved from ${anonConfig.source} has unexpected role ${anonDetails.role}`);
    }
    if (projectRef && anonDetails.issuerProjectRef && anonDetails.issuerProjectRef !== projectRef) {
      issues.push(`NEXT_PUBLIC_SUPABASE_ANON_KEY resolved from ${anonConfig.source} does not match project ${projectRef}`);
    }
  }

  if (mode === "server-admin") {
    const serviceRoleIssue = validateSupabaseKey("SUPABASE_SERVICE_ROLE_KEY", serviceRoleKey ?? undefined);
    if (serviceRoleIssue) {
      issues.push(serviceRoleIssue);
    }

    const serviceDetails = getSupabaseKeyDetails(serviceRoleKey);
    if (serviceDetails.role && serviceDetails.role !== "service_role") {
      issues.push(`SUPABASE_SERVICE_ROLE_KEY resolved from ${serviceConfig.source} has unexpected role ${serviceDetails.role}`);
    }
    if (projectRef && serviceDetails.issuerProjectRef && serviceDetails.issuerProjectRef !== projectRef) {
      issues.push(`SUPABASE_SERVICE_ROLE_KEY resolved from ${serviceConfig.source} does not match project ${projectRef}`);
    }
  }

  if (issues.length) {
    logEnvIssueOnce(source, issues);
  }

  return {
    ok: issues.length === 0,
    url,
    anonKey,
    serviceRoleKey,
    urlSource: urlConfig.source,
    anonKeySource: anonConfig.source,
    serviceRoleKeySource: serviceConfig.source,
    issues,
  };
}

export function requireSupabaseRuntimeConfig(mode: SupabaseRuntimeMode, source: string) {
  const config = getSupabaseRuntimeConfig(mode, source);

  if (!config.ok) {
    throw new Error(`[${source}] Invalid Supabase runtime config: ${config.issues.join("; ")}`);
  }

  return config;
}

export function isSupabaseCredentialError(error: unknown) {
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message?: unknown }).message)
      : String(error ?? "");

  return /invalid api key|invalid jwt|supabase runtime config|missing next_public_supabase|missing supabase_service_role_key/i.test(
    message,
  );
}

export function formatRuntimeError(error: unknown) {
  if (error instanceof Error) {
    const details = error as Error & { code?: string; status?: number; details?: string; hint?: string };
    return {
      name: details.name,
      message: details.message,
      code: details.code || null,
      status: details.status || null,
      details: details.details || null,
      hint: details.hint || null,
    };
  }

  if (typeof error === "object" && error !== null) {
    const record = error as Record<string, unknown>;
    return {
      message: String(record.message || record.error || "Unknown runtime error"),
      code: typeof record.code === "string" ? record.code : null,
      status: typeof record.status === "number" ? record.status : null,
      details: typeof record.details === "string" ? record.details : null,
      hint: typeof record.hint === "string" ? record.hint : null,
    };
  }

  return {
    message: String(error ?? "Unknown runtime error"),
    code: null,
    status: null,
    details: null,
    hint: null,
  };
}
