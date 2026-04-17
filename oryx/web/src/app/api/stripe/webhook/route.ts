import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { buildTicketCode, logEventActivity } from "@/lib/evntszn";
import { attributeLinkConversionFromOrder } from "@/lib/link-attribution";
import { syncHostGrowthCompensationForTicketOrder } from "@/lib/growth-attribution";
import { getLinkPlanFromStripePriceId, getLinkPlanFromSubscription, mapStripeSubscriptionStatus } from "@/lib/link-billing";
import { fromStripeCents } from "@/lib/money";
import { ensureTicketRevenueAllocation } from "@/lib/revenue-engine";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendMerchConfirmationEmail } from "@/lib/send-merch-email";
import { logSystemIssue } from "@/lib/system-logs";

type PrintfulOrderResponse = {
  result?: {
    id?: number | string | null;
  } | null;
};

function getTierFromLifetimePoints(points: number) {
  if (points >= 1000) return "Elite";
  if (points >= 500) return "Gold";
  if (points >= 250) return "Silver";
  return "Member";
}

async function syncLinkPlanRow(input: {
  userId?: string | null;
  linkPageId?: string | null;
  customerId?: string | null;
  subscriptionId?: string | null;
  plan?: string | null;
  status?: string | null;
}) {
  let query = supabaseAdmin.from("evntszn_link_pages").update({
    ...(input.plan ? { plan_tier: input.plan } : {}),
    ...(input.status ? { subscription_status: input.status } : {}),
    ...(input.customerId !== undefined ? { stripe_customer_id: input.customerId } : {}),
    ...(input.subscriptionId !== undefined ? { stripe_subscription_id: input.subscriptionId } : {}),
  });

  if (input.linkPageId) {
    query = query.eq("id", input.linkPageId);
  } else if (input.userId) {
    query = query.eq("user_id", input.userId);
  } else if (input.subscriptionId) {
    query = query.eq("stripe_subscription_id", input.subscriptionId);
  } else if (input.customerId) {
    query = query.eq("stripe_customer_id", input.customerId);
  } else {
    throw new Error("Missing Link billing sync identifier.");
  }

  const { error } = await query;
  if (error) {
    throw new Error(error.message);
  }
}

async function handleLinkSubscriptionCheckout(session: Stripe.Checkout.Session) {
  const metadata = session.metadata || {};
  if (metadata.checkout_kind !== "link_subscription" || session.mode !== "subscription") {
    return false;
  }

  const selectedPlan =
    getLinkPlanFromStripePriceId(
      typeof session.line_items?.data?.[0]?.price?.id === "string" ? session.line_items.data[0].price.id : null,
    ) || metadata.selected_plan;

  await syncLinkPlanRow({
    userId: metadata.user_id || session.client_reference_id || null,
    linkPageId: metadata.link_page_id || null,
    customerId: typeof session.customer === "string" ? session.customer : session.customer?.id || null,
    subscriptionId:
      typeof session.subscription === "string" ? session.subscription : session.subscription?.id || null,
    plan: selectedPlan || null,
    status: "active",
  });

  return true;
}

async function handleLinkSubscriptionUpdated(subscription: Stripe.Subscription) {
  const plan = getLinkPlanFromSubscription(subscription);
  await syncLinkPlanRow({
    userId: subscription.metadata?.user_id || null,
    linkPageId: subscription.metadata?.link_page_id || null,
    customerId: typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id || null,
    subscriptionId: subscription.id,
    plan,
    status: mapStripeSubscriptionStatus(subscription.status),
  });
}

async function handleLinkSubscriptionDeleted(subscription: Stripe.Subscription) {
  await syncLinkPlanRow({
    userId: subscription.metadata?.user_id || null,
    linkPageId: subscription.metadata?.link_page_id || null,
    customerId: typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id || null,
    subscriptionId: null,
    plan: "free",
    status: "canceled",
  });
}

async function handleLinkInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const billingInvoice = invoice as Stripe.Invoice & {
    parent?: {
      subscription_details?: {
        subscription?: string | Stripe.Subscription | null;
      } | null;
    } | null;
  };
  const subscriptionId =
    typeof billingInvoice.parent?.subscription_details?.subscription === "string"
      ? billingInvoice.parent.subscription_details.subscription
      : billingInvoice.parent?.subscription_details?.subscription?.id || null;
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id || null;
  if (!subscriptionId && !customerId) return;
  await syncLinkPlanRow({
    subscriptionId,
    customerId,
    status: "past_due",
  });
}

async function handleEventTicketCheckout(session: Stripe.Checkout.Session) {
  const metadata = session.metadata || {};

  if (metadata.checkout_kind !== "event_ticket") {
    return false;
  }

  const eventId = metadata.evntszn_event_id;
  const ticketTypeId = metadata.evntszn_ticket_type_id;
  const purchaserUserId = metadata.evntszn_purchaser_user_id || null;
  const quantity = Math.max(1, Number(metadata.evntszn_quantity || "1"));
  const customerEmail = (
    session.customer_details?.email ||
    session.customer_email ||
    ""
  ).toLowerCase();
  const purchaserName =
    session.customer_details?.name ||
    "EVNTSZN Guest";

  if (!eventId || !ticketTypeId || !customerEmail) {
    throw new Error("Ticket checkout metadata is incomplete.");
  }

  const { data: existingOrder } = await supabaseAdmin
    .from("evntszn_ticket_orders")
    .select("id, event_id, ticket_type_id, quantity, amount_total_usd")
    .eq("stripe_checkout_session_id", session.id)
    .maybeSingle();

  const [{ data: event }, { data: ticketType }] = await Promise.all([
    supabaseAdmin
      .from("evntszn_events")
      .select("id, slug, title, organizer_user_id, city, event_class")
      .eq("id", eventId)
      .single(),
    supabaseAdmin
      .from("evntszn_ticket_types")
      .select("id, name, price_usd, quantity_total, quantity_sold")
      .eq("id", ticketTypeId)
      .single(),
  ]);

  if (!event || !ticketType) {
    throw new Error("Ticket inventory no longer exists.");
  }

  const remaining = (ticketType.quantity_total || 0) - (ticketType.quantity_sold || 0);
  if (remaining < quantity) {
    throw new Error("Ticket inventory is no longer available.");
  }

  let order = existingOrder;

  if (!order) {
    const { data: createdOrder, error: orderError } = await supabaseAdmin
      .from("evntszn_ticket_orders")
      .insert({
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : null,
        event_id: event.id,
        ticket_type_id: ticketTypeId,
        purchaser_user_id: purchaserUserId,
        purchaser_email: customerEmail,
        purchaser_name: purchaserName,
        quantity,
        amount_total_usd: fromStripeCents(session.amount_total || 0),
        currency_code: session.currency || "usd",
        status: "paid",
      })
      .select("id, event_id, ticket_type_id, quantity, amount_total_usd")
      .single();

    if (orderError || !createdOrder) {
      throw new Error(orderError?.message || "Could not create ticket order.");
    }

    order = createdOrder;

    const tickets = Array.from({ length: quantity }).map(() => ({
      event_id: event.id,
      ticket_type_id: ticketTypeId,
      order_id: createdOrder.id,
      purchaser_user_id: purchaserUserId,
      attendee_name: purchaserName,
      attendee_email: customerEmail,
      ticket_code: buildTicketCode("EVN"),
      share_code: buildTicketCode("SHARE"),
      referral_code: buildTicketCode("REF"),
      status: "issued",
    }));

    const { error: ticketError } = await supabaseAdmin.from("evntszn_tickets").insert(tickets);

    if (ticketError) {
      throw new Error(ticketError.message);
    }

    await supabaseAdmin
      .from("evntszn_ticket_types")
      .update({ quantity_sold: (ticketType.quantity_sold || 0) + quantity })
      .eq("id", ticketTypeId);

    await logEventActivity(event.id, purchaserUserId, "ticket_paid", "Ticket order paid via Stripe webhook", {
      quantity,
      orderId: createdOrder.id,
    });
  }

  const { data: orderTickets, error: orderTicketsError } = await supabaseAdmin
    .from("evntszn_tickets")
    .select("id")
    .eq("order_id", order.id)
    .order("created_at", { ascending: true });

  if (orderTicketsError) {
    throw new Error(orderTicketsError.message);
  }

  const unitGrossAmount = Number(ticketType.price_usd || 0);
  for (const ticket of orderTickets || []) {
    await ensureTicketRevenueAllocation({
      ticketId: ticket.id,
      eventId: event.id,
      ticketTypeName: ticketType.name || "General Access",
      unitGrossAmount,
      auditType: existingOrder ? "rebuild" : "purchase",
    });
  }

  await attributeLinkConversionFromOrder({
    orderId: order.id,
    eventId: event.id,
    purchaserUserId,
    amountTotalUsd: Number(order.amount_total_usd || fromStripeCents(session.amount_total || 0) || 0),
    quantity: Number(order.quantity || quantity),
    convertedAt: new Date().toISOString(),
    checkoutSession: session,
    metadata: {
      checkoutKind: metadata.checkout_kind || "event_ticket",
      customerEmail,
      existingOrder: Boolean(existingOrder),
    },
  });

  await syncHostGrowthCompensationForTicketOrder({
    orderId: order.id,
    eventId: event.id,
    organizerUserId: event.organizer_user_id || null,
    ticketTypeName: ticketType.name || "General Access",
    unitGrossAmount,
    quantity: Number(order.quantity || quantity),
  });

  return true;
}

async function handleEplRegistrationCheckout(session: Stripe.Checkout.Session) {
  const metadata = session.metadata || {};
  const registrationId = metadata.epl_registration_id;
  const applicationId = metadata.epl_application_id;
  const playerProfileId = metadata.epl_player_profile_id;

  if (!registrationId || !applicationId || !playerProfileId) {
    return false;
  }

  const { data: existingRegistration } = await supabaseAdmin
    .schema("epl")
    .from("season_registrations")
    .select("id, registration_status")
    .eq("id", registrationId)
    .maybeSingle();

  if (!existingRegistration) {
    throw new Error("EPL registration does not exist.");
  }

  if (existingRegistration.registration_status === "paid") {
    return true;
  }

  const paidAt = new Date().toISOString();

  const [{ error: registrationError }, { error: applicationError }, { error: profileError }] =
    await Promise.all([
      supabaseAdmin
        .schema("epl")
        .from("season_registrations")
        .update({
          registration_status: "paid",
          player_status: "registered",
          paid_at: paidAt,
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id:
            typeof session.payment_intent === "string" ? session.payment_intent : null,
          updated_at: paidAt,
        })
        .eq("id", registrationId),
      supabaseAdmin
        .schema("epl")
        .from("player_applications")
        .update({
          status: "approved",
          pipeline_stage: "approved",
          updated_at: paidAt,
        })
        .eq("id", applicationId),
      supabaseAdmin
        .schema("epl")
        .from("player_profiles")
        .update({
          status: "registered",
          updated_at: paidAt,
        })
        .eq("id", playerProfileId),
    ]);

  if (registrationError || applicationError || profileError) {
    throw new Error(
      registrationError?.message || applicationError?.message || profileError?.message || "Could not finalize EPL registration."
    );
  }

  return true;
}

async function handleSponsorPackageCheckout(session: Stripe.Checkout.Session) {
  const metadata = session.metadata || {};

  if (metadata.checkout_kind !== "sponsor_package") {
    return false;
  }

  const orderId = metadata.sponsor_package_order_id;
  if (!orderId) {
    throw new Error("Sponsor package order metadata is incomplete.");
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from("evntszn_sponsor_package_orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError || !order) {
    throw new Error(orderError?.message || "Sponsor package order not found.");
  }

  if (order.status === "paid") {
    return true;
  }

  let sponsorPartnerId = order.sponsor_partner_id as string | null;

  if (!sponsorPartnerId) {
    const [{ data: league }, { data: season }] = await Promise.all([
      supabaseAdmin.schema("epl").from("leagues").select("id").eq("slug", "epl").single(),
      supabaseAdmin.schema("epl").from("seasons").select("id").eq("slug", "season-1").single(),
    ]);

    const { data: sponsorPartner, error: sponsorError } = await supabaseAdmin
      .schema("epl")
      .from("sponsor_partners")
      .insert({
        league_id: league?.id,
        season_id: season?.id || null,
        company_name: order.company_name,
        contact_name: order.contact_name,
        contact_email: order.contact_email,
        contact_phone: order.contact_phone,
        package_name: order.package_name,
        cash_value_usd: order.amount_usd,
        status: "active",
        notes: "Created automatically from sponsor package checkout.",
      })
      .select("id")
      .single();

    if (sponsorError || !sponsorPartner) {
      throw new Error(sponsorError?.message || "Could not create sponsor record from package payment.");
    }

    sponsorPartnerId = sponsorPartner.id;
  }

  const { error: updateError } = await supabaseAdmin
    .from("evntszn_sponsor_package_orders")
    .update({
      status: "paid",
      sponsor_partner_id: sponsorPartnerId,
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id:
        typeof session.payment_intent === "string" ? session.payment_intent : null,
    })
    .eq("id", orderId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return true;
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return new NextResponse("Missing stripe-signature", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    return new NextResponse(
      `Webhook Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      { status: 400 }
    );
  }

  try {
    console.log("🔥 WEBHOOK HIT:", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      if (await handleLinkSubscriptionCheckout(session)) {
        return NextResponse.json({ received: true });
      }

      if (await handleEventTicketCheckout(session)) {
        return NextResponse.json({ received: true });
      }

      if (await handleEplRegistrationCheckout(session)) {
        return NextResponse.json({ received: true });
      }

      if (await handleSponsorPackageCheckout(session)) {
        return NextResponse.json({ received: true });
      }

      const shippingDetails = (
        session as Stripe.Checkout.Session & {
          shipping_details?: {
            name?: string | null;
            address?: Stripe.Address | null;
          } | null;
        }
      ).shipping_details;

      const customerDetails = session.customer_details;
      const metadata = session.metadata || {};

      const fullName =
        shippingDetails?.name ||
        customerDetails?.name ||
        "Customer";

      const customerEmail = (customerDetails?.email || "").toLowerCase();

      const address = shippingDetails?.address || customerDetails?.address;

      if (!address) {
        return new NextResponse("Missing shipping address", { status: 400 });
      }

      const printfulSyncVariantId = Number(metadata.printfulVariantId);
      const linkedUserId = metadata.userId || null;
      const printfulProductId = metadata.printfulProductId
        ? Number(metadata.printfulProductId)
        : null;
      const quantity = Number(metadata.quantity || "1");
      const markupAmount = Number(metadata.markupAmount || "0");
      const baseAmount = Number(metadata.baseAmount || "0");
      const amountTotal = session.amount_total || 0;

      const publicOrderNumber =
        "EPL-" + session.id.slice(-10).toUpperCase();

      const { data: settingsRow } = await supabaseAdmin
        .from("merch_reward_settings")
        .select("*")
        .eq("id", 1)
        .single();

      const pointsPerDollar = Number(settingsRow?.points_per_dollar || 1);
      const firstOrderBonus = Number(settingsRow?.first_order_bonus || 0);

      const { data: existingAccount } = await supabaseAdmin
        .from("merch_reward_accounts")
        .select("*")
        .eq("customer_email", customerEmail)
        .maybeSingle();

      const existingOrdersCount = Number(existingAccount?.orders_count || 0);
      const pointsFromSpend = Math.floor((amountTotal / 100) * pointsPerDollar);
      const bonusPoints = existingOrdersCount === 0 ? firstOrderBonus : 0;
      const totalPointsEarned = pointsFromSpend + bonusPoints;

      const baseOrder = {
        stripe_session_id: session.id,
        stripe_payment_intent_id:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : null,
        public_order_number: publicOrderNumber,
        user_id: linkedUserId,
        customer_email: customerEmail,
        customer_name: fullName,
        product_name: metadata.productName || "EPL Merch",
        printful_product_id: printfulProductId,
        printful_variant_id: printfulSyncVariantId,
        quantity,
        amount_total: amountTotal,
        base_amount: baseAmount,
        markup_amount: markupAmount,
        reward_points_earned: totalPointsEarned,
        currency: session.currency || "usd",
        status: "paid",
        fulfillment_status: "sending",
        recipient_name: fullName,
        address1: address.line1 || "",
        address2: address.line2 || "",
        city: address.city || "",
        state_code: address.state || "",
        country_code: address.country || "",
        zip: address.postal_code || "",
        stripe_data: session,
      };

      const { data: upsertedOrder, error: insertError } = await supabaseAdmin
        .from("merch_orders")
        .upsert(baseOrder, { onConflict: "stripe_session_id" })
        .select("id, public_order_number")
        .single();

      if (insertError) {
        console.error("Supabase insert error:", insertError);
        return new NextResponse("Failed to log order", { status: 500 });
      }

      console.log("✅ ORDER LOGGED:", session.id);

      const printfulRes = await fetch("https://api.printful.com/orders", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipient: {
            name: fullName,
            address1: address.line1,
            address2: address.line2 || "",
            city: address.city,
            state_code: address.state,
            country_code: address.country,
            zip: address.postal_code,
            email: customerEmail,
          },
          items: [
            {
              sync_variant_id: printfulSyncVariantId,
              quantity,
            },
          ],
        }),
      });

      const printfulData = (await printfulRes.json()) as PrintfulOrderResponse;

      if (!printfulRes.ok) {
        console.error("Printful order failed:", printfulData);

        await supabaseAdmin
          .from("merch_orders")
          .update({
            fulfillment_status: "failed",
            fulfillment_attempts: 1,
            printful_order_data: printfulData,
          })
          .eq("stripe_session_id", session.id);

        return new NextResponse("Printful order failed", { status: 500 });
      }

      await supabaseAdmin
        .from("merch_orders")
        .update({
          fulfillment_status: "sent",
          fulfillment_attempts: 1,
          printful_order_id: printfulData?.result?.id ?? null,
          printful_order_data: printfulData,
        })
        .eq("stripe_session_id", session.id);

      console.log("✅ PRINTFUL ORDER SENT:", printfulData?.result?.id ?? null);

      if (customerEmail) {
        const currentLifetime = Number(existingAccount?.lifetime_points || 0);
        const currentAvailable = Number(existingAccount?.available_points || 0);
        const currentSpent = Number(existingAccount?.total_spent || 0);

        const nextLifetime = currentLifetime + totalPointsEarned;
        const nextAvailable = currentAvailable + totalPointsEarned;
        const nextSpent = currentSpent + amountTotal;
        const nextOrdersCount = existingOrdersCount + 1;
        const nextTier = getTierFromLifetimePoints(nextLifetime);

        await supabaseAdmin
          .from("merch_reward_accounts")
          .upsert(
            {
              user_id: linkedUserId,
        customer_email: customerEmail,
              customer_name: fullName,
              lifetime_points: nextLifetime,
              available_points: nextAvailable,
              total_spent: nextSpent,
              orders_count: nextOrdersCount,
              tier: nextTier,
              is_active: true,
            },
            { onConflict: "customer_email" }
          );

        await supabaseAdmin
          .from("merch_reward_events")
          .upsert(
            {
              user_id: linkedUserId,
        customer_email: customerEmail,
              merch_order_id: upsertedOrder.id,
              event_type: "purchase",
              points: totalPointsEarned,
              description:
                bonusPoints > 0
                  ? `Purchase points (${pointsFromSpend}) + first order bonus (${bonusPoints})`
                  : `Purchase points (${pointsFromSpend})`,
            },
            { onConflict: "merch_order_id,event_type" }
          );
      }

      if (customerEmail) {
        try {
          await sendMerchConfirmationEmail({
            to: customerEmail,
            customerName: fullName,
            productName: metadata.productName || "EPL Merch",
            amountTotal,
            orderNumber: upsertedOrder.public_order_number,
            pointsEarned: totalPointsEarned,
          });

          await supabaseAdmin
            .from("merch_orders")
            .update({
              email_sent: true,
              email_sent_at: new Date().toISOString(),
            })
            .eq("stripe_session_id", session.id);

          console.log("✅ EMAIL SENT:", customerEmail);
        } catch (emailError) {
          console.error("Confirmation email failed:", emailError);
        }
      }
    }

    if (event.type === "customer.subscription.updated") {
      await handleLinkSubscriptionUpdated(event.data.object as Stripe.Subscription);
      return NextResponse.json({ received: true });
    }

    if (event.type === "customer.subscription.deleted") {
      await handleLinkSubscriptionDeleted(event.data.object as Stripe.Subscription);
      return NextResponse.json({ received: true });
    }

    if (event.type === "invoice.payment_failed") {
      await handleLinkInvoicePaymentFailed(event.data.object as Stripe.Invoice);
      return NextResponse.json({ received: true });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    await logSystemIssue({
      source: "stripe.webhook",
      severity: "critical",
      code: "webhook_failure",
      message: error instanceof Error ? error.message : "Webhook handler failed.",
    });
    return new NextResponse("Webhook handler failed", { status: 500 });
  }
}
