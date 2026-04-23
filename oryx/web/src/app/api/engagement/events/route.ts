import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { trackEngagementEvent, type EngagementEventType } from "@/lib/engagement";

async function getUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id || null;
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    const body = (await request.json().catch(() => ({}))) as {
      eventType?: EngagementEventType;
      city?: string | null;
      referenceType?: string | null;
      referenceId?: string | null;
      dedupeKey?: string | null;
      value?: number | null;
      metadata?: Record<string, unknown>;
      sourceType?: string | null;
      sourceLabel?: string | null;
    };

    if (!body.eventType) {
      return NextResponse.json({ error: "Event type is required." }, { status: 400 });
    }

    const result = await trackEngagementEvent({
      userId,
      eventType: body.eventType,
      city: body.city || null,
      referenceType: body.referenceType || null,
      referenceId: body.referenceId || null,
      dedupeKey: body.dedupeKey || null,
      value: body.value ?? null,
      metadata: {
        ...(body.metadata || {}),
        ...(body.sourceType ? { sourceType: body.sourceType } : {}),
        ...(body.sourceLabel ? { sourceLabel: body.sourceLabel } : {}),
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not record engagement event." },
      { status: 500 },
    );
  }
}
