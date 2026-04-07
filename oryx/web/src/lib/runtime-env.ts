type SupabaseRuntimeMode = "public-browser" | "server-auth" | "server-admin";

type SupabaseRuntimeConfig = {
  ok: boolean;
  url: string | null;
  anonKey: string | null;
  serviceRoleKey: string | null;
  issues: string[];
};

const loggedEnvIssues = new Set<string>();

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
  return {
    urlConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    anonConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    serviceRoleConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  };
}

export function getSupabaseRuntimeConfig(mode: SupabaseRuntimeMode, source: string): SupabaseRuntimeConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || null;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || null;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || null;

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
  }

  if (mode === "server-admin") {
    const serviceRoleIssue = validateSupabaseKey("SUPABASE_SERVICE_ROLE_KEY", serviceRoleKey ?? undefined);
    if (serviceRoleIssue) {
      issues.push(serviceRoleIssue);
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
