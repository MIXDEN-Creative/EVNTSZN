const loggedFounderConfigIssues = new Set<string>();

function logFounderIssueOnce(message: string, context: Record<string, unknown>) {
  if (loggedFounderConfigIssues.has(message)) return;
  loggedFounderConfigIssues.add(message);
  console.error("[founder-auth]", message, context);
}

export function getFounderPasswordConfig() {
  const direct = process.env.ADMIN_ACCESS_PASSWORD;
  const fallback = process.env.FOUNDER_ACCESS_PASSWORD;
  const raw = direct ?? fallback ?? "";
  const value = String(raw).replace(/\r?\n$/, "").trim();
  const source = direct ? "ADMIN_ACCESS_PASSWORD" : fallback ? "FOUNDER_ACCESS_PASSWORD" : "missing";

  if (!value) {
    logFounderIssueOnce("founder password is not configured", {
      source,
      adminPasswordConfigured: Boolean(direct),
      fallbackConfigured: Boolean(fallback),
    });
  }

  return {
    value,
    source,
    configured: Boolean(value),
  };
}
