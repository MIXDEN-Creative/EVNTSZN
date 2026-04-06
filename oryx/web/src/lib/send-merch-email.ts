import { Resend } from "resend";
import { getAppOrigin } from "@/lib/domains";

const resend = new Resend(process.env.RESEND_API_KEY);

type MerchEmailArgs = {
  to: string;
  customerName: string;
  productName: string;
  amountTotal: number;
  orderNumber: string;
  pointsEarned?: number;
};

export async function sendMerchConfirmationEmail({
  to,
  customerName,
  productName,
  amountTotal,
  orderNumber,
  pointsEarned = 0,
}: MerchEmailArgs) {
  if (!to) return;

  const baseUrl = getAppOrigin();
  const trackUrl = `${baseUrl}/orders/track`;

  await resend.emails.send({
    from: process.env.MERCH_FROM_EMAIL!,
    to,
    subject: `Your EVNTSZN order ${orderNumber} is confirmed`,
    html: `
      <div style="font-family: Arial, Helvetica, sans-serif; background: #000; color: #fff; padding: 24px;">
        <h1 style="margin: 0 0 16px; color: #A259FF;">EVNTSZN Order Confirmed</h1>
        <p style="margin: 0 0 12px;">Hi ${customerName || "there"},</p>
        <p style="margin: 0 0 12px;">Your order has been received and is now being processed.</p>

        <div style="border: 1px solid #333; border-radius: 12px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0 0 8px;"><strong>Order Number:</strong> ${orderNumber}</p>
          <p style="margin: 0 0 8px;"><strong>Item:</strong> ${productName}</p>
          <p style="margin: 0 0 8px;"><strong>Total Paid:</strong> $${(amountTotal / 100).toFixed(2)}</p>
          <p style="margin: 0;"><strong>Rewards Earned:</strong> ${pointsEarned} point${pointsEarned === 1 ? "" : "s"}</p>
        </div>

        <p style="margin: 0 0 12px;">You can track your order anytime using your order number and email.</p>
        <p style="margin: 0;">
          <a href="${trackUrl}" style="color:#A259FF;">Track your order</a>
        </p>
      </div>
    `,
  });
}
