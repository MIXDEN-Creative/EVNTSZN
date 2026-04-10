import { createHash, randomBytes } from "node:crypto";

export const DEFAULT_ADMIN_PERMISSION_CODES = [
  "hq.manage",
  "admin.manage",
  "roles.manage",
  "invites.manage",
  "orders.view",
  "orders.manage",
  "rewards.view",
  "rewards.manage",
  "catalog.manage",
  "customers.view",
  "analytics.view",
  "approvals.manage",
  "sponsors.manage",
  "store.manage",
  "content.manage",
  "scanner.manage",
  "events.manage",
  "opportunities.manage",
  "city.manage",
  "support.manage",
  "support.assign",
  "support.respond",
  "workforce.view",
  "workforce.manage",
  "workforce.approve",
] as const;

export function toDatabaseUserId(userId?: string | null) {
  if (!userId || userId.startsWith("founder:")) {
    return null;
  }

  return userId;
}

export function createInviteToken() {
  return randomBytes(32).toString("hex");
}

export function hashInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function normalizePermissionCodes(value: unknown) {
  const items = Array.isArray(value) ? value : String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return Array.from(new Set(items.map((item) => String(item).trim()).filter(Boolean)));
}
