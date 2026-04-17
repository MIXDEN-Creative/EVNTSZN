const FOUNDER_PASSWORD_ENV_KEYS = [
  "ADMIN_ACCESS_PASSWORD",
  "FOUNDER_ACCESS_PASSWORD",
  "ADMIN_PASSWORD",
  "FOUNDER_PASSWORD",
] as const;

const loggedFounderConfigIssues = new Set<string>();

type RuntimeEnvSource = {
  label: string;
  env: Record<string, unknown> | undefined; // Make env potentially undefined
};

// Helper to normalize potential string inputs from environment variables
function normalizeEnvValue(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/\r?\n$/, "").trim();
}

// Helper to get environment variables from various common runtime sources
function getRuntimeEnvSources(): RuntimeEnvSource[] {
  const globalScope = globalThis as Record<string, unknown>;
  const sources: RuntimeEnvSource[] = [];

  // Add a placeholder for Cloudflare 'env' object if available in the global context
  // In a real Cloudflare Worker, 'env' is typically passed to the handler function.
  // For this simulation, we check globalThis for common patterns.
  const cloudflareEnv = globalScope.cloudflareEnv as Record<string, unknown> | undefined;
  if (cloudflareEnv) {
    sources.push({ label: "globalThis.cloudflareEnv", env: cloudflareEnv });
  }
  
  // Check process.env (Node.js specific)
  const processEnv = typeof process !== "undefined" ? process.env : undefined;
  if (processEnv) {
    sources.push({ label: "process.env", env: processEnv });
  }

  // Check other global scopes that might expose environment variables
  const maybePush = (label: string, value: unknown) => {
    if (value && typeof value === "object") {
      sources.push({
        label,
        env: value as Record<string, unknown>,
      });
    }
  };

  maybePush("globalThis.__ENV__", globalScope.__ENV__);
  maybePush("globalThis.__env__", globalScope.__env__);
  maybePush("globalThis.env", globalScope.env);
  
  return sources;
}

function logFounderIssueOnce(message: string, context: Record<string, unknown>) {
  const contextString = JSON.stringify(context);
  const logKey = `${message}:${contextString}`;
  if (loggedFounderConfigIssues.has(logKey)) return;
  loggedFounderConfigIssues.add(logKey);
  console.error("[founder-auth]", message, context);
}

export function getFounderPasswordConfig() {
  const sources = getRuntimeEnvSources();
  let configuredEntry:
    | {
        key: (typeof FOUNDER_PASSWORD_ENV_KEYS)[number];
        value: string;
        source: string;
        sourceLabel: string; // Added for better logging
      }
    | undefined;

  const checkedSourcesInfo: Record<string, string[]> = {};

  for (const source of sources) {
    if (!source.env) continue; // Skip if env is undefined

    const checkedKeysForSource: string[] = [];
    for (const key of FOUNDER_PASSWORD_ENV_KEYS) {
      checkedKeysForSource.push(String(key));
      const value = normalizeEnvValue(source.env[key]);
      if (value) {
        configuredEntry = { key, value, source: source.label, sourceLabel: source.label };
        break;
      }
    }
    checkedSourcesInfo[source.label] = checkedKeysForSource;

    if (configuredEntry) break;
  }

  if (!configuredEntry) {
    logFounderIssueOnce("Founder password is not configured", {
      checkedKeysBySource: checkedSourcesInfo,
      runtimeSourcesChecked: sources.map(s => s.label),
      potentialCloudflareEnv: !sources.some(s => s.label === "globalThis.cloudflareEnv" && s.env), // Indicate if cloudflareEnv was not found/empty on globalThis
    });
  }

  return {
    value: configuredEntry?.value || "",
    source: configuredEntry ? `${configuredEntry.sourceLabel}:${configuredEntry.key}` : "missing",
    configured: Boolean(configuredEntry?.value),
  };
}
