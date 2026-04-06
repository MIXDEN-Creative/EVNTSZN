import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveNextRedirectUrl } from "@/lib/domains";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/account";
  const requestHost = request.headers.get("x-forwarded-host") || requestUrl.host;

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(resolveNextRedirectUrl(next, requestHost));
}
