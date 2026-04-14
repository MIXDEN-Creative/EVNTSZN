const FOUNDER_PASSWORD_ENV_KEYS = [
  "ADMIN_ACCESS_PASSWORD",
  "FOUNDER_ACCESS_PASSWORD",
  "ADMIN_PASSWORD",
  "FOUNDER_PASSWORD",
] as const;

const loggedFounderConfigIssues = new Set<string>();

function logFounderIssueOnce(message: string, context: Record<string, unknown>) {
  if (loggedFounderConfigIssues.has(message)) return;
  loggedFounderConfigIssues.add(message);
  console.error("[founder-auth]", message, context);
}

export function getFounderPasswordConfig() {
  // Cloudflare and Next.js environments can vary in how they expose process.env.
  // We check the most likely keys. In Cloudflare workers, env is often passed to the handler.
  // We attempt a common pattern and fall back to process.env if available.
  const env = (typeof process !== "undefined" && process.env) || (typeof self !== "undefined" && (self as any).env) || {};
  
  const configuredEntry = FOUNDER_PASSWORD_ENV_KEYS
    .map((key) => [key, env[key]] as const)
    .find(([, value]) => typeof value === "string" && value.trim());
  
  const raw = configuredEntry?.[1] ?? "";
  const value = String(raw).replace(/\r?\n$/, "").trim();
  const source = configuredEntry?.[0] || "missing";

  if (!value) {
    logFounderIssueOnce("founder password is not configured", {
      source,
      configuredEnvKeys: FOUNDER_PASSWORD_ENV_KEYS.filter((key) => Boolean(process.env[key])),
      adminPasswordConfigured: Boolean(process.env.ADMIN_ACCESS_PASSWORD || process.env.ADMIN_PASSWORD),
      fallbackConfigured: Boolean(process.env.FOUNDER_ACCESS_PASSWORD || process.env.FOUNDER_PASSWORD),
    });
  }

  return {
    value,
    source,
    configured: Boolean(value),
  };
}
