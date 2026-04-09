import { NextResponse } from "next/server";
import { getCurrentUser, isMissingRbacTableError } from "@/lib/admin-auth";
import { ensurePlatformProfile } from "@/lib/evntszn";
import { hashInviteToken } from "@/lib/access-control";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "You must be signed in first." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { token?: string };
  const rawToken = String(body.token || "").trim();

  if (!rawToken) {
    return NextResponse.json({ error: "Missing invite token." }, { status: 400 });
  }

  const tokenHash = hashInviteToken(rawToken);
  const inviteLookup = await supabaseAdmin
    .from("invites")
    .select(`
      id,
      email,
      role_id,
      status,
      expires_at,
      metadata,
      roles (
        id,
        name
      )
    `)
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (inviteLookup.error && !isMissingRbacTableError(inviteLookup.error)) {
    return NextResponse.json({ error: inviteLookup.error.message }, { status: 500 });
  }

  let invite = inviteLookup.data as
    | {
        id: string;
        email: string;
        role_id: string;
        status: string;
        expires_at: string;
        metadata?: Record<string, unknown> | null;
        roles?: { id: string; name?: string | null } | { id: string; name?: string | null }[] | null;
      }
    | null;

  if (!invite && isMissingRbacTableError(inviteLookup.error)) {
    const legacyLookup = await supabaseAdmin
      .from("admin_invites")
      .select("*")
      .eq("invite_token", rawToken)
      .maybeSingle();

    if (legacyLookup.error || !legacyLookup.data) {
      return NextResponse.json({ error: legacyLookup.error?.message || "Invite not found or no longer valid." }, { status: 404 });
    }

    invite = {
      id: legacyLookup.data.id,
      email: legacyLookup.data.email,
      role_id: legacyLookup.data.role_id,
      status: legacyLookup.data.status,
      expires_at: legacyLookup.data.expires_at,
      metadata: { full_name: legacyLookup.data.full_name || null },
      roles: null,
    };
  }

  if (!invite) {
    return NextResponse.json({ error: "Invite not found or no longer valid." }, { status: 404 });
  }

  if (invite.status === "accepted") {
    return NextResponse.json({ error: "This invite has already been used." }, { status: 409 });
  }

  if (invite.status === "revoked") {
    return NextResponse.json({ error: "This invite was revoked. Ask EVNTSZN admin to send a new one." }, { status: 410 });
  }

  if (new Date(invite.expires_at).getTime() < Date.now()) {
    await supabaseAdmin.from("invites").update({ status: "expired" }).eq("id", invite.id).eq("status", "pending");
    return NextResponse.json({ error: "Invite has expired." }, { status: 400 });
  }

  if (invite.status !== "pending") {
    return NextResponse.json({ error: `This invite is ${invite.status}.` }, { status: 400 });
  }

  if ((user.email || "").toLowerCase() !== String(invite.email).toLowerCase()) {
    return NextResponse.json({ error: "This invite belongs to a different email address." }, { status: 403 });
  }

  const metadata = (invite.metadata || {}) as Record<string, unknown>;
  await ensurePlatformProfile(user.id, {
    fullName: String(metadata.full_name || user.user_metadata?.full_name || "").trim() || null,
    primaryRole: "admin",
  });

  const assignRole = await supabaseAdmin
    .from("user_roles")
    .upsert(
      {
        user_id: user.id,
        role_id: invite.role_id,
        is_active: true,
        assigned_by: null,
      },
      { onConflict: "user_id,role_id" },
    );

  if (assignRole.error && !isMissingRbacTableError(assignRole.error)) {
    return NextResponse.json({ error: assignRole.error.message }, { status: 500 });
  }

  if (assignRole.error && isMissingRbacTableError(assignRole.error)) {
    const legacyAssign = await supabaseAdmin
      .from("admin_memberships")
      .upsert(
        {
          user_id: user.id,
          role_id: invite.role_id,
          is_owner: false,
          is_active: true,
        },
        { onConflict: "user_id,role_id" },
      );

    if (legacyAssign.error) {
      return NextResponse.json({ error: legacyAssign.error.message }, { status: 500 });
    }
  }

  const markAccepted = await supabaseAdmin
    .from("invites")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
      accepted_by: user.id,
    })
    .eq("id", invite.id);

  if (markAccepted.error && !isMissingRbacTableError(markAccepted.error)) {
    return NextResponse.json({ error: markAccepted.error.message }, { status: 500 });
  }

  if (markAccepted.error && isMissingRbacTableError(markAccepted.error)) {
    const legacyMarkAccepted = await supabaseAdmin
      .from("admin_invites")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invite.id);

    if (legacyMarkAccepted.error) {
      return NextResponse.json({ error: legacyMarkAccepted.error.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    ok: true,
    roleName: Array.isArray(invite.roles) ? invite.roles[0]?.name || null : invite.roles?.name || null,
  });
}
