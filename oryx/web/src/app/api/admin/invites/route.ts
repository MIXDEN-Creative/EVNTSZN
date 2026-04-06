import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { requireAdminPermission } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { Resend } from "resend";
import { getAdminOrigin } from "@/lib/domains";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET() {
  await requireAdminPermission("admin.manage", "/epl/admin/team");

  const { data, error } = await supabaseAdmin
    .from("admin_invites")
    .select(`
      id,
      created_at,
      email,
      full_name,
      status,
      expires_at,
      accepted_at,
      invite_token,
      admin_roles (
        id,
        name
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ invites: data || [] });
}

export async function POST(request: Request) {
  const { user } = await requireAdminPermission("admin.manage", "/epl/admin/team");

  const body = await request.json();
  const email = String(body.email || "").trim().toLowerCase();
  const fullName = String(body.full_name || "").trim();
  const roleId = String(body.role_id || "").trim();

  if (!email || !roleId) {
    return NextResponse.json({ error: "Email and role are required." }, { status: 400 });
  }

  const inviteToken = crypto.randomBytes(24).toString("hex");

  const { error } = await supabaseAdmin
    .from("admin_invites")
    .insert({
      email,
      full_name: fullName,
      role_id: roleId,
      invite_token: inviteToken,
      invited_by: user.id,
      status: "pending",
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const acceptUrl = `${getAdminOrigin(new URL(request.url).host)}/admin-invite/accept?token=${inviteToken}`;

  await resend.emails.send({
    from: process.env.MERCH_FROM_EMAIL!,
    to: email,
    subject: "You’ve been invited to administer EVNTSZN",
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;background:#000;color:#fff;padding:24px">
        <h1 style="color:#A259FF">EVNTSZN Admin Invite</h1>
        <p>You’ve been invited to join the EVNTSZN admin system.</p>
        <p><a href="${acceptUrl}" style="color:#A259FF">Accept your admin invite</a></p>
      </div>
    `,
  });

  return NextResponse.json({ ok: true });
}
