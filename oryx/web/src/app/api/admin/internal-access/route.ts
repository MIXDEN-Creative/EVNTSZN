import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { resolveNextRedirectUrl } from "@/lib/domains";

const FOUNDER_EMAIL = "hello@mixdencreative.com";

async function findUserIdForEmail(email: string) {
  let page = 1;

  while (page <= 10) {
    const result = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
    if (result.error) {
      throw result.error;
    }

    const user = result.data.users.find((candidate) => (candidate.email || "").toLowerCase() === email);
    if (user) return user.id;
    if (result.data.users.length < 200) break;
    page += 1;
  }

  return null;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const next = String(body.next || "/epl/admin");

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  if (email === FOUNDER_EMAIL) {
    return NextResponse.json({ error: "Use the founder access path for founder sign-in." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const pendingInvite = await supabaseAdmin
    .from("invites")
    .select("id")
    .eq("email", email)
    .eq("status", "pending")
    .gt("expires_at", now)
    .limit(1)
    .maybeSingle();

  if (pendingInvite.error) {
    return NextResponse.json({ error: pendingInvite.error.message }, { status: 500 });
  }

  if (pendingInvite.data) {
    return NextResponse.json({ ok: true, mode: "invite" });
  }

  const userId = await findUserIdForEmail(email).catch((error: unknown) => {
    throw error;
  });

  if (!userId) {
    return NextResponse.json(
      { error: "No internal access is assigned to that email yet. Use the invited email or ask HQ/Admin to add access first." },
      { status: 403 },
    );
  }

  const membership = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (membership.error) {
    return NextResponse.json({ error: membership.error.message }, { status: 500 });
  }

  if (!membership.data) {
    return NextResponse.json(
      { error: "That account does not have active internal access right now." },
      { status: 403 },
    );
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return NextResponse.json({ error: signInError.message || "Invalid internal credentials." }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    mode: "member",
    redirectTo: resolveNextRedirectUrl(next, new URL(request.url).host),
  });
}
