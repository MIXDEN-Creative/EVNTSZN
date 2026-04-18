import { NextResponse } from "next/server";
import Stripe from "stripe";
import { canAccessReserve, deriveReserveSettingsFromPlan, unwrapVenue } from "@/lib/reserve";
import { recordRevenueEventAndCommissions } from "@/lib/evntszn-monetization";
import { recordPulseActivity } from "@/lib/pulse-signal";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2026-02-25.clover" });
}

async function getUserId() {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    return data.user?.id || null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      venueSlug?: string;
      reserveVenueId?: string | null;
      guestName?: string;
      guestEmail?: string;
      guestPhone?: string;
      bookingDate?: string;
      bookingTime?: string;
      partySize?: number;
      waitlist?: boolean;
      amountUsd?: number;
      amountCents?: number;
    };

    if (!body.guestName || !body.guestEmail || !body.bookingDate || !body.bookingTime) {
      return NextResponse.json({ error: "Guest, date, and time are required." }, { status: 400 });
    }

    let reserveVenueId = body.reserveVenueId || null;
    if (!reserveVenueId && body.venueSlug) {
      const venueLookup = await supabaseAdmin
        .from("evntszn_reserve_venues")
        .select("id, plan_key, subscription_status, capacity_snapshot, settings, is_active, evntszn_venues!inner(id, slug, name, city, state, capacity, plan_key, smart_fill_add_on_active, link_plan_override, plan_status, owner_user_id)")
        .eq("evntszn_venues.slug", body.venueSlug)
        .maybeSingle();
      reserveVenueId = venueLookup.data?.id || null;
    }

    const shouldWaitlist = Boolean(body.waitlist);
    if (!reserveVenueId) {
      await recordPulseActivity({
        sourceType: shouldWaitlist ? "reserve_waitlist" : "reserve_booking",
        referenceType: "reserve",
        referenceId: body.venueSlug || null,
      }).catch(() => null);
      return NextResponse.json({
        ok: true,
        message: shouldWaitlist
          ? "Waitlist request captured for this launch venue."
          : "Reservation captured for this launch venue.",
      });
    }

    const reserveVenueRes = await supabaseAdmin
      .from("evntszn_reserve_venues")
      .select("id, plan_key, subscription_status, capacity_snapshot, settings, is_active, evntszn_venues!inner(id, slug, name, city, state, capacity, plan_key, smart_fill_add_on_active, link_plan_override, plan_status, owner_user_id)")
      .eq("id", reserveVenueId)
      .maybeSingle();

    if (reserveVenueRes.error) {
      return NextResponse.json({ error: reserveVenueRes.error.message }, { status: 500 });
    }

    const reserveVenue = reserveVenueRes.data as any;
    const venue = unwrapVenue(reserveVenue);
    if (!reserveVenue || !venue) {
      return NextResponse.json({ error: "Reserve venue not found." }, { status: 404 });
    }

    const hasReserveAccess = canAccessReserve({
      venuePlanKey: venue.plan_key,
      reservePlanKey: reserveVenue.plan_key,
      capacity: venue.capacity || reserveVenue.capacity_snapshot || null,
      smartFillAddOnActive: Boolean(venue.smart_fill_add_on_active),
      linkPlanOverride: venue.link_plan_override,
      reserveVenueIsActive: reserveVenue.is_active,
      reserveSubscriptionStatus: reserveVenue.subscription_status,
      venuePlanStatus: venue.plan_status,
    });

    if (!hasReserveAccess) {
      return NextResponse.json({ error: "This venue plan does not currently allow Reserve access." }, { status: 403 });
    }

    const settings = deriveReserveSettingsFromPlan({
      settings: (reserveVenue.settings || {}) as Record<string, unknown>,
      venuePlanKey: venue.plan_key,
      reservePlanKey: reserveVenue.plan_key,
      capacity: venue.capacity || reserveVenue.capacity_snapshot || null,
      smartFillAddOnActive: Boolean(venue.smart_fill_add_on_active),
      linkPlanOverride: venue.link_plan_override,
    });
    const derivedAmountUsd = Number(settings.reservation_fee_usd || 0);
    const derivedAmountCents = Math.round(derivedAmountUsd * 100);

    const userId = await getUserId();
    const { data: booking, error } = await supabaseAdmin
      .from("evntszn_reserve_bookings")
      .insert({
        reserve_venue_id: reserveVenueId,
        user_id: userId,
        guest_name: body.guestName,
        guest_email: body.guestEmail.toLowerCase(),
        guest_phone: body.guestPhone || null,
        booking_date: body.bookingDate,
        booking_time: normalizeTime(body.bookingTime),
        party_size: Math.max(1, Number(body.partySize || 1)),
        status: shouldWaitlist ? "waitlisted" : "confirmed",
        requested_status: shouldWaitlist ? "waitlisted" : "confirmed",
        revenue_amount_usd: derivedAmountUsd,
        source_channel: "reserve_phase_2",
        metadata: {
          stripeRequested: derivedAmountUsd > 0,
          venueSlug: body.venueSlug || null,
          capacity: venue.capacity || reserveVenue.capacity_snapshot || null,
          reservePlanKey: reserveVenue.plan_key,
          venuePlanKey: venue.plan_key,
        },
      })
      .select("id")
      .single();

    if (error || !booking) {
      return NextResponse.json({ error: error?.message || "Could not create reservation." }, { status: 500 });
    }

    await recordPulseActivity({
      sourceType: shouldWaitlist ? "reserve_waitlist" : "reserve_booking",
      city: venue.city || null,
      userId,
      referenceType: "reserve",
      referenceId: body.venueSlug || reserveVenueId,
      metadata: {
        bookingDate: body.bookingDate,
        bookingTime: body.bookingTime,
      },
    }).catch(() => null);

    const revenueMetadata = {
      displayName: venue.name,
      city: venue.city,
      state: venue.state,
      capacity: venue.capacity || reserveVenue.capacity_snapshot || null,
      venuePlanKey: venue.plan_key,
      reservePlanKey: reserveVenue.plan_key,
      reserveEnabled: true,
    };
    await recordRevenueEventAndCommissions({
      sourceType: "reserve_account",
      sourceId: reserveVenueId,
      eventType: "reservation_created",
      grossAmount: derivedAmountUsd,
      quantity: 1,
      externalKey: `reserve-booking:${booking.id}`,
      metadata: revenueMetadata,
    }).catch(() => null);
    await recordRevenueEventAndCommissions({
      sourceType: "venue_account",
      sourceId: reserveVenue.venue_id,
      eventType: "reservation_created",
      grossAmount: derivedAmountUsd,
      quantity: 1,
      externalKey: `venue-reservation:${booking.id}`,
      metadata: revenueMetadata,
    }).catch(() => null);

    const stripe = getStripeClient();
    if (!stripe || derivedAmountCents <= 0) {
      return NextResponse.json({
        ok: true,
        message: shouldWaitlist ? "Waitlist request submitted." : "Reservation submitted without payment.",
      });
    }

    const origin = new URL(request.url).origin;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${origin}/checkout/success`,
      cancel_url: `${origin}/checkout/cancel`,
      customer_email: body.guestEmail.toLowerCase(),
      metadata: {
        reserve_booking_id: booking.id,
        venue_slug: body.venueSlug || "",
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: derivedAmountCents,
            product_data: {
              name: `${venue.name || body.venueSlug || "EVNTSZN"} reservation hold`,
              description: `${body.bookingDate} at ${body.bookingTime}`,
            },
          },
        },
      ],
    });

    await supabaseAdmin
      .from("evntszn_reserve_bookings")
      .update({
        stripe_checkout_session_id: session.id,
        stripe_payment_status: "pending",
      })
      .eq("id", booking.id);

    return NextResponse.json({ ok: true, checkoutUrl: session.url });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not start checkout." },
      { status: 500 },
    );
  }
}

function normalizeTime(value: string) {
  const lower = value.trim().toLowerCase();
  const match = lower.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/);
  if (!match) return value;
  let hours = Number(match[1]);
  const minutes = match[2];
  const meridiem = match[3];
  if (meridiem === "pm" && hours < 12) hours += 12;
  if (meridiem === "am" && hours === 12) hours = 0;
  return `${String(hours).padStart(2, "0")}:${minutes}:00`;
}
