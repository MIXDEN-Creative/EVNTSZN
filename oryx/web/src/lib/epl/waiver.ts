const DEFAULT_WAIVER_URL = "https://tally.so/r/XxY8xz";

type WaiverUrlOptions = {
  applicationId?: string | null;
  registrationId?: string | null;
  registrationCode?: string | null;
  playerProfileId?: string | null;
  seasonId?: string | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

export function getBaseWaiverUrl() {
  return process.env.NEXT_PUBLIC_EPL_WAIVER_URL || DEFAULT_WAIVER_URL;
}

export function buildWaiverUrl(options: WaiverUrlOptions = {}) {
  const url = new URL(getBaseWaiverUrl());
  const params: Array<[string, string | null | undefined]> = [
    ["application_id", options.applicationId],
    ["registration_id", options.registrationId],
    ["registration_code", options.registrationCode],
    ["player_profile_id", options.playerProfileId],
    ["season_id", options.seasonId],
    ["email", options.email],
    ["first_name", options.firstName],
    ["last_name", options.lastName],
  ];

  for (const [key, value] of params) {
    if (value) url.searchParams.set(key, String(value));
  }

  return url.toString();
}

type TallyField = {
  key?: string | null;
  label?: string | null;
  type?: string | null;
  value?: unknown;
};

function normalizeKey(value: string | null | undefined) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function unwrapFieldValue(field: TallyField) {
  const raw = field.value;
  if (Array.isArray(raw)) {
    if (!raw.length) return "";
    if (typeof raw[0] === "string") return raw.join(", ");
    return "";
  }
  if (raw && typeof raw === "object") return "";
  return raw == null ? "" : String(raw).trim();
}

export function buildTallyFieldMap(fields: TallyField[] | null | undefined) {
  const map = new Map<string, string>();

  for (const field of fields || []) {
    const value = unwrapFieldValue(field);
    if (!value) continue;
    const keys = [normalizeKey(field.label), normalizeKey(field.key)];
    for (const key of keys) {
      if (key && !map.has(key)) map.set(key, value);
    }
  }

  return map;
}

export function readTallyField(map: Map<string, string>, keys: string[]) {
  for (const key of keys) {
    const value = map.get(normalizeKey(key));
    if (value) return value;
  }
  return "";
}
