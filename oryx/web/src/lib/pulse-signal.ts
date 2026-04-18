import { supabaseAdmin } from "@/lib/supabase-admin";

export type PulseState = "low" | "active" | "rising" | "hot";

export type PulseActivityInput = {
  sourceType:
    | "discover_view"
    | "discover_interaction"
    | "save"
    | "watch"
    | "plan"
    | "reserve_view"
    | "reserve_booking"
    | "reserve_waitlist"
    | "node_view"
    | "node_tap"
    | "link_view"
    | "epl_view"
    | "epl_registration"
    | "crew_request";
  city?: string | null;
  areaLabel?: string | null;
  userId?: string | null;
  sessionKey?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  metadata?: Record<string, unknown>;
};

type PulseStateRow = {
  city: string;
  area_label: string;
  score: number;
  state: PulseState;
  signal_count: number;
  last_activity_at: string;
};

const PULSE_WEIGHTS: Record<PulseActivityInput["sourceType"], number> = {
  discover_view: 1,
  discover_interaction: 2,
  save: 3,
  watch: 2,
  plan: 4,
  reserve_view: 3,
  reserve_booking: 8,
  reserve_waitlist: 7,
  node_view: 2,
  node_tap: 8,
  link_view: 2,
  epl_view: 2,
  epl_registration: 6,
  crew_request: 4,
};

export function calculatePulseState(score: number): PulseState {
  if (score >= 45) return "hot";
  if (score >= 25) return "rising";
  if (score >= 10) return "active";
  return "low";
}

export async function recordPulseActivity(input: PulseActivityInput) {
  if (!input.city) return;
  const areaLabel = normalizeAreaLabel(input.areaLabel);
  const weight = PULSE_WEIGHTS[input.sourceType] || 1;
  const now = new Date().toISOString();

  await supabaseAdmin.from("evntszn_pulse_activity").insert({
    source_type: input.sourceType,
    city: input.city,
    area_label: areaLabel,
    actor_user_id: input.userId || null,
    session_key: input.sessionKey || null,
    reference_type: input.referenceType || null,
    reference_id: input.referenceId || null,
    weight,
    metadata: input.metadata || {},
  });

  const since = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();
  const query = supabaseAdmin
    .from("evntszn_pulse_activity")
    .select("weight, actor_user_id, session_key")
    .eq("city", input.city)
    .gte("created_at", since);

  const scopedQuery = query.eq("area_label", areaLabel);
  const { data } = await scopedQuery;
  const rows = data || [];
  const score = rows.reduce((sum, row: { weight: number | null }) => sum + Number(row.weight || 0), 0);
  const uniqueActors = new Set(
    rows.map((row: { actor_user_id?: string | null; session_key?: string | null }) => row.actor_user_id || row.session_key || crypto.randomUUID()),
  );
  const adjustedScore = score + uniqueActors.size;
  const state = calculatePulseState(adjustedScore);

  await supabaseAdmin
    .from("evntszn_pulse_states")
    .upsert(
      {
        city: input.city,
        area_label: areaLabel,
        score: adjustedScore,
        state,
        signal_count: rows.length,
        last_activity_at: now,
      },
      { onConflict: "city,area_label" },
    );
}

export async function getPulseStateSnapshot(city?: string | null, areaLabel?: string | null) {
  if (!city) return null;
  const normalizedArea = normalizeAreaLabel(areaLabel);
  const query = supabaseAdmin
    .from("evntszn_pulse_states")
    .select("city, area_label, score, state, signal_count, last_activity_at")
    .eq("city", city)
    .eq("area_label", normalizedArea)
    .limit(1);
  const { data } = await query.maybeSingle();
  return (data as PulseStateRow | null) || null;
}

export async function getPulseStatesByCity(cities: string[]) {
  if (!cities.length) return new Map<string, PulseStateRow>();
  const { data } = await supabaseAdmin
    .from("evntszn_pulse_states")
    .select("city, area_label, score, state, signal_count, last_activity_at")
    .in("city", cities);
  const rows = (data || []) as PulseStateRow[];
  return new Map(rows.filter((row) => row.area_label === "").map((row) => [row.city.toLowerCase(), row]));
}

function normalizeAreaLabel(value: string | null | undefined) {
  return String(value || "").trim();
}
