import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { clearFounderSession } from "@/lib/founder-session";
import { getAppOrigin } from "@/lib/domains";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const response = NextResponse.redirect(new URL("/account/login", getAppOrigin(new URL(request.url).host)));
  clearFounderSession(response, new URL(request.url).host);
  return response;
}
