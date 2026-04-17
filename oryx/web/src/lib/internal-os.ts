import { supabaseAdmin } from "@/lib/supabase-admin";

export const INTERNAL_DESK_SLUGS = {
  organizer: "organizer",
  host: "host",
  venue: "venue",
  reserve: "reserve",
  partner: "partner",
  crew: "crew",
  agreements: "agreements",
  eplOps: "epl-ops",
  alerts: "alerts",
} as const;

type InternalDeskSlug = (typeof INTERNAL_DESK_SLUGS)[keyof typeof INTERNAL_DESK_SLUGS];

type WorkItemInput = {
  deskSlug: InternalDeskSlug;
  title: string;
  description?: string | null;
  priority?: "low" | "medium" | "high" | "critical";
  assignedTo?: string | null;
  payload?: Record<string, unknown>;
};

const deskIdCache = new Map<string, string>();

async function getDeskIdBySlug(slug: InternalDeskSlug) {
  const cached = deskIdCache.get(slug);
  if (cached) return cached;

  const { data, error } = await supabaseAdmin
    .from("internal_desks")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data?.id) {
    throw new Error(`Internal desk "${slug}" is not configured.`);
  }

  deskIdCache.set(slug, data.id);
  return data.id;
}

export async function createInternalWorkItem(input: WorkItemInput) {
  const deskId = await getDeskIdBySlug(input.deskSlug);

  const { data, error } = await supabaseAdmin
    .from("internal_work_items")
    .insert({
      desk_id: deskId,
      title: input.title,
      description: input.description || null,
      priority: input.priority || "medium",
      assigned_to: input.assignedTo || null,
      payload: input.payload || {},
    })
    .select("id, status, created_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function createPerformanceAlertWorkItem(input: {
  entityType: string;
  entityId: string;
  title: string;
  score: number;
  priority?: "low" | "medium" | "high" | "critical";
  payload?: Record<string, unknown>;
}) {
  const deskId = await getDeskIdBySlug(INTERNAL_DESK_SLUGS.alerts);
  const alertKey = `${input.entityType}:${input.entityId}:${input.title}`;

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("internal_work_items")
    .select("id")
    .eq("desk_id", deskId)
    .in("status", ["open", "in_progress"])
    .contains("payload", { alertKey })
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }
  if (existing?.id) {
    return existing;
  }

  return createInternalWorkItem({
    deskSlug: INTERNAL_DESK_SLUGS.alerts,
    title: input.title,
    description: `Performance alert for ${input.entityType} ${input.entityId}.`,
    priority: input.priority || "high",
    payload: {
      alertKey,
      alertType: "performance_threshold",
      entityType: input.entityType,
      entityId: input.entityId,
      score: input.score,
      ...(input.payload || {}),
    },
  });
}
