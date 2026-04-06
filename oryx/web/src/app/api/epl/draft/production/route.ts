import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/epl/supabase-admin";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { sessionId, state, message, sponsorMessage, revealDurationMs } = body;

  const supabase = getSupabaseAdmin();

  const { error } = await supabase.rpc("epl_set_production_state", {
    p_session_id: sessionId,
    p_state: state,
    p_message: message || null,
    p_sponsor_message: sponsorMessage || null,
    p_reveal_duration_ms: revealDurationMs || null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
