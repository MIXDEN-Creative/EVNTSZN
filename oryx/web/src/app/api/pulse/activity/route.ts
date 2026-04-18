import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { recordPulseActivity } from "@/lib/pulse-signal";

async function getUserId() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id || null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    const body = (await request.json().catch(() => ({}))) as {
      sourceType?: Parameters<typeof recordPulseActivity>[0]["sourceType"];
      city?: string;
      areaLabel?: string;
      sessionKey?: string;
      referenceType?: string;
      referenceId?: string;
      deviceType?: string;
    };
    if (!body.sourceType || !body.city) {
      return NextResponse.json({ error: "Missing pulse activity fields." }, { status: 400 });
    }

    await recordPulseActivity({
      sourceType: body.sourceType,
      city: body.city,
      areaLabel: body.areaLabel || null,
      userId,
      sessionKey: body.sessionKey || null,
      referenceType: body.referenceType || null,
      referenceId: body.referenceId || null,
      metadata: {
        deviceType: body.deviceType || null,
        referrer: request.headers.get("referer"),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not record pulse activity." },
      { status: 500 },
    );
  }
}
