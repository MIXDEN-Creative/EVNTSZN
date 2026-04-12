import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { averagePulseVote, describePulseScore } from "@/lib/platform-products";

type RouteContext = {
  params: Promise<{ eventId: string }>;
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

async function getPulseSummary(eventId: string) {
  const { data, error } = await supabaseAdmin
    .from("evntszn_event_pulse_votes")
    .select("energy_level, crowd_density, music_vibe, bar_activity, created_at")
    .eq("event_id", eventId)
    .gte("created_at", new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString())
    .order("created_at", { ascending: false })
    .limit(250);

  if (error) {
    throw new Error(error.message);
  }

  const votes = data || [];
  if (!votes.length) {
    return {
      count: 0,
      score: null,
      label: "No pulse yet",
      summary: "Be the first to rate the room.",
      breakdown: null,
    };
  }

  const breakdown = votes.reduce(
    (acc, vote) => {
      acc.energy += Number(vote.energy_level || 0);
      acc.crowd += Number(vote.crowd_density || 0);
      acc.music += Number(vote.music_vibe || 0);
      acc.bar += Number(vote.bar_activity || 0);
      return acc;
    },
    { energy: 0, crowd: 0, music: 0, bar: 0 },
  );

  const averages = {
    energy: Math.round((breakdown.energy / votes.length) * 10) / 10,
    crowd: Math.round((breakdown.crowd / votes.length) * 10) / 10,
    music: Math.round((breakdown.music / votes.length) * 10) / 10,
    bar: Math.round((breakdown.bar / votes.length) * 10) / 10,
  };
  const score = averagePulseVote({
    energyLevel: averages.energy,
    crowdDensity: averages.crowd,
    musicVibe: averages.music,
    barActivity: averages.bar,
  });
  const described = describePulseScore(score);

  return {
    count: votes.length,
    score,
    label: described.label,
    summary: described.summary,
    breakdown: averages,
  };
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { eventId } = await context.params;
    const summary = await getPulseSummary(eventId);
    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load pulse." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { eventId } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      energyLevel?: number;
      crowdDensity?: number;
      musicVibe?: number;
      barActivity?: number;
    };

    const scores = {
      energyLevel: Number(body.energyLevel || 0),
      crowdDensity: Number(body.crowdDensity || 0),
      musicVibe: Number(body.musicVibe || 0),
      barActivity: Number(body.barActivity || 0),
    };

    const values = Object.values(scores);
    if (values.some((value) => !Number.isFinite(value) || value < 1 || value > 10)) {
      return NextResponse.json({ error: "All pulse scores must be between 1 and 10." }, { status: 400 });
    }

    const [user, eventRes] = await Promise.all([
      getViewerUser(),
      supabaseAdmin.from("evntszn_events").select("id").eq("id", eventId).maybeSingle(),
    ]);
    if (eventRes.error) throw new Error(eventRes.error.message);
    if (!eventRes.data) return NextResponse.json({ error: "Event not found." }, { status: 404 });

    const { error } = await supabaseAdmin.from("evntszn_event_pulse_votes").insert({
      event_id: eventId,
      voter_user_id: user?.id || null,
      voter_fingerprint: user ? null : buildFingerprint(request),
      vote_day: new Date().toISOString().slice(0, 10),
      energy_level: scores.energyLevel,
      crowd_density: scores.crowdDensity,
      music_vibe: scores.musicVibe,
      bar_activity: scores.barActivity,
      source: "event_page",
      metadata: {
        userAgent: request.headers.get("user-agent"),
      },
    });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "You already submitted a pulse update for this event today." }, { status: 409 });
      }
      throw new Error(error.message);
    }

    const summary = await getPulseSummary(eventId);
    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not submit pulse vote." },
      { status: 500 },
    );
  }
}
