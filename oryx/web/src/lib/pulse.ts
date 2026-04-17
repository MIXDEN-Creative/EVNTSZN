import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  createSystemLogEntry,
  hasSystemLogLedger,
  listSystemLogEntries,
  updateSystemLogEntry,
  type SystemLogRow,
} from "@/lib/system-log-ledger";
import type { getPlatformViewer } from "@/lib/evntszn";
import { isMidnightRunEvent } from "@/lib/events-runtime";

type Viewer = Awaited<ReturnType<typeof getPlatformViewer>>;

type PulsePostRow = {
  id: string;
  visibility: "public" | "internal";
  status: "draft" | "published" | "archived";
  title: string;
  body: string;
  city: string | null;
  source_type: string | null;
  source_label: string | null;
  pulse_score: number | null;
  reservation_signal: string | null;
  is_featured: boolean;
  bolt_only: boolean;
  created_at: string;
  metadata?: Record<string, unknown> | null;
};

export type PulseFeedItem = {
  id: string;
  title: string;
  body: string;
  city: string | null;
  visibility: "public" | "internal";
  sourceType: string;
  sourceLabel: string;
  pulseScore: number | null;
  reservationSignal: string | null;
  createdAt: string;
  isFeatured: boolean;
  isBolt: boolean;
};

export type PulseModeratorContext = {
  canModerate: boolean;
  canAssign: boolean;
  canOverride: boolean;
  scopeType: "global" | "city" | "custom" | "none";
  cityScope: string[];
  userControl: {
    isMuted: boolean;
    isSuspended: boolean;
  };
};

let pulsePostTableAvailable: boolean | null = null;
let pulseModerationTablesAvailable: boolean | null = null;

const FALLBACK_PULSE_POST_SOURCE = "pulse_post";
const FALLBACK_PULSE_MODERATOR_SOURCE = "pulse_moderator";
const FALLBACK_PULSE_CONTROL_SOURCE = "pulse_user_control";
const FALLBACK_PULSE_ACTION_SOURCE = "pulse_moderation_action";

const BOLT_ROLE_KEYS = new Set([
  "founder",
  "admin",
  "pro_host",
  "city_leader",
  "city_commissioner",
  "deputy_commissioner",
  "hq_operator",
  "host_development_manager",
  "epl_operator",
]);

function coerceFeedItem(input: {
  id: string;
  title: string;
  body: string;
  city?: string | null;
  visibility: "public" | "internal";
  sourceType: string;
  sourceLabel: string;
  pulseScore?: number | null;
  reservationSignal?: string | null;
  createdAt: string;
  isFeatured?: boolean;
  isBolt?: boolean;
}): PulseFeedItem {
  return {
    id: input.id,
    title: input.title,
    body: input.body,
    city: input.city || null,
    visibility: input.visibility,
    sourceType: input.sourceType,
    sourceLabel: input.sourceLabel,
    pulseScore: input.pulseScore ?? null,
    reservationSignal: input.reservationSignal ?? null,
    createdAt: input.createdAt,
    isFeatured: input.isFeatured === true,
    isBolt: input.isBolt === true,
  };
}

function getLogContext(row: SystemLogRow) {
  return row.context && typeof row.context === "object" && !Array.isArray(row.context)
    ? (row.context as Record<string, unknown>)
    : {};
}

export function hasPurpleBolt(viewer: Pick<Viewer, "isPlatformAdmin" | "operatorProfile"> | null | undefined) {
  if (!viewer) return false;
  if (viewer.isPlatformAdmin) return true;
  const operator = viewer.operatorProfile;
  if (!operator?.is_active) return false;
  return (
    BOLT_ROLE_KEYS.has(operator.role_key) ||
    operator.dashboard_access.includes("hq") ||
    operator.dashboard_access.includes("admin") ||
    operator.dashboard_access.includes("city")
  );
}

export async function hasPulsePostPersistence() {
  if (pulsePostTableAvailable !== null) {
    return pulsePostTableAvailable;
  }

  const { error } = await supabaseAdmin.from("evntszn_pulse_posts").select("id").limit(1);
  pulsePostTableAvailable = !error;
  return pulsePostTableAvailable;
}

export async function hasPulseModerationPersistence() {
  if (pulseModerationTablesAvailable !== null) {
    return pulseModerationTablesAvailable;
  }

  const { error } = await supabaseAdmin.from("evntszn_pulse_moderators").select("user_id").limit(1);
  pulseModerationTablesAvailable = !error;
  return pulseModerationTablesAvailable;
}

export async function listFallbackPulsePosts(visibility: "public" | "internal") {
  if (!(await hasSystemLogLedger())) return [];
  const rows = await listSystemLogEntries([FALLBACK_PULSE_POST_SOURCE], 150);
  return rows
    .filter((row) => {
      const context = getLogContext(row);
      return (
        context.visibility === visibility &&
        !isMidnightRunEvent({ slug: String(context.slug || ""), title: String(context.title || row.message) }) &&
        String(context.postStatus || "published") === "published"
      );
    })
    .map((row) => {
      const context = getLogContext(row);
      return coerceFeedItem({
        id: row.id,
        title: String(context.title || row.message),
        body: String(context.body || row.message),
        city: typeof context.city === "string" ? context.city : null,
        visibility,
        sourceType: String(context.sourceType || (visibility === "public" ? "pulse_post" : "ops_signal")),
        sourceLabel: String(context.sourceLabel || (visibility === "public" ? "EVNTSZN Pulse" : "Internal Ops")),
        pulseScore: typeof context.pulseScore === "number" ? context.pulseScore : null,
        reservationSignal: typeof context.reservationSignal === "string" ? context.reservationSignal : null,
        createdAt: row.occurred_at,
        isFeatured: Boolean(context.isFeatured),
        isBolt: Boolean(context.isBolt),
      });
    });
}

export async function createFallbackPulsePost(input: {
  title: string;
  body: string;
  city?: string | null;
  visibility: "public" | "internal";
  createdByUserId: string;
  isBolt?: boolean;
}) {
  const row = await createSystemLogEntry({
    source: FALLBACK_PULSE_POST_SOURCE,
    severity: input.visibility === "internal" ? "warning" : "info",
    status: "open",
    message: input.title,
    context: {
      title: input.title,
      body: input.body,
      city: input.city || null,
      visibility: input.visibility,
      postStatus: "published",
      moderationState: "clear",
      sourceType: input.visibility === "public" ? "admin_signal" : "ops_signal",
      sourceLabel: input.visibility === "public" ? "EVNTSZN Pulse" : "Internal Ops",
      createdByUserId: input.createdByUserId,
      isBolt: Boolean(input.isBolt),
    },
  });
  return row.id;
}

export async function updateFallbackPulsePost(
  id: string,
  input: {
    postStatus?: "draft" | "published" | "archived";
    moderationState?: "clear" | "flagged" | "hidden" | "removed" | "restored";
    moderationReason?: string | null;
    moderationNote?: string | null;
    escalatedToUserId?: string | null;
    moderatedByUserId?: string | null;
  },
) {
  await updateSystemLogEntry(id, {
    status: input.postStatus === "published" ? "open" : "resolved",
    context: {
      postStatus: input.postStatus,
      moderationState: input.moderationState,
      moderationReason: input.moderationReason || null,
      moderationNote: input.moderationNote || null,
      escalatedToUserId: input.escalatedToUserId || null,
      moderatedByUserId: input.moderatedByUserId || null,
      moderatedAt: input.moderatedByUserId ? new Date().toISOString() : null,
    },
    resolvedAt: input.postStatus === "published" ? null : new Date().toISOString(),
  });
}

export async function listFallbackModeratorAssignments() {
  if (!(await hasSystemLogLedger())) return [];
  const rows = await listSystemLogEntries([FALLBACK_PULSE_MODERATOR_SOURCE], 150);
  const latest = new Map<string, SystemLogRow>();
  for (const row of rows) {
    const context = getLogContext(row);
    const userId = typeof context.targetUserId === "string" ? context.targetUserId : null;
    if (userId && !latest.has(userId)) latest.set(userId, row);
  }
  return [...latest.values()].filter((row) => Boolean(getLogContext(row).isActive));
}

export async function listFallbackUserControls() {
  if (!(await hasSystemLogLedger())) return [];
  const rows = await listSystemLogEntries([FALLBACK_PULSE_CONTROL_SOURCE], 150);
  const latest = new Map<string, SystemLogRow>();
  for (const row of rows) {
    const context = getLogContext(row);
    const userId = typeof context.targetUserId === "string" ? context.targetUserId : null;
    if (userId && !latest.has(userId)) latest.set(userId, row);
  }
  return [...latest.values()];
}

export async function logFallbackPulseAction(input: {
  pulsePostId?: string | null;
  targetUserId?: string | null;
  moderatorUserId?: string | null;
  actionType: string;
  city?: string | null;
  scopeType?: string | null;
  reason?: string | null;
  note?: string | null;
  assignedToUserId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await createSystemLogEntry({
    source: FALLBACK_PULSE_ACTION_SOURCE,
    severity: "warning",
    status: "open",
    message: input.actionType,
    context: {
      pulsePostId: input.pulsePostId || null,
      targetUserId: input.targetUserId || null,
      moderatorUserId: input.moderatorUserId || null,
      actionType: input.actionType,
      city: input.city || null,
      scopeType: input.scopeType || null,
      reason: input.reason || null,
      note: input.note || null,
      assignedToUserId: input.assignedToUserId || null,
      ...(input.metadata || {}),
    },
  });
}

export async function assignFallbackPulseModerator(input: {
  targetUserId: string;
  scopeType: string;
  cityScope: string[];
  note?: string | null;
  grantedByUserId?: string | null;
}) {
  await createSystemLogEntry({
    source: FALLBACK_PULSE_MODERATOR_SOURCE,
    severity: "info",
    status: "open",
    message: `Moderator assignment for ${input.targetUserId}`,
    context: {
      targetUserId: input.targetUserId,
      scopeType: input.scopeType,
      cityScope: input.cityScope,
      isActive: true,
      canAssign: false,
      canOverride: false,
      note: input.note || null,
      grantedByUserId: input.grantedByUserId || null,
    },
  });
}

export async function removeFallbackPulseModerator(targetUserId: string, note?: string | null) {
  await createSystemLogEntry({
    source: FALLBACK_PULSE_MODERATOR_SOURCE,
    severity: "info",
    status: "resolved",
    message: `Moderator removed for ${targetUserId}`,
    context: {
      targetUserId,
      isActive: false,
      note: note || null,
    },
  });
}

export async function setFallbackPulseUserControl(input: {
  targetUserId: string;
  isMuted: boolean;
  isSuspended: boolean;
  note?: string | null;
  updatedByUserId?: string | null;
}) {
  await createSystemLogEntry({
    source: FALLBACK_PULSE_CONTROL_SOURCE,
    severity: input.isSuspended ? "critical" : input.isMuted ? "warning" : "info",
    status: input.isMuted || input.isSuspended ? "open" : "resolved",
    message: `Pulse control updated for ${input.targetUserId}`,
    context: {
      targetUserId: input.targetUserId,
      isMuted: input.isMuted,
      isSuspended: input.isSuspended,
      note: input.note || null,
      updatedByUserId: input.updatedByUserId || null,
    },
  });
}

export function canAccessInternalPulse(viewer: Viewer | null | undefined) {
  if (!viewer?.user) return false;
  if (hasPurpleBolt(viewer)) return true;
  const operator = viewer.operatorProfile;
  if (!operator?.is_active) return false;
  return operator.surface_access.includes("ops") && operator.module_access.includes("events");
}

export async function getPulseModeratorContext(viewer: Viewer | null | undefined): Promise<PulseModeratorContext> {
  if (!viewer?.user) {
    return {
      canModerate: false,
      canAssign: false,
      canOverride: false,
      scopeType: "none",
      cityScope: [],
      userControl: { isMuted: false, isSuspended: false },
    };
  }

  const operator = viewer.operatorProfile;
  const derivedCityScope = operator?.city_scope || (viewer.profile?.city ? [viewer.profile.city] : []);
  const isGlobal = viewer.isPlatformAdmin || ["admin", "hq_operator", "founder"].includes(String(operator?.role_key || ""));
  const isCityOffice = ["city_commissioner", "deputy_commissioner"].includes(String(operator?.role_key || ""));
  const isDefaultModerator = ["pro_host", "city_leader"].includes(String(operator?.role_key || ""));

  type ManualModerator = {
    scope_type: "global" | "city" | "custom";
    city_scope?: string[] | null;
    is_active: boolean;
    can_assign: boolean;
    can_override: boolean;
  };
  type UserControl = {
    is_muted: boolean;
    is_suspended: boolean;
  };

  let manualModerator: ManualModerator | null = null;
  let userControl: UserControl | null = null;

  try {
    if (!(await hasPulseModerationPersistence())) {
      const [fallbackModerators, fallbackControls] = await Promise.all([
        listFallbackModeratorAssignments(),
        listFallbackUserControls(),
      ]);
      const fallbackModerator = fallbackModerators.find((row) => getLogContext(row).targetUserId === viewer.user?.id);
      const fallbackControl = fallbackControls.find((row) => getLogContext(row).targetUserId === viewer.user?.id);

      if (fallbackModerator) {
        const context = getLogContext(fallbackModerator);
        manualModerator = {
          scope_type: (String(context.scopeType || "city") as "global" | "city" | "custom"),
          city_scope: Array.isArray(context.cityScope) ? (context.cityScope as string[]) : [],
          is_active: Boolean(context.isActive),
          can_assign: Boolean(context.canAssign),
          can_override: Boolean(context.canOverride),
        };
      }

      if (fallbackControl) {
        const context = getLogContext(fallbackControl);
        userControl = {
          is_muted: Boolean(context.isMuted),
          is_suspended: Boolean(context.isSuspended),
        };
      }
      throw new Error("Pulse moderation tables unavailable.");
    }

    const [moderatorRes, userControlRes] = await Promise.all([
      supabaseAdmin
        .from("evntszn_pulse_moderators")
        .select("scope_type, city_scope, is_active, can_assign, can_override")
        .eq("user_id", viewer.user.id)
        .maybeSingle(),
      supabaseAdmin
        .from("evntszn_pulse_user_controls")
        .select("is_muted, is_suspended")
        .eq("user_id", viewer.user.id)
        .maybeSingle(),
    ]);

    if (!moderatorRes.error) {
      manualModerator = (moderatorRes.data as ManualModerator | null) || null;
    }
    if (!userControlRes.error) {
      userControl = (userControlRes.data as UserControl | null) || null;
    }
  } catch {
    // Keep runtime resilient if moderation tables are not available yet.
  }

  const canModerate = Boolean(
    isGlobal ||
      isCityOffice ||
      isDefaultModerator ||
      (manualModerator?.is_active && ["global", "city", "custom"].includes(manualModerator.scope_type)),
  );

  return {
    canModerate,
    canAssign: Boolean(isGlobal || manualModerator?.can_assign),
    canOverride: Boolean(isGlobal || manualModerator?.can_override),
    scopeType: isGlobal
      ? "global"
      : manualModerator?.scope_type || (isCityOffice || isDefaultModerator ? "city" : "none"),
    cityScope: manualModerator?.city_scope?.length ? manualModerator.city_scope : derivedCityScope,
    userControl: {
      isMuted: Boolean(userControl?.is_muted),
      isSuspended: Boolean(userControl?.is_suspended),
    },
  };
}

export function canModeratePulseItem(context: PulseModeratorContext, city: string | null | undefined) {
  if (!context.canModerate) return false;
  if (context.scopeType === "global") return true;
  if (!city) return context.scopeType !== "none";
  return context.cityScope.map((value) => value.toLowerCase()).includes(String(city).toLowerCase());
}

async function getPulsePosts(visibility: "public" | "internal") {
  try {
    if (!(await hasPulsePostPersistence())) {
      return listFallbackPulsePosts(visibility);
    }

    const { data, error } = await supabaseAdmin
      .from("evntszn_pulse_posts")
      .select("*")
      .eq("visibility", visibility)
      .eq("status", "published")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(24);

    if (error) throw new Error(error.message);
    return ((data || []) as PulsePostRow[]).map((row) =>
      coerceFeedItem({
        id: row.id,
        title: row.title,
        body: row.body,
        city: row.city,
        visibility: row.visibility,
        sourceType: row.source_type || "pulse_post",
        sourceLabel: row.source_label || "Pulse Post",
        pulseScore: row.pulse_score,
        reservationSignal: row.reservation_signal,
        createdAt: row.created_at,
        isFeatured: row.is_featured,
        isBolt: row.bolt_only,
      }),
    );
  } catch {
    return listFallbackPulsePosts(visibility);
  }
}

async function getPublicEventSignals() {
  try {
    const since = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();
    const [{ data: events, error: eventsError }, { data: votes, error: votesError }] = await Promise.all([
      supabaseAdmin
        .from("evntszn_events")
        .select("id, title, slug, city, start_at, evntszn_venues(name)")
        .eq("visibility", "published")
        .gte("start_at", new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString())
        .order("start_at", { ascending: true })
        .limit(8),
      supabaseAdmin
        .from("evntszn_event_pulse_votes")
        .select("event_id, energy_level, crowd_density, music_vibe, bar_activity, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(250),
    ]);

    if (eventsError) throw new Error(eventsError.message);
    if (votesError) throw new Error(votesError.message);

    const voteMap = new Map<string, { total: number; score: number }>();
    for (const vote of votes || []) {
      const current = voteMap.get(vote.event_id) || { total: 0, score: 0 };
      const nextScore =
        (Number(vote.energy_level || 0) +
          Number(vote.crowd_density || 0) +
          Number(vote.music_vibe || 0) +
          Number(vote.bar_activity || 0)) /
        4;
      voteMap.set(vote.event_id, {
        total: current.total + 1,
        score: current.score + nextScore,
      });
    }

    return (events || [])
      .filter((event) => !isMidnightRunEvent({ slug: event.slug, title: event.title }))
      .map((event) => {
        const aggregate = voteMap.get(event.id);
        const liveScore = aggregate ? Number((aggregate.score / Math.max(aggregate.total, 1)).toFixed(1)) : null;
        const eventVenue = Array.isArray(event.evntszn_venues)
          ? ((event.evntszn_venues[0] as { name?: string | null } | undefined) || null)
          : ((event.evntszn_venues as { name?: string | null } | null) || null);
        const venueName = eventVenue?.name;
        return coerceFeedItem({
          id: `event:${event.id}`,
          title: event.title,
          body: liveScore
            ? `${venueName || "Venue"} is live with a ${liveScore.toFixed(1)} pulse score and public event momentum.`
            : `${venueName || "Venue"} is live on the event calendar and open for discovery.`,
          city: event.city,
          visibility: "public",
          sourceType: "event",
          sourceLabel: "Event Signal",
          pulseScore: liveScore,
          createdAt: event.start_at,
          isFeatured: Boolean(liveScore && liveScore >= 8),
        });
      });
  } catch {
    return [];
  }
}

async function getReserveSignals() {
  try {
    const { data, error } = await supabaseAdmin
      .from("evntszn_reserve_venues")
      .select("id, settings, evntszn_venues!inner(name, city)")
      .eq("is_active", true)
      .limit(8);

    if (error) throw new Error(error.message);

    return (data || []).map((row, index) => {
      const venue = Array.isArray(row.evntszn_venues)
        ? (row.evntszn_venues[0] as { name?: string | null; city?: string | null } | undefined)
        : (row.evntszn_venues as { name?: string | null; city?: string | null } | null);
      const settings =
        row.settings && typeof row.settings === "object" && !Array.isArray(row.settings)
          ? (row.settings as Record<string, unknown>)
          : {};
      return coerceFeedItem({
        id: `reserve:${row.id}`,
        title: `${venue?.name || "Reserve Venue"} reservations live`,
        body: `Reserve is live for ${venue?.name || "this venue"} with waitlist${settings.waitlist_enabled === false ? " off" : " on"}, capacity-aware booking, and venue-routed confirmations.`,
        city: venue?.city || null,
        visibility: "public",
        sourceType: "reserve",
        sourceLabel: "Reserve Signal",
        reservationSignal: settings.waitlist_enabled === false ? "waitlist_off" : "waitlist_on",
        createdAt: new Date(Date.now() - index * 1000 * 60 * 11).toISOString(),
      });
    });
  } catch {
    return [];
  }
}

async function getInternalOpsSignals() {
  try {
    const [workItemsRes, reserveRes, crewRes] = await Promise.all([
      supabaseAdmin
        .from("internal_work_items")
        .select("id, title, description, priority, status, created_at, internal_desks(slug, name)")
        .in("status", ["open", "in_progress", "blocked"])
        .order("created_at", { ascending: false })
        .limit(12),
      supabaseAdmin
        .from("evntszn_reserve_bookings")
        .select("id, guest_name, booking_date, booking_time, status, created_at")
        .in("status", ["waitlisted", "confirmed"])
        .order("created_at", { ascending: false })
        .limit(10),
      supabaseAdmin
        .from("evntszn_crew_booking_requests")
        .select("id, requested_by_name, city, requested_role, status, created_at")
        .in("status", ["requested", "reviewing"])
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    const items: PulseFeedItem[] = [];

    for (const row of workItemsRes.data || []) {
      const desk = Array.isArray(row.internal_desks) ? row.internal_desks[0] : row.internal_desks;
      items.push(
        coerceFeedItem({
          id: `work:${row.id}`,
          title: row.title,
          body: row.description || `Internal desk activity is live for ${desk?.name || desk?.slug || "ops"}.`,
          visibility: "internal",
          sourceType: "work_item",
          sourceLabel: desk?.name || "Internal Desk",
          createdAt: row.created_at,
          isFeatured: row.priority === "critical" || row.status === "blocked",
          isBolt: true,
        }),
      );
    }

    for (const row of reserveRes.data || []) {
      items.push(
        coerceFeedItem({
          id: `reserve-booking:${row.id}`,
          title: `Reserve ${row.status === "waitlisted" ? "waitlist pressure" : "booking signal"}`,
          body: `${row.guest_name} requested ${row.booking_date} at ${String(row.booking_time).slice(0, 5)} and is currently ${row.status}.`,
          visibility: "internal",
          sourceType: "reserve_booking",
          sourceLabel: "Reserve Desk",
          createdAt: row.created_at,
          isFeatured: row.status === "waitlisted",
          isBolt: true,
        }),
      );
    }

    for (const row of crewRes.data || []) {
      items.push(
        coerceFeedItem({
          id: `crew:${row.id}`,
          title: "Crew request needs coverage",
          body: `${row.requested_by_name} requested ${row.requested_role || "crew"}${row.city ? ` in ${row.city}` : ""}.`,
          city: row.city,
          visibility: "internal",
          sourceType: "crew_request",
          sourceLabel: "Crew",
          createdAt: row.created_at,
          isBolt: true,
        }),
      );
    }

    return items;
  } catch {
    return [];
  }
}

export async function getPublicPulseFeed() {
  const [posts, events, reserveSignals] = await Promise.all([
    getPulsePosts("public"),
    getPublicEventSignals(),
    getReserveSignals(),
  ]);

  return [...posts, ...events, ...reserveSignals]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 30);
}

export async function getInternalPulseFeed() {
  const [posts, signals] = await Promise.all([getPulsePosts("internal"), getInternalOpsSignals()]);

  return [...posts, ...signals]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 30);
}
