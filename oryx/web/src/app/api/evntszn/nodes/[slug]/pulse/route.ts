import { NextResponse } from "next/server";
import { buildNodeActivityScore } from "@/lib/nodes";
import { averagePulseVote } from "@/lib/platform-products";
import { supabaseAdmin } from "@/lib/supabase-admin";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

function summarizeVotes(
  votes: Array<{
    energy_level: number | null;
    crowd_density: number | null;
    music_vibe: number | null;
    bar_activity: number | null;
  }>,
) {
  if (!votes.length) return null;

  const totals = votes.reduce(
    (acc, vote) => {
      acc.energy += Number(vote.energy_level || 0);
      acc.crowd += Number(vote.crowd_density || 0);
      acc.music += Number(vote.music_vibe || 0);
      acc.bar += Number(vote.bar_activity || 0);
      return acc;
    },
    { energy: 0, crowd: 0, music: 0, bar: 0 },
  );

  return averagePulseVote({
    energyLevel: Math.round((totals.energy / votes.length) * 10) / 10,
    crowdDensity: Math.round((totals.crowd / votes.length) * 10) / 10,
    musicVibe: Math.round((totals.music / votes.length) * 10) / 10,
    barActivity: Math.round((totals.bar / votes.length) * 10) / 10,
  });
}

async function getPulseSummary(slug: string) {
  const { data: node, error } = await supabaseAdmin
    .from("evntszn_nodes")
    .select("id, node_type, status, city, event_id, venue_id, pulse_mode")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!node) {
    return { notFound: true as const };
  }

  const windowStart = new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString();
  const [interactionRes, eventVotesRes] = await Promise.all([
    supabaseAdmin
      .from("evntszn_node_interactions")
      .select("interaction_type, actor_user_id, session_key, interaction_fingerprint, created_at")
      .eq("node_id", node.id)
      .gte("created_at", windowStart),
    node.event_id
      ? supabaseAdmin
          .from("evntszn_event_pulse_votes")
          .select("energy_level, crowd_density, music_vibe, bar_activity")
          .eq("event_id", node.event_id)
          .gte("created_at", windowStart)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (interactionRes.error) throw new Error(interactionRes.error.message);
  if (eventVotesRes.error) throw new Error(eventVotesRes.error.message);

  let basePulseScore = summarizeVotes(eventVotesRes.data || []);
  let nearbyEventCount = node.event_id ? 1 : 0;

  if (!basePulseScore && (node.node_type === "venue_node" || node.pulse_mode === "venue") && node.venue_id) {
    const eventsRes = await supabaseAdmin
      .from("evntszn_events")
      .select("id")
      .eq("venue_id", node.venue_id)
      .eq("visibility", "published")
      .eq("status", "published")
      .gte("end_at", new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString())
      .limit(12);
    if (eventsRes.error) throw new Error(eventsRes.error.message);
    const eventIds = (eventsRes.data || []).map((row) => row.id);
    nearbyEventCount = eventIds.length;
    if (eventIds.length) {
      const votesRes = await supabaseAdmin
        .from("evntszn_event_pulse_votes")
        .select("energy_level, crowd_density, music_vibe, bar_activity")
        .in("event_id", eventIds)
        .gte("created_at", windowStart);
      if (votesRes.error) throw new Error(votesRes.error.message);
      basePulseScore = summarizeVotes(votesRes.data || []);
    }
  }

  if (!basePulseScore && (node.node_type === "area_node" || node.pulse_mode === "area") && node.city) {
    const eventsRes = await supabaseAdmin
      .from("evntszn_events")
      .select("id")
      .ilike("city", node.city)
      .eq("visibility", "published")
      .eq("status", "published")
      .gte("end_at", new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString())
      .limit(18);
    if (eventsRes.error) throw new Error(eventsRes.error.message);
    const eventIds = (eventsRes.data || []).map((row) => row.id);
    nearbyEventCount = eventIds.length;
    if (eventIds.length) {
      const votesRes = await supabaseAdmin
        .from("evntszn_event_pulse_votes")
        .select("energy_level, crowd_density, music_vibe, bar_activity")
        .in("event_id", eventIds)
        .gte("created_at", windowStart);
      if (votesRes.error) throw new Error(votesRes.error.message);
      basePulseScore = summarizeVotes(votesRes.data || []);
    }
  }

  const rows = interactionRes.data || [];
  const counts = rows.reduce(
    (acc, row) => {
      if (row.interaction_type === "view") acc.views += 1;
      if (row.interaction_type === "tap") acc.taps += 1;
      if (row.interaction_type === "reaction") acc.reactions += 1;
      const uniqueKey = row.actor_user_id || row.session_key || row.interaction_fingerprint || row.created_at;
      acc.unique.add(uniqueKey);
      return acc;
    },
    { views: 0, taps: 0, reactions: 0, unique: new Set<string>() },
  );

  const described = buildNodeActivityScore({
    basePulseScore,
    views: counts.views,
    taps: counts.taps,
    reactions: counts.reactions,
  });

  return {
    notFound: false as const,
    score: described.score,
    label: described.label,
    summary: described.summary,
    views: counts.views,
    taps: counts.taps,
    reactions: counts.reactions,
    uniqueInteractions: counts.unique.size,
    nearbyEventCount,
    isLive: rows.length > 0 || Boolean(basePulseScore),
  };
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const summary = await getPulseSummary(slug);
    if (summary.notFound) {
      return NextResponse.json({ error: "Node not found." }, { status: 404 });
    }
    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load node pulse." },
      { status: 500 },
    );
  }
}
