import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildLinkClickFingerprint, LINK_CLICK_COOKIE, serializeLinkClickCookie } from "@/lib/link-attribution";
import { supabaseAdmin } from "@/lib/supabase-admin";

async function getViewerUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      eventId?: string;
      targetPath?: string;
      sessionKey?: string;
      source?: string;
    };

    if (!body.eventId) {
      return NextResponse.json({ error: "Event is required." }, { status: 400 });
    }

    const [user, linkPageRes] = await Promise.all([
      getViewerUser(),
      supabaseAdmin
        .from("evntszn_link_pages")
        .select("id, user_id")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle(),
    ]);

    if (linkPageRes.error) throw new Error(linkPageRes.error.message);
    if (!linkPageRes.data) {
      return NextResponse.json({ error: "Link page not found." }, { status: 404 });
    }

    const fingerprint = buildLinkClickFingerprint(request);
    const sessionKey = String(body.sessionKey || "").trim() || null;
    const dedupeCutoff = new Date(Date.now() - 1000 * 30).toISOString();
    let dedupeQuery = supabaseAdmin
      .from("evntszn_link_event_clicks")
      .select("id, created_at")
      .eq("link_page_id", linkPageRes.data.id)
      .eq("event_id", body.eventId)
      .gte("created_at", dedupeCutoff)
      .order("created_at", { ascending: false })
      .limit(1);

    if (user?.id) {
      dedupeQuery = dedupeQuery.eq("clicked_by_user_id", user.id);
    } else if (sessionKey) {
      dedupeQuery = dedupeQuery.eq("session_key", sessionKey);
    } else {
      dedupeQuery = dedupeQuery.eq("click_fingerprint", fingerprint);
    }

    const { data: existingClick, error: existingError } = await dedupeQuery.maybeSingle();
    if (existingError) throw new Error(existingError.message);

    const clickId =
      existingClick?.id ||
      (
        await supabaseAdmin
          .from("evntszn_link_event_clicks")
          .insert({
            link_page_id: linkPageRes.data.id,
            link_owner_user_id: linkPageRes.data.user_id,
            event_id: body.eventId,
            clicked_by_user_id: user?.id || null,
            session_key: sessionKey,
            click_fingerprint: fingerprint,
            source: String(body.source || "link_page"),
            referrer: request.headers.get("referer"),
            target_path: String(body.targetPath || "").trim() || null,
            metadata: {
              userAgent: request.headers.get("user-agent"),
            },
          })
          .select("id, created_at")
          .single()
      ).data?.id;

    const response = NextResponse.json({ ok: true, clickId });
    if (clickId) {
      response.cookies.set(
        LINK_CLICK_COOKIE,
        serializeLinkClickCookie({ clickId, eventId: body.eventId, clickedAt: Date.now() }),
        {
          httpOnly: false,
          sameSite: "lax",
          secure: true,
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        },
      );
    }
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not record Link click." },
      { status: 500 },
    );
  }
}
