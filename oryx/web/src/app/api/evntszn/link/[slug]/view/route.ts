import { NextResponse } from "next/server";
import { recordPulseActivity } from "@/lib/pulse-signal";
import { supabaseAdmin } from "@/lib/supabase-admin";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;

    const { data: page, error: pageError } = await supabaseAdmin
      .from("evntszn_link_pages")
      .select("id, city, metadata")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (pageError) {
      return NextResponse.json({ error: pageError.message }, { status: 500 });
    }
    if (!page) {
      return NextResponse.json({ error: "Link page not found." }, { status: 404 });
    }

    const metadata = typeof page.metadata === "object" && page.metadata ? page.metadata : {};
    const currentCount = Number((metadata as Record<string, unknown>).view_count || 0);
    const nextMetadata = {
      ...(metadata as Record<string, unknown>),
      view_count: currentCount + 1,
      last_viewed_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabaseAdmin
      .from("evntszn_link_pages")
      .update({ metadata: nextMetadata })
      .eq("id", page.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await recordPulseActivity({
      sourceType: "link_view",
      city: page.city || (typeof (metadata as Record<string, unknown>).city === "string" ? String((metadata as Record<string, unknown>).city) : null),
      referenceType: "link",
      referenceId: page.id,
      metadata: { slug },
    }).catch(() => null);

    return NextResponse.json({ ok: true, viewCount: currentCount + 1 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not record view." },
      { status: 500 },
    );
  }
}
