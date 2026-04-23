import { NextResponse } from "next/server";
import { buildActivitySourceMetadata } from "@/lib/activity-source";
import { createClient } from "@/lib/supabase/server";
import { trackEngagementEvent } from "@/lib/engagement";
import { recordPulseActivity } from "@/lib/pulse-signal";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { normalizeSavedItems, type SavedItemRecord } from "@/lib/saved-items";

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function GET() {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ signedIn: false, items: [] });

    const { data, error } = await supabaseAdmin
      .from("evntszn_saved_items")
      .select("id, intent, entity_type, entity_key, title, href, city, state, starts_at, metadata, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    return NextResponse.json({
      signedIn: true,
      items: normalizeSavedItems(data || []),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load saved items." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await request.json()) as SavedItemRecord;
    const [item] = normalizeSavedItems([body]);
    if (!item) {
      return NextResponse.json({ error: "Invalid saved item." }, { status: 400 });
    }
    const sourceMetadata = buildActivitySourceMetadata({
      sourceType: String(item.metadata?.sourceType || item.metadata?.source_type || "").trim() || null,
      sourceLabel: String(item.metadata?.sourceLabel || item.metadata?.source_label || "").trim() || null,
      referenceType: item.entityType,
      entityType: item.entityType,
      metadata: item.metadata || {},
    });

    const { error } = await supabaseAdmin
      .from("evntszn_saved_items")
      .upsert(
        {
          user_id: user.id,
          intent: item.intent,
          entity_type: item.entityType,
          entity_key: item.entityKey,
          title: item.title,
          href: item.href,
          city: item.city || null,
          state: item.state || null,
          starts_at: item.startsAt || null,
          metadata: item.metadata || {},
        },
        { onConflict: "user_id,intent,entity_type,entity_key" },
      );
    if (error) throw new Error(error.message);

    await recordPulseActivity({
      sourceType: item.intent,
      city: item.city || null,
      areaLabel: typeof item.metadata?.areaLabel === "string" ? item.metadata.areaLabel : null,
      userId: user.id,
      referenceType: item.entityType,
      referenceId: item.entityKey,
      metadata: {
        ...(item.metadata || {}),
        ...sourceMetadata,
      },
    }).catch(() => null);

    await trackEngagementEvent({
      userId: user.id,
      eventType: "saved_item",
      city: item.city || null,
      referenceType: item.entityType,
      referenceId: item.entityKey,
      dedupeKey: `saved:${item.intent}:${item.entityType}:${item.entityKey}`,
      metadata: {
        intent: item.intent,
        entityType: item.entityType,
        ...sourceMetadata,
      },
    }).catch(() => null);

    if (item.city) {
      await trackEngagementEvent({
        userId: user.id,
        eventType: "city_explored",
        city: item.city,
        referenceType: item.entityType,
        referenceId: item.entityKey,
        dedupeKey: `city:${item.city.toLowerCase()}:${item.entityType}`,
        metadata: {
          fromIntent: item.intent,
          ...sourceMetadata,
        },
      }).catch(() => null);
    }

    if (item.entityType.startsWith("epl")) {
      await trackEngagementEvent({
        userId: user.id,
        eventType: "epl_followed",
        city: item.city || null,
        referenceType: item.entityType,
        referenceId: item.entityKey,
        dedupeKey: `epl-follow:${item.entityType}:${item.entityKey}`,
        metadata: {
          intent: item.intent,
          ...sourceMetadata,
        },
      }).catch(() => null);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save item." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await request.json()) as {
      intent?: string;
      entityType?: string;
      entityKey?: string;
    };
    if (!body.intent || !body.entityType || !body.entityKey) {
      return NextResponse.json({ error: "Missing delete target." }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("evntszn_saved_items")
      .delete()
      .eq("user_id", user.id)
      .eq("intent", body.intent)
      .eq("entity_type", body.entityType)
      .eq("entity_key", body.entityKey);
    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not remove item." },
      { status: 500 },
    );
  }
}
