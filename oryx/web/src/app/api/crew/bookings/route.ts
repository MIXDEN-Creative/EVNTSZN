import { NextResponse } from "next/server";
import { buildActivitySourceMetadata } from "@/lib/activity-source";
import { calculateCrewBookingFee } from "@/lib/evntszn-phase-shared";
import { trackEngagementEvent } from "@/lib/engagement";
import { recordPulseActivity } from "@/lib/pulse-signal";
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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      crewProfileId?: string;
      requestedByName?: string;
      requestedByEmail?: string;
      eventName?: string;
      eventDate?: string;
      city?: string;
      message?: string;
      budgetAmountUsd?: number;
      category?: string;
      partnerTier?: "standard" | "partner" | "pro_partner";
    };

    if (!body.crewProfileId || !body.requestedByName || !body.requestedByEmail) {
      return NextResponse.json({ error: "Crew profile, name, and email are required." }, { status: 400 });
    }

    const pricing = calculateCrewBookingFee({
      subtotalUsd: Number(body.budgetAmountUsd || 0),
      category: body.category || "",
      partnerTier: body.partnerTier,
    });

    const { data, error } = await supabaseAdmin
      .from("evntszn_crew_booking_requests")
      .insert({
        crew_profile_id: body.crewProfileId,
        requested_by_name: body.requestedByName,
        requested_by_email: body.requestedByEmail.toLowerCase(),
        event_name: body.eventName || null,
        event_date: body.eventDate ? new Date(body.eventDate).toISOString() : null,
        city: body.city || null,
        message: body.message || null,
        budget_amount_usd: Number(body.budgetAmountUsd || 0),
        flat_booking_fee_usd: pricing.platformFeeUsd,
        status: "requested",
        metadata: {
          marketplaceCategory: body.category || "",
          partnerTier: body.partnerTier || "standard",
          platformFeePercent: pricing.feePercent,
          platformFeeUsd: pricing.platformFeeUsd,
          totalAmountUsd: pricing.totalUsd,
        },
      })
      .select("id")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message || "Could not submit request." }, { status: 500 });
    }

    await recordPulseActivity({
      sourceType: "crew_request",
      city: body.city || null,
      referenceType: "crew",
      referenceId: body.crewProfileId,
      metadata: {
        category: body.category || null,
        ...buildActivitySourceMetadata({
          sourceType: "evntszn_native",
          referenceType: "crew",
          entityType: "crew_request",
          metadata: {
            category: body.category || null,
          },
        }),
      },
    }).catch(() => null);

    const userId = await getUserId();
    if (userId) {
      await trackEngagementEvent({
        userId,
        eventType: "crew_requested",
        city: body.city || null,
        referenceType: "crew",
        referenceId: body.crewProfileId,
        value: Number(body.budgetAmountUsd || 0),
        dedupeKey: `crew:${data.id}`,
        metadata: {
          category: body.category || null,
          totalAmountUsd: pricing.totalUsd,
          ...buildActivitySourceMetadata({
            sourceType: "evntszn_native",
            referenceType: "crew",
            entityType: "crew_request",
            metadata: {
              category: body.category || null,
            },
          }),
        },
      }).catch(() => null);
    }

    return NextResponse.json({
      ok: true,
      message: `Request submitted. ${pricing.feeLabel} applied.`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not submit booking." },
      { status: 500 },
    );
  }
}
