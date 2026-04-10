import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const DEFAULT_OPS_FROM_EMAIL = "EVNTSZN Ops <ops@evntszn.com>";
const OPS_FROM_EMAIL = process.env.OPS_FROM_EMAIL || DEFAULT_OPS_FROM_EMAIL;

export type AccessInviteEmailResult = {
  attempted: boolean;
  sent: boolean;
  sender: string;
  usedFallbackSender: boolean;
  providerId?: string | null;
  error?: string | null;
  reason?: "missing_recipient" | "missing_api_key" | "send_failed" | null;
};

export async function sendAccessInviteEmail({
  to,
  fullName,
  roleName,
  scopeSummary,
  capabilitySummary,
  acceptUrl,
}: {
  to: string;
  fullName?: string | null;
  roleName: string;
  scopeSummary?: string | null;
  capabilitySummary?: string | null;
  acceptUrl: string;
}) {
  const sender = OPS_FROM_EMAIL;
  const usedFallbackSender = !process.env.OPS_FROM_EMAIL;

  if (!to || !process.env.RESEND_API_KEY) {
    return {
      attempted: false,
      sent: false,
      sender,
      usedFallbackSender,
      error: !to ? "Invite recipient is missing." : "RESEND_API_KEY is not configured.",
      reason: !to ? "missing_recipient" : "missing_api_key",
    } satisfies AccessInviteEmailResult;
  }

  try {
    const response = await resend.emails.send({
      from: sender,
      to,
      subject: `You’ve been invited to EVNTSZN as ${roleName}`,
      html: `
        <div style="margin:0;padding:0;background:#050507;color:#ffffff;font-family:Inter,Arial,Helvetica,sans-serif;">
          <div style="max-width:640px;margin:0 auto;padding:40px 24px;">
            <div style="border:1px solid rgba(255,255,255,0.08);border-radius:28px;overflow:hidden;background:linear-gradient(180deg,#0f0f16 0%,#060608 100%);box-shadow:0 30px 80px rgba(0,0,0,0.45);">
              <div style="padding:32px 32px 20px;border-bottom:1px solid rgba(255,255,255,0.08);background:radial-gradient(circle at top, rgba(162,89,255,0.22), transparent 40%), #09090c;">
                <div style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:#caa7ff;font-weight:700;">EVNTSZN access invite</div>
                <div style="margin-top:14px;font-size:34px;line-height:1.02;font-weight:800;">You’ve been invited into the EVNTSZN operating system.</div>
                <div style="margin-top:14px;font-size:16px;line-height:1.7;color:rgba(255,255,255,0.78);">
                  ${fullName ? `Hi ${fullName},` : "Hi,"} an EVNTSZN administrator assigned you the <strong style="color:#ffffff;">${roleName}</strong> role.
                  Accept the invite to activate your access and move into the right dashboard surfaces.
                </div>
              </div>

              <div style="padding:28px 32px 32px;">
                <div style="border:1px solid rgba(255,255,255,0.08);border-radius:22px;padding:18px 20px;background:rgba(255,255,255,0.03);">
                  <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.55);font-weight:700;">Assigned role</div>
                  <div style="margin-top:10px;font-size:24px;font-weight:700;color:#ffffff;">${roleName}</div>
                  <div style="margin-top:10px;font-size:14px;line-height:1.7;color:rgba(255,255,255,0.72);">
                    This invite is secure, tied to your email address, and will attach your role after you sign in or create your account.
                  </div>
                  ${scopeSummary ? `<div style="margin-top:14px;font-size:13px;line-height:1.6;color:rgba(255,255,255,0.68);"><strong style="color:#ffffff;">Scope:</strong> ${scopeSummary}</div>` : ""}
                  ${capabilitySummary ? `<div style="margin-top:10px;font-size:13px;line-height:1.6;color:rgba(255,255,255,0.68);"><strong style="color:#ffffff;">Capabilities:</strong> ${capabilitySummary}</div>` : ""}
                </div>

                <div style="margin-top:24px;">
                  <a href="${acceptUrl}" style="display:inline-block;padding:15px 22px;border-radius:999px;background:#ffffff;color:#050507;text-decoration:none;font-weight:800;font-size:14px;">
                    Accept access
                  </a>
                </div>

                <div style="margin-top:18px;font-size:13px;line-height:1.7;color:rgba(255,255,255,0.58);">
                  If you already have an EVNTSZN account, sign in with this email and complete the invite.
                  If not, you’ll be able to create your account first and continue the same flow.
                </div>
              </div>
            </div>
          </div>
        </div>
      `,
    });

    return {
      attempted: true,
      sent: true,
      sender,
      usedFallbackSender,
      providerId: response.data?.id || null,
      error: null,
      reason: null,
    } satisfies AccessInviteEmailResult;
  } catch (error) {
    return {
      attempted: true,
      sent: false,
      sender,
      usedFallbackSender,
      providerId: null,
      error: error instanceof Error ? error.message : "Could not send invite email.",
      reason: "send_failed",
    } satisfies AccessInviteEmailResult;
  }
}
