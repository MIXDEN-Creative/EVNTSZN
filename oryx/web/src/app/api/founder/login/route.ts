import { NextResponse } from "next/server";
import { applyFounderSession, FOUNDER_EMAIL, isFounderIdentity } from "@/lib/founder-session";
import { resolveNextRedirectUrl } from "@/lib/domains";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
    next?: string;
  };

  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const next = String(body.next || "/epl/admin");
  const expectedPassword = process.env.ADMIN_ACCESS_PASSWORD || "";

  if (!isFounderIdentity(email) || !expectedPassword || password !== expectedPassword) {
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
