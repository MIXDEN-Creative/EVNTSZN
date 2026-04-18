import { NextResponse } from "next/server";
import { buildUniqueSlug } from "@/lib/evntszn-phase";
import { getVenueCommerceState, normalizeReservePlanKey, normalizeVenuePlanKey, recordRevenueEventAndCommissions, syncManagedAccountAttribution } from "@/lib/evntszn-monetization";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

async function getUserId() {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    return data.user?.id || null;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("evntszn_venues")
      .select("id, slug, name, city, state, capacity, plan_key, smart_fill_add_on_active, plan_status, metadata")
      .order("created_at", { ascending: false })
      .limit(24);
    if (error) throw new Error(error.message);
    return NextResponse.json({ venues: data || [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load venues." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      city?: string;
      state?: string;
      capacity?: number;
      contactEmail?: string;
      smartFillEnabled?: boolean;
      smartFillPriceNote?: string;
      planKey?: string;
      reservePlanKey?: string;
      accountOwnerUserId?: string;
      assignedToUserId?: string;
      notes?: string;
    };

    if (!body.name || !body.city || !body.state) {
      return NextResponse.json({ error: "Name, city, and state are required." }, { status: 400 });
    }

    const userId = await getUserId();
    const venuePlanKey = normalizeVenuePlanKey(body.planKey);
    const reservePlanKey = body.reservePlanKey ? normalizeReservePlanKey(body.reservePlanKey) : null;
    const capacity = body.capacity !== undefined && body.capacity !== null ? Math.max(1, Number(body.capacity)) : null;
    const commerceState = getVenueCommerceState({
      venuePlanKey,
      reservePlanKey,
      capacity,
      smartFillAddOnActive: venuePlanKey === "venue_free" ? Boolean(body.smartFillEnabled) : false,
    });

    if (reservePlanKey === "reserve_standalone" && !capacity) {
      return NextResponse.json({ error: "Venue capacity is required for Reserve standalone pricing." }, { status: 400 });
    }

    const slug = buildUniqueSlug(body.name, crypto.randomUUID().slice(0, 6));
    const { data, error } = await supabaseAdmin
      .from("evntszn_venues")
      .insert({
        owner_user_id: body.accountOwnerUserId || userId,
        name: body.name,
        slug,
        city: body.city,
        state: body.state,
        capacity,
        contact_email: body.contactEmail || null,
        plan_key: venuePlanKey,
        smart_fill_add_on_active: commerceState.smartFillAddOnActive,
        plan_status: "active",
        metadata: {
          smartFillEnabled: commerceState.smartFillEnabled,
          smartFillPriceNote:
            body.smartFillPriceNote ||
            (commerceState.smartFillEnabled
              ? commerceState.venuePlanKey === "venue_free"
                ? "$29/month add-on active"
                : "Included in plan"
              : "$29/month add-on"),
          linkSlug: slug,
          planLabel:
            venuePlanKey === "venue_pro_reserve" ? "Venue Pro + Reserve" : venuePlanKey === "venue_pro" ? "Venue Pro" : "Venue Free",
        },
        notes: body.notes || null,
      })
      .select("id, slug, name, city, state, capacity, plan_key, smart_fill_add_on_active, metadata")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message || "Could not create venue." }, { status: 500 });
    }

    let reserveAccountId: string | null = null;
    if (commerceState.reserveEnabled) {
      const { data: reserveRow, error: reserveError } = await supabaseAdmin
        .from("evntszn_reserve_venues")
        .upsert(
          {
            venue_id: data.id,
            is_active: true,
            plan_key: reservePlanKey || "venue_pro_reserve",
            subscription_status: "active",
            capacity_snapshot: capacity,
            settings: {
              reservation_fee_usd: commerceState.reservationFeeUsd,
              waitlist_enabled: true,
              max_party_size: 8,
              booking_window_days: 30,
            },
          },
          { onConflict: "venue_id" },
        )
        .select("id")
        .single();

      if (reserveError) {
        return NextResponse.json({ error: reserveError.message }, { status: 500 });
      }
      reserveAccountId = reserveRow?.id || null;
    }

    await syncManagedAccountAttribution({
      sourceType: "venue_account",
      sourceId: data.id,
      createdByUserId: userId,
      assignedToUserId: body.assignedToUserId || userId,
      accountOwnerUserId: body.accountOwnerUserId || userId,
      activeStatus: "active",
      notes: body.notes || null,
      metadata: {
        displayName: data.name,
        city: data.city,
        state: data.state,
        capacity,
        venuePlanKey,
        planLabel:
          venuePlanKey === "venue_pro_reserve" ? "Venue Pro + Reserve" : venuePlanKey === "venue_pro" ? "Venue Pro" : "Venue Free",
        reserveEnabled: commerceState.reserveEnabled,
      },
    }).catch(() => null);

    if (commerceState.reserveEnabled && reserveAccountId) {
      await syncManagedAccountAttribution({
        sourceType: "reserve_account",
        sourceId: reserveAccountId,
        createdByUserId: userId,
        assignedToUserId: body.assignedToUserId || userId,
        accountOwnerUserId: body.accountOwnerUserId || userId,
        activeStatus: "active",
        metadata: {
          displayName: `${data.name} Reserve`,
          city: data.city,
          state: data.state,
          capacity,
          reservePlanKey: reservePlanKey || "venue_pro_reserve",
          reserveEnabled: true,
        },
      }).catch(() => null);
    }

    if (commerceState.venueMonthlyPriceUsd > 0) {
      await recordRevenueEventAndCommissions({
        sourceType: "venue_account",
        sourceId: data.id,
        eventType: "subscription_billed",
        grossAmount: commerceState.venueMonthlyPriceUsd,
        quantity: 1,
        externalKey: `venue-plan:${data.id}:${venuePlanKey}`,
        metadata: {
          displayName: data.name,
          city: data.city,
          state: data.state,
          capacity,
          venuePlanKey,
          reserveEnabled: commerceState.reserveEnabled,
        },
      }).catch(() => null);
    }

    if (commerceState.reserveMonthlyPriceUsd > 0 && reserveAccountId) {
      await recordRevenueEventAndCommissions({
        sourceType: "reserve_account",
        sourceId: reserveAccountId,
        eventType: "subscription_billed",
        grossAmount: commerceState.reserveMonthlyPriceUsd,
        quantity: 1,
        externalKey: `reserve-plan:${data.id}:${reservePlanKey || "venue_pro_reserve"}`,
        metadata: {
          displayName: `${data.name} Reserve`,
          city: data.city,
          state: data.state,
          capacity,
          reservePlanKey: reservePlanKey || "venue_pro_reserve",
        },
      }).catch(() => null);
    }

    return NextResponse.json({
      ok: true,
      venue: {
        id: data.id,
        slug: data.slug,
        name: data.name,
        city: data.city,
        state: data.state,
        capacity: data.capacity || null,
        planKey: data.plan_key || venuePlanKey,
        monthlyPriceUsd: commerceState.venueMonthlyPriceUsd,
        reserveMonthlyPriceUsd: commerceState.reserveMonthlyPriceUsd,
        reserveEnabled: commerceState.reserveEnabled,
        smartFillEnabled: Boolean((data as any).metadata?.smartFillEnabled),
        smartFillPriceNote: (data as any).metadata?.smartFillPriceNote || null,
        linkSlug: data.slug,
      },
      message: commerceState.reserveEnabled ? "Venue listed with Reserve pricing enforced." : "Venue listed and ready for venue-plan ops.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create venue." },
      { status: 500 },
    );
  }
}
