import { NextResponse } from "next/server";
import { buildTicketCode, ensurePlatformProfile, logEventActivity, requirePlatformUser } from "@/lib/evntszn";
import { getAppOrigin, getCanonicalUrl } from "@/lib/domains";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Params = Promise<{ eventId: string }>;

export async function POST(request: Request, { params }: { params: Params }) {
  const viewer = await requirePlatformUser("/events");
  const { eventId } = await params;
  const body = await request.json().catch(() => ({}));
  const quantity = Math.max(1, Number(body.quantity || 1));

  const [{ data: event }, { data: ticketType }] = await Promise.all([
    supabaseAdmin
      .from("evntszn_events")
      .select("id, slug, title, visibility")
      .eq("id", eventId)
      .eq("visibility", "published")
      .maybeSingle(),
    supabaseAdmin
      .from("evntszn_ticket_types")
      .select("id, name, description, price_cents, quantity_total, quantity_sold, max_per_order")
      .eq("id", body.ticketTypeId)
      .eq("event_id", eventId)
      .eq("is_active", true)
      .maybeSingle(),
  ]);

  if (!event || !ticketType) {
    return NextResponse.json({ error: "Ticket inventory not found." }, { status: 404 });
  }

  if (quantity > ticketType.max_per_order) {
    return NextResponse.json({ error: "Quantity exceeds per-order limit." }, { status: 400 });
  }

  const remaining = ticketType.quantity_total - ticketType.quantity_sold;
  if (remaining < quantity) {
    return NextResponse.json({ error: "Ticket inventory is sold out." }, { status: 409 });
  }

  await ensurePlatformProfile(viewer.user!.id, {
    fullName:
      viewer.user?.user_metadata?.full_name ||
      viewer.user?.email ||
      null,
    primaryRole: viewer.profile?.primary_role || "attendee",
  });

  if (ticketType.price_cents <= 0) {
    const { data: order, error: orderError } = await supabaseAdmin
      .from("evntszn_ticket_orders")
      .insert({
        event_id: event.id,
        ticket_type_id: ticketType.id,
        purchaser_user_id: viewer.user!.id,
        purchaser_email: viewer.user!.email || "",
        purchaser_name: viewer.user?.user_metadata?.full_name || viewer.user?.email || null,
        quantity,
        amount_total_cents: 0,
        currency_code: "usd",
        status: "comped",
      })
      .select("id")
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: orderError?.message || "Could not create order." }, { status: 500 });
    }

    const tickets = Array.from({ length: quantity }).map(() => ({
      event_id: event.id,
      ticket_type_id: ticketType.id,
      order_id: order.id,
      purchaser_user_id: viewer.user!.id,
      attendee_name: viewer.user?.user_metadata?.full_name || viewer.user?.email || null,
      attendee_email: viewer.user?.email || null,
      ticket_code: buildTicketCode("EVN"),
      share_code: buildTicketCode("SHARE"),
      referral_code: buildTicketCode("REF"),
      status: "issued",
    }));

    const { error: ticketError } = await supabaseAdmin.from("evntszn_tickets").insert(tickets);

    if (ticketError) {
      return NextResponse.json({ error: ticketError.message }, { status: 500 });
    }

    await supabaseAdmin
      .from("evntszn_ticket_types")
      .update({ quantity_sold: ticketType.quantity_sold + quantity })
      .eq("id", ticketType.id);

    await logEventActivity(event.id, viewer.user!.id, "ticket_issued", "Complimentary tickets issued", {
      quantity,
      ticketTypeId: ticketType.id,
    });

    return NextResponse.json({
      ok: true,
      redirectTo: getCanonicalUrl("/account?tab=tickets", "app", new URL(request.url).host),
    });
  }

  const baseUrl = getAppOrigin(new URL(request.url).host);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${baseUrl}/events/${event.slug}?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/events/${event.slug}?purchase=cancelled`,
    customer_email: viewer.user?.email || undefined,
    metadata: {
      checkout_kind: "event_ticket",
      evntszn_event_id: event.id,
      evntszn_event_slug: event.slug,
      evntszn_ticket_type_id: ticketType.id,
      evntszn_purchaser_user_id: viewer.user!.id,
      evntszn_quantity: String(quantity),
    },
    line_items: [
      {
        quantity,
        price_data: {
          currency: "usd",
          unit_amount: ticketType.price_cents,
          product_data: {
            name: `${event.title} · ${ticketType.name}`,
            description: ticketType.description || "EVNTSZN event access",
          },
        },
      },
    ],
  });

  await logEventActivity(event.id, viewer.user!.id, "checkout_created", "Ticket checkout started", {
    ticketTypeId: ticketType.id,
    quantity,
  });

  return NextResponse.json({ ok: true, url: session.url });
}
