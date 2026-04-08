import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getBaseDomain, isLocalHost } from "@/lib/domains";
import { getFounderPasswordConfig } from "@/lib/founder-auth";

const FOUNDER_COOKIE = "evntszn_founder_session";
export const FOUNDER_EMAIL = "hello@mixdencreative.com";
const FOUNDER_ID = "founder:hello@mixdencreative.com";

export type FounderSession = {
  id: string;
  email: string;
  full_name: string;
  isFounder: true;
};

function getSecret() {
  return getFounderPasswordConfig().value;
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

function encodePayload(payload: Record<string, unknown>) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodePayload(value: string) {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function isFounderIdentity(email?: string | null) {
  return (email || "").trim().toLowerCase() === FOUNDER_EMAIL;
}

export function buildFounderSessionValue() {
  const payload = encodePayload({
    id: FOUNDER_ID,
    email: FOUNDER_EMAIL,
    full_name: "Founder",
    issued_at: Date.now(),
  });

  return `${payload}.${sign(payload)}`;
}

export async function getFounderSession(): Promise<FounderSession | null> {
  if (!getSecret()) return null;

  const store = await cookies();
  const raw = store.get(FOUNDER_COOKIE)?.value;
  if (!raw) return null;

  const [payload, signature] = raw.split(".");
  if (!payload || !signature) return null;

  const expectedSignature = sign(payload);
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return null;
  }

  const parsed = decodePayload(payload);
  if (!parsed || !isFounderIdentity(String(parsed.email || ""))) {
    return null;
  }

  return {
    id: FOUNDER_ID,
    email: FOUNDER_EMAIL,
    full_name: "Founder",
    isFounder: true,
  };
}

export function applyFounderSession(response: NextResponse, runtimeHost?: string) {
  response.cookies.set({
    name: FOUNDER_COOKIE,
    value: buildFounderSessionValue(),
    httpOnly: true,
    sameSite: "lax",
    secure: !isLocalHost(runtimeHost || ""),
    path: "/",
    domain: isLocalHost(runtimeHost || "") ? undefined : `.${getBaseDomain()}`,
    maxAge: 60 * 60 * 12,
  });
}

export function clearFounderSession(response: NextResponse, runtimeHost?: string) {
  response.cookies.set({
    name: FOUNDER_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: !isLocalHost(runtimeHost || ""),
    path: "/",
    domain: isLocalHost(runtimeHost || "") ? undefined : `.${getBaseDomain()}`,
    maxAge: 0,
  });
}
