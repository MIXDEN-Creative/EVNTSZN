import { NextResponse } from "next/server";
import { getCurrentUser, isMissingRbacTableError } from "@/lib/admin-auth";
import { ensurePlatformProfile } from "@/lib/evntszn";
import { hashInviteToken } from "@/lib/access-control";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  const body = (await request.json().catch(() => ({}))) as {
    token?: string;
    email?: string;
    password?: string;
    fullName?: string;
  };
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
      role_subtype,
      scope_type,
      scope_values,
      capability_groups,
      capability_overrides,
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
        role_subtype?: string | null;
        scope_type?: string | null;
        scope_values?: Record<string, string[]> | null;
        capability_groups?: string[] | null;
        capability_overrides?: Record<string, unknown> | null;
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
        role_subtype: null,
        scope_type: null,
        scope_values: {},
        capability_groups: [],
        capability_overrides: {},
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
  let user = currentUser;
  const inviteEmail = String(invite.email).toLowerCase();

  if (user && (user.email || "").toLowerCase() !== inviteEmail) {
    return NextResponse.json({ error: "This invite belongs to a different email address." }, { status: 403 });
  }

  if (!user) {
    const providedEmail = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const fullName = String(body.fullName || "").trim();

    if (providedEmail !== inviteEmail) {
      return NextResponse.json({ error: "Use the invited email address to claim access." }, { status: 400 });
    }

    if (!password || password.length < 10) {
      return NextResponse.json({ error: "Create a password with at least 10 characters." }, { status: 400 });
    }

    let page = 1;
    let existingUserId: string | null = null;
    while (page <= 10 && !existingUserId) {
      const result = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
      if (result.error) {
        return NextResponse.json({ error: result.error.message }, { status: 500 });
      }
      const existingUser = result.data.users.find((candidate) => (candidate.email || "").toLowerCase() === inviteEmail);
      if (existingUser) {
        existingUserId = existingUser.id;
        break;
      }
      if (result.data.users.length < 200) break;
      page += 1;
    }

    if (existingUserId) {
      const authUpdate = await supabaseAdmin.auth.admin.updateUserById(existingUserId, {
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName || undefined,
        },
      });

      if (authUpdate.error || !authUpdate.data.user) {
        return NextResponse.json({ error: authUpdate.error?.message || "Could not activate the invited account." }, { status: 500 });
      }

      user = authUpdate.data.user;
    } else {
      const authCreate = await supabaseAdmin.auth.admin.createUser({
        email: inviteEmail,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName || null,
        },
      });

      if (authCreate.error || !authCreate.data.user) {
        return NextResponse.json({ error: authCreate.error?.message || "Could not activate the invited account." }, { status: 500 });
      }

      user = authCreate.data.user;
    }
  }

  const metadata = (invite.metadata || {}) as Record<string, unknown>;
  await ensurePlatformProfile(user.id, {
    fullName: String(metadata.full_name || body.fullName || user.user_metadata?.full_name || "").trim() || null,
    primaryRole: "admin",
  });

  const assignRole = await supabaseAdmin
    .from("user_roles")
    .upsert(
      {
        user_id: user.id,
        role_id: invite.role_id,
        role_subtype: invite.role_subtype || null,
        scope_type: invite.scope_type || null,
        scope_values: invite.scope_values || {},
        capability_groups: invite.capability_groups || [],
        capability_overrides: invite.capability_overrides || {},
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
