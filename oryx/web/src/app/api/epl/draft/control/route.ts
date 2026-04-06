import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/epl/supabase-admin";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const { sessionId, action, autoMode, autoIntervalSeconds, pickNumber } = body;

  const supabase = getSupabaseAdmin();

  const { data: sessionRow, error: sessionError } = await supabase
    .from("epl_v_draft_sessions")
    .select("*")
    .eq("draft_session_id", sessionId)
    .maybeSingle();

  if (sessionError || !sessionRow) {
    return NextResponse.json(
      { error: sessionError?.message || "Draft session not found." },
      { status: 404 }
    );
  }

  const currentPick = sessionRow.current_pick_number || 0;
  const totalPicks = sessionRow.total_picks || 72;

  if (action === "next") {
    const nextPick = Math.min(currentPick + 1, totalPicks);

    const { error } = await supabase
      .schema("epl")
      .from("draft_sessions")
      .update({
        current_pick_number: nextPick,
        status: nextPick >= totalPicks ? "completed" : "live",
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase.rpc("epl_log_draft_action", {
      p_season_slug: sessionRow.season_slug,
      p_action_type: "control",
      p_action_label: "Next Pick",
      p_draft_session_id: sessionId,
      p_details: { from_pick: currentPick, to_pick: nextPick },
    });

    return NextResponse.json({ ok: true });
  }

  if (action === "prev") {
    const prevPick = Math.max(currentPick - 1, 0);

    const { error } = await supabase
      .schema("epl")
      .from("draft_sessions")
      .update({
        current_pick_number: prevPick,
        status: prevPick === 0 ? "ready" : "paused",
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase.rpc("epl_log_draft_action", {
      p_season_slug: sessionRow.season_slug,
      p_action_type: "control",
      p_action_label: "Previous Pick",
      p_draft_session_id: sessionId,
      p_details: { from_pick: currentPick, to_pick: prevPick },
    });

    return NextResponse.json({ ok: true });
  }

  if (action === "jump") {
    const boundedPick = Math.max(0, Math.min(Number(pickNumber || 0), totalPicks));

    const { error } = await supabase
      .schema("epl")
      .from("draft_sessions")
      .update({
        current_pick_number: boundedPick,
        status: boundedPick === 0 ? "ready" : boundedPick >= totalPicks ? "completed" : "paused",
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase.rpc("epl_log_draft_action", {
      p_season_slug: sessionRow.season_slug,
      p_action_type: "control",
      p_action_label: "Jump To Pick",
      p_draft_session_id: sessionId,
      p_details: { from_pick: currentPick, to_pick: boundedPick },
    });

    return NextResponse.json({ ok: true });
  }

  if (action === "auto") {
    const { error } = await supabase
      .schema("epl")
      .from("draft_sessions")
      .update({
        auto_mode: !!autoMode,
        auto_interval_seconds: autoIntervalSeconds || sessionRow.auto_interval_seconds || 12,
        status: !!autoMode ? "live" : "paused",
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase.rpc("epl_log_draft_action", {
      p_season_slug: sessionRow.season_slug,
      p_action_type: "control",
      p_action_label: !!autoMode ? "Start Auto" : "Pause Auto",
      p_draft_session_id: sessionId,
      p_details: {
        auto_mode: !!autoMode,
        auto_interval_seconds: autoIntervalSeconds || sessionRow.auto_interval_seconds || 12,
      },
    });

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
}
