import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "You must be signed in first." }, { status: 401 });
  }

  const body = await request.json();
  const token = String(body.token || "").trim();

  if (!token) {
    return NextResponse.json({ error: "Missing invite token." }, { status: 400 });
  }

  const { data: invite, error: inviteError } = await supabaseAdmin
    .from("admin_invites")
    .select("*")
    .eq("invite_token", token)
    .eq("status", "pending")
    .single();

  if (inviteError || !invite) {
    return NextResponse.json({ error: "Invite not found or no longer valid." }, { status: 404 });
  }

  if (new Date(invite.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "Invite has expired." }, { status: 400 });
  }

  if ((user.email || "").toLowerCase() !== String(invite.email).toLowerCase()) {
    return NextResponse.json({ error: "This invite belongs to a different email address." }, { status: 403 });
  }

  await supabaseAdmin
    .from("app_users")
    .update({
      account_type: "admin",
      full_name: invite.full_name || user.user_metadata?.full_name || "",
      is_active: true,
    })
    .eq("id", user.id);

  const { error: membershipError } = await supabaseAdmin
    .from("admin_memberships")
    .upsert(
      {
        user_id: user.id,
        role_id: invite.role_id,
        is_owner: false,
        is_active: true,
      },
      { onConflict: "user_id,role_id" }
    );

  if (membershipError) {
    return NextResponse.json({ error: membershipError.message }, { status: 500 });
  }

  await supabaseAdmin
    .from("admin_invites")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
    })
    .eq("id", invite.id);

  return NextResponse.json({ ok: true });
}
