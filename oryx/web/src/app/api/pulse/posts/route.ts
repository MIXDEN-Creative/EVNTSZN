import { NextResponse } from "next/server";
import { buildActivitySourceMetadata } from "@/lib/activity-source";
import { requireAdminPermission } from "@/lib/admin-auth";
import { trackEngagementEvent } from "@/lib/engagement";
import {
  canAccessInternalPulse,
  createFallbackPulsePost,
  getPulseModeratorContext,
  hasPulsePostPersistence,
  updateFallbackPulsePost,
} from "@/lib/pulse";
import { getPlatformViewer } from "@/lib/evntszn";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const viewer = await getPlatformViewer();
    if (!viewer.user || !canAccessInternalPulse(viewer)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }
    const moderationContext = await getPulseModeratorContext(viewer);
    if (moderationContext.userControl.isSuspended) {
      return NextResponse.json({ error: "Pulse posting is suspended for this account." }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const title = String(body.title || "").trim();
    const content = String(body.body || "").trim();
    const visibility = String(body.visibility || "internal").trim() === "public" ? "public" : "internal";

    if (!title || !content) {
      return NextResponse.json({ error: "Title and body are required." }, { status: 400 });
    }

    if (visibility === "public") {
      if (!viewer.isPlatformAdmin && !moderationContext.canModerate) {
        return NextResponse.json({ error: "Public Pulse publishing requires moderator authority." }, { status: 403 });
      }
      await requireAdminPermission("admin.manage", "/epl/admin/pulse");
    }

    if (!(await hasPulsePostPersistence())) {
      await createFallbackPulsePost({
        title,
        body: content,
        city: String(body.city || "").trim() || null,
        visibility,
        createdByUserId: viewer.user.id,
        isBolt: visibility === "internal" && canAccessInternalPulse(viewer),
      });
    } else {
      const { error } = await supabaseAdmin.from("evntszn_pulse_posts").insert({
        title,
        body: content,
        city: String(body.city || "").trim() || null,
        visibility,
        status: "published",
        source_type: visibility === "public" ? "admin_signal" : "ops_signal",
        source_label: visibility === "public" ? "EVNTSZN Pulse" : "Internal Ops",
        created_by_user_id: viewer.user.id,
        bolt_only: visibility === "internal" && canAccessInternalPulse(viewer),
      });

      if (error) {
        return NextResponse.json({ error: "Pulse publishing could not be completed." }, { status: 500 });
      }
    }

    await trackEngagementEvent({
      userId: viewer.user.id,
      eventType: "pulse_posted",
      city: String(body.city || "").trim() || viewer.profile?.city || null,
      referenceType: "pulse",
      referenceId: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 48) || "post",
      dedupeKey: `pulse-post:${viewer.user.id}:${title.toLowerCase().slice(0, 24)}`,
      metadata: {
        visibility,
        ...buildActivitySourceMetadata({
          sourceType: visibility === "public" ? "evntszn_native" : "evntszn_native",
          referenceType: "pulse",
          entityType: "pulse_post",
          metadata: { visibility },
        }),
      },
    }).catch(() => null);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save Pulse post." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdminPermission("admin.manage", "/epl/admin/pulse");
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const id = String(body.id || "").trim();
    const status = String(body.status || "").trim() || "archived";

    if (!id) {
      return NextResponse.json({ error: "Post id is required." }, { status: 400 });
    }

    if (!(await hasPulsePostPersistence())) {
      await updateFallbackPulsePost(id, { postStatus: status === "published" ? "published" : "archived" });
    } else {
      const { error } = await supabaseAdmin
        .from("evntszn_pulse_posts")
        .update({ status })
        .eq("id", id);

      if (error) {
        return NextResponse.json({ error: "Pulse post update could not be completed." }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update Pulse post." }, { status: 500 });
  }
}
