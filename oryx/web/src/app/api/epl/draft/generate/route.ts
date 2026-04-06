import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/epl/supabase-admin";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const seasonSlug = body.seasonSlug || "season-1";
  const title = body.title || null;
  const snakeMode = body.snakeMode ?? true;
  const autoIntervalSeconds = body.autoIntervalSeconds ?? 8;
  const mode = body.mode || "resume";

  const supabase = getSupabaseAdmin();

  if (mode === "resume") {
    const { data: existingSession, error: existingSessionError } = await supabase
      .from("epl_v_draft_sessions")
      .select("*")
      .eq("season_slug", seasonSlug)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingSessionError) {
      return NextResponse.json({ error: existingSessionError.message }, { status: 500 });
    }

    if (existingSession) {
      await supabase.rpc("epl_log_draft_action", {
        p_season_slug: seasonSlug,
        p_action_type: "session",
        p_action_label: "Resume Draft Session",
        p_draft_session_id: existingSession.draft_session_id,
        p_details: { mode: "resume" },
      });

      return NextResponse.json({
        ok: true,
        reused: true,
        draftSessionId: existingSession.draft_session_id,
      });
    }
  }

  if (mode === "new") {
    const { error: resetError } = await supabase.rpc("epl_reset_draft_for_season", {
      p_season_slug: seasonSlug,
    });

    if (resetError) {
      return NextResponse.json({ error: resetError.message }, { status: 500 });
    }
  }

  const { data, error } = await supabase.rpc("epl_generate_random_draft_session", {
    p_season_slug: seasonSlug,
    p_title: title,
    p_snake: snakeMode,
    p_auto_interval_seconds: autoIntervalSeconds,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.rpc("epl_log_draft_action", {
    p_season_slug: seasonSlug,
    p_action_type: "session",
    p_action_label: mode === "new" ? "Create New Draft Session" : "Create Draft Session",
    p_draft_session_id: data,
    p_details: {
      mode,
      title,
      snakeMode,
      autoIntervalSeconds,
    },
  });

  return NextResponse.json({
    ok: true,
    reused: false,
    draftSessionId: data,
  });
}
