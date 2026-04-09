import { NextResponse } from "next/server";
import { applyFounderSession, FOUNDER_EMAIL, isFounderIdentity } from "@/lib/founder-session";
import { resolveNextRedirectUrl } from "@/lib/domains";
import { getFounderPasswordConfig } from "@/lib/founder-auth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
    next?: string;
  };

  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const next = String(body.next || "/epl/admin");
  const founderPassword = getFounderPasswordConfig();
  const expectedPassword = founderPassword.value;

  if (!founderPassword.configured) {
    console.error("[founder-login] founder password missing in runtime", {
      source: founderPassword.source,
    });
    return NextResponse.json({ error: "Founder login is not configured in this runtime." }, { status: 503 });
  }

  if (!isFounderIdentity(email) || password !== expectedPassword) {
    console.warn("[founder-login] invalid founder login attempt", {
      email,
      configured: founderPassword.configured,
      source: founderPassword.source,
    });
    return NextResponse.json({ error: "Invalid founder credentials." }, { status: 401 });
  }

  const runtimeHost = new URL(request.url).host;
  const response = NextResponse.json({
    ok: true,
    redirectTo: resolveNextRedirectUrl(next, runtimeHost),
  });

  applyFounderSession(response, runtimeHost);
  return response;
}
