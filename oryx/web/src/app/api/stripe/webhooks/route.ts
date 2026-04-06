import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/epl/stripe";
import { getSupabaseAdmin } from "@/lib/epl/supabase-admin";

export async function POST(req: Request) {
  const signature = (await headers()).get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const registrationId = session.metadata?.epl_registration_id;
    const applicationId = session.metadata?.epl_application_id;
    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;

    if (registrationId) {
      const supabase = getSupabaseAdmin();

      await supabase
        .schema("epl")
        .from("season_registrations")
        .update({
          registration_status: "paid",
          paid_at: new Date().toISOString(),
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id: paymentIntentId ?? null,
        })
        .eq("id", registrationId);

      if (applicationId) {
        await supabase
          .schema("epl")
          .from("player_applications")
          .update({
            status: "reviewing",
          })
          .eq("id", applicationId);
      }
    }
  }

  return NextResponse.json({ received: true });
}
