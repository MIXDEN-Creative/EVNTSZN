import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

function buildFingerprint(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const ua = request.headers.get("user-agent") || "unknown";
  return crypto.createHash("sha256").update(`${ip}|${ua}`).digest("hex");
}

async function getViewerUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      interactionType?: "view" | "tap" | "reaction";
      sessionKey?: string;
      source?: string;
      reaction?: string;
      city?: string;
    };

    const interactionType = body.interactionType || "view";
    if (!["view", "tap", "reaction"].includes(interactionType)) {
      return NextResponse.json({ error: "Unsupported node interaction type." }, { status: 400 });
    }

    const { data: node, error: nodeError } = await supabaseAdmin
      .from("evntszn_nodes")
      .select("id, slug, status")
      .eq("slug", slug)
      .eq("status", "active")
      .maybeSingle();
    if (nodeError) throw new Error(nodeError.message);
    if (!node) return NextResponse.json({ error: "Node not found." }, { status: 404 });

    const [user] = await Promise.all([getViewerUser()]);
    const sessionKey = String(body.sessionKey || "").trim() || null;
    const fingerprint = buildFingerprint(request);
    const dedupeWindowMs = interactionType === "reaction" ? 1000 * 60 * 60 * 6 : 1000 * 45;
    const since = new Date(Date.now() - dedupeWindowMs).toISOString();

    let existingQuery = supabaseAdmin
      .from("evntszn_node_interactions")
      .select("id")
      .eq("node_id", node.id)
      .eq("interaction_type", interactionType)
      .gte("created_at", since)
      .limit(1);

    if (user) {
      existingQuery = existingQuery.eq("actor_user_id", user.id);
    } else if (sessionKey) {
      existingQuery = existingQuery.eq("session_key", sessionKey);
    } else {
      existingQuery = existingQuery.eq("interaction_fingerprint", fingerprint);
    }

    const existingRes = await existingQuery.maybeSingle();
    if (existingRes.error) throw new Error(existingRes.error.message);

    if (!existingRes.data) {
      const { error: insertError } = await supabaseAdmin.from("evntszn_node_interactions").insert({
        node_id: node.id,
        interaction_type: interactionType,
        interaction_day: new Date().toISOString().slice(0, 10),
        actor_user_id: user?.id || null,
        session_key: sessionKey,
        interaction_fingerprint: user ? null : fingerprint,
        source: String(body.source || "node_page"),
        referrer: request.headers.get("referer"),
        city: String(body.city || "").trim() || null,
        metadata: body.reaction ? { reaction: String(body.reaction) } : {},
      });
      if (insertError) throw new Error(insertError.message);
    }

    await supabaseAdmin
      .from("evntszn_nodes")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", node.id);

    return NextResponse.json({ ok: true, deduped: Boolean(existingRes.data) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not record node interaction." },
      { status: 500 },
    );
  }
}
