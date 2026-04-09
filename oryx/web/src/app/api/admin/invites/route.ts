import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-auth";
import { createInviteToken, hashInviteToken, toDatabaseUserId } from "@/lib/access-control";
import { getAdminOrigin } from "@/lib/domains";
import { sendAccessInviteEmail } from "@/lib/send-access-invite-email";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  await requireAdminPermission("invites.manage", "/epl/admin/team");

  const { data, error } = await supabaseAdmin
    .from("invites")
    .select(`
      id,
      email,
      status,
      expires_at,
      accepted_at,
      created_at,
      updated_at,
      metadata,
      roles (
        id,
        name,
        code
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    invites: (data || []).map((invite: any) => ({
      ...invite,
      full_name: invite.metadata?.full_name || null,
      role: Array.isArray(invite.roles) ? invite.roles[0] || null : invite.roles || null,
    })),
  });
}

export async function POST(request: Request) {
  const { user } = await requireAdminPermission("invites.manage", "/epl/admin/team");

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const email = String(body.email || "").trim().toLowerCase();
  const fullName = String(body.full_name || "").trim();
  const roleId = String(body.role_id || "").trim();

  if (!email || !roleId) {
    return NextResponse.json({ error: "Email and role are required." }, { status: 400 });
  }

  const { data: role, error: roleError } = await supabaseAdmin
    .from("roles")
    .select("id, name")
    .eq("id", roleId)
    .maybeSingle();

  if (roleError || !role) {
    return NextResponse.json({ error: roleError?.message || "Role not found." }, { status: 404 });
  }

  const existingInvite = await supabaseAdmin
    .from("invites")
    .select("id, expires_at")
    .eq("email", email)
    .eq("role_id", roleId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingInvite.error) {
    return NextResponse.json({ error: existingInvite.error.message }, { status: 500 });
  }

  const rawToken = createInviteToken();
  const tokenHash = hashInviteToken(rawToken);
  const actorUserId = toDatabaseUserId(user.id);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const invitePayload = {
    email,
    role_id: roleId,
    token_hash: tokenHash,
    status: "pending",
    created_by: actorUserId,
    expires_at: expiresAt,
    metadata: {
      full_name: fullName || null,
      invite_email: email,
    },
    email_sent_at: new Date().toISOString(),
    last_sent_at: new Date().toISOString(),
  };

  const { data: invite, error } = existingInvite.data
    ? await supabaseAdmin
        .from("invites")
        .update(invitePayload)
        .eq("id", existingInvite.data.id)
        .select("id")
        .single()
    : await supabaseAdmin
        .from("invites")
        .insert(invitePayload)
        .select("id")
        .single();

  if (error || !invite) {
    return NextResponse.json({ error: error?.message || "Could not create invite." }, { status: 500 });
  }

  const acceptUrl = `${getAdminOrigin(new URL(request.url).host)}/admin-invite/accept?token=${rawToken}&email=${encodeURIComponent(email)}`;

  await sendAccessInviteEmail({
    to: email,
    fullName,
    roleName: role.name,
    acceptUrl,
  });

  return NextResponse.json({ ok: true, inviteId: invite.id, resentExisting: Boolean(existingInvite.data) });
}

export async function PATCH(request: Request) {
  const { user } = await requireAdminPermission("invites.manage", "/epl/admin/team");
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(body.action || "").trim();
  const inviteId = String(body.inviteId || "").trim();

  if (!inviteId) {
    return NextResponse.json({ error: "inviteId is required." }, { status: 400 });
  }

  const { data: invite, error: inviteError } = await supabaseAdmin
    .from("invites")
    .select("id, email, metadata, roles(id, name)")
    .eq("id", inviteId)
    .maybeSingle();

  if (inviteError || !invite) {
    return NextResponse.json({ error: inviteError?.message || "Invite not found." }, { status: 404 });
  }

  if (action === "revoke") {
    const { error } = await supabaseAdmin
      .from("invites")
      .update({ status: "revoked" })
      .eq("id", inviteId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  if (action === "resend") {
    const rawToken = createInviteToken();
    const tokenHash = hashInviteToken(rawToken);

    const { error } = await supabaseAdmin
      .from("invites")
      .update({
        token_hash: tokenHash,
        status: "pending",
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        last_sent_at: new Date().toISOString(),
        email_sent_at: new Date().toISOString(),
        created_by: toDatabaseUserId(user.id),
      })
      .eq("id", inviteId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const metadata = (invite.metadata || {}) as Record<string, unknown>;
    const acceptUrl = `${getAdminOrigin(new URL(request.url).host)}/admin-invite/accept?token=${rawToken}&email=${encodeURIComponent(invite.email)}`;

    await sendAccessInviteEmail({
      to: invite.email,
      fullName: String(metadata.full_name || "").trim() || null,
      roleName: (invite.roles as { name?: string } | null)?.name || "EVNTSZN access",
      acceptUrl,
    });

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unsupported invite action." }, { status: 400 });
}
