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
  const configuredEntry = FOUNDER_PASSWORD_ENV_KEYS
    .map((key) => [key, process.env[key]] as const)
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
