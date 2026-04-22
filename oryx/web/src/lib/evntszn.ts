import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getFounderSession } from "@/lib/founder-session";
import { getAppOrigin, getLoginUrl, getRestrictedSurfaceForPath, getRestrictedUrl } from "@/lib/domains";
import { isMissingRbacTableError } from "@/lib/admin-auth";
import { getSupabaseRuntimeConfig } from "@/lib/runtime-env";

export type PlatformRole = "attendee" | "organizer" | "venue" | "scanner" | "admin";

export type PlatformProfile = {
  user_id: string;
  full_name: string | null;
  primary_role: PlatformRole;
  city: string | null;
  state: string | null;
  referral_code: string | null;
  is_active: boolean;
};

export type OperatorProfile = {
  user_id: string;
  role_key: string;
  organizer_classification: string;
  network_status: string;
  job_title: string | null;
  functions: string[];
  city_scope: string[];
  dashboard_access: string[];
  surface_access: string[];
  module_access: string[];
  approval_authority: string[];
  can_manage_content: boolean;
  can_manage_discovery: boolean;
  can_manage_store: boolean;
  can_manage_sponsors: boolean;
  can_access_scanner: boolean;
  is_active: boolean;
};

export type EventAccessRow = {
  role_code: string;
  can_manage_event: boolean;
  can_scan: boolean;
  can_manage_tickets: boolean;
  can_view_finance: boolean;
  status: string;
  evntszn_events?: {
    id: string;
    slug: string;
    title: string;
    organizer_user_id: string | null;
    venue_id: string | null;
  } | null;
};

export type ManagedEventRecord = {
  id: string;
  organizer_user_id: string | null;
  city: string | null;
  state?: string | null;
  event_class?: string | null;
  event_vertical?: string | null;
};

export async function getPlatformViewer() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const founder = !user ? await getFounderSession() : null;

  if (!user && !founder) {
    return {
      user: null,
      profile: null,
      operatorProfile: null,
      isPlatformAdmin: false,
    };
  }

  if (founder) {
    return {
      user: {
        id: founder.id,
        email: founder.email,
        user_metadata: {
          full_name: founder.full_name,
        },
      },
      profile: null,
      operatorProfile: null,
      isPlatformAdmin: true,
    };
  }

  if (!user) {
    return {
      user: null,
      profile: null,
      operatorProfile: null,
      isPlatformAdmin: false,
    };
  }

  const authedUser = user;
  const adminConfig = getSupabaseRuntimeConfig("server-admin", "platform.viewer");

  if (!adminConfig.ok) {
    return {
      user: authedUser,
      profile: null,
      operatorProfile: null,
      isPlatformAdmin: false,
    };
  }

  const [{ data: profile }, membershipsResponse, { data: operatorProfile }] = await Promise.all([
    supabaseAdmin
      .from("evntszn_profiles")
      .select("user_id, full_name, primary_role, city, state, referral_code, is_active")
      .eq("user_id", authedUser.id)
      .maybeSingle(),
    supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", authedUser.id)
      .eq("is_active", true),
    supabaseAdmin
      .from("evntszn_operator_profiles")
      .select("*")
      .eq("user_id", authedUser.id)
      .maybeSingle(),
  ]);

  if (membershipsResponse.error && !isMissingRbacTableError(membershipsResponse.error)) {
    throw new Error(membershipsResponse.error.message);
  }

  let isPlatformAdmin = Boolean(membershipsResponse.data?.length);
  if (!isPlatformAdmin) {
    const legacyMemberships = await supabaseAdmin
      .from("admin_memberships")
      .select("id")
      .eq("user_id", authedUser.id)
      .eq("is_active", true);

    if (legacyMemberships.error && !isMissingRbacTableError(legacyMemberships.error)) {
      throw new Error(legacyMemberships.error.message);
    }

    isPlatformAdmin = Boolean(legacyMemberships.data?.length);
  }

  return {
    user: authedUser,
    profile: (profile as PlatformProfile | null) ?? null,
    operatorProfile: (operatorProfile as OperatorProfile | null) ?? null,
    isPlatformAdmin,
  };
}

export async function requirePlatformUser(nextPath: string) {
  const viewer = await getPlatformViewer();

  if (!viewer.user) {
    redirect(getLoginUrl(nextPath));
  }

  return viewer;
}

export async function ensurePlatformProfile(
  userId: string,
  input: {
    fullName?: string | null;
    primaryRole?: PlatformRole;
    city?: string | null;
    state?: string | null;
  } = {}
) {
  const referralCode = `EVN-${userId.slice(0, 6).toUpperCase()}`;

  const { data, error } = await supabaseAdmin
    .from("evntszn_profiles")
    .upsert(
      {
        user_id: userId,
        full_name: input.fullName ?? null,
        primary_role: input.primaryRole ?? "attendee",
        city: input.city ?? null,
        state: input.state ?? null,
        referral_code: referralCode,
        is_active: true,
      },
      { onConflict: "user_id" }
    )
    .select("user_id, full_name, primary_role, city, state, referral_code, is_active")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as PlatformProfile;
}

export async function requirePlatformRole(nextPath: string, roles: PlatformRole[]) {
  const viewer = await requirePlatformUser(nextPath);
  const role = viewer.profile?.primary_role;

  if (viewer.isPlatformAdmin) {
    return viewer;
  }

  if (!role || !roles.includes(role)) {
    redirect(
      getRestrictedUrl(getRestrictedSurfaceForPath(nextPath), {
        fallbackSurface: "app",
        fallbackPath: "/account",
        fallbackLabel: "Return to my account",
      })
    );
  }

  return viewer;
}

export async function getEventAccessForUser(userId: string, eventSlug: string) {
  const { data, error } = await supabaseAdmin
    .from("evntszn_event_staff")
    .select(`
      role_code,
      can_manage_event,
      can_scan,
      can_manage_tickets,
      can_view_finance,
      status,
      evntszn_events!inner (
        id,
        slug,
        title,
        organizer_user_id,
        venue_id
      )
    `)
    .eq("user_id", userId)
    .eq("status", "active")
    .eq("evntszn_events.slug", eventSlug);

  if (error) {
    throw new Error(error.message);
  }

  return ((data || []) as unknown) as EventAccessRow[];
}

export async function requireEventScannerAccess(eventSlug: string) {
  const viewer = await requirePlatformUser(`/scanner/${eventSlug}`);
  if (viewer.user?.id?.startsWith("founder:")) {
    return viewer;
  }
  const accessRows = await getEventAccessForUser(viewer.user!.id, eventSlug);
  const { data: event } = await supabaseAdmin
    .from("evntszn_events")
    .select("id, organizer_user_id, venue_id")
    .eq("slug", eventSlug)
    .maybeSingle();

  if (viewer.isPlatformAdmin) {
    return viewer;
  }

  const { data: venue } = event?.venue_id
    ? await supabaseAdmin
        .from("evntszn_venues")
        .select("owner_user_id")
        .eq("id", event.venue_id)
        .maybeSingle()
    : { data: null };

  const hasScannerAccess =
    event?.organizer_user_id === viewer.user!.id ||
    venue?.owner_user_id === viewer.user!.id ||
    accessRows.some((row) => row.can_scan || row.role_code === "scanner");

  if (!hasScannerAccess) {
    redirect(
      getRestrictedUrl("scanner", {
        fallbackSurface: "app",
        fallbackPath: "/account",
        fallbackLabel: "Return to my account",
      })
    );
  }

  return viewer;
}

export function canManageEventWithViewer(
  viewer: Awaited<ReturnType<typeof getPlatformViewer>>,
  event: ManagedEventRecord,
) {
  if (viewer.isPlatformAdmin) return true;
  if (!viewer.user) return false;
  if (event.organizer_user_id === viewer.user.id) return true;

  const operator = viewer.operatorProfile;
  if (!operator?.is_active) return false;
  if (!operator.surface_access.includes("ops") && !operator.dashboard_access.includes("city")) {
    return false;
  }
  if (event.event_class === "independent_organizer") {
    return false;
  }

  const scopedCities = operator.city_scope.map((entry) => entry.toLowerCase());
  const eventCity = (event.city || "").toLowerCase();
  const cityRoleKeys = new Set(["city_commissioner", "city_deputy", "city_leader", "city_host"]);

  if (cityRoleKeys.has(operator.role_key) && eventCity && scopedCities.includes(eventCity)) {
    return true;
  }

  return false;
}

export function getBaseUrl() {
  return getAppOrigin();
}

export function buildTicketCode(prefix = "EVNTSZN") {
  const token = crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();
  return `${prefix}-${token}`;
}

export async function logEventActivity(
  eventId: string,
  actorUserId: string | null,
  activityType: string,
  activityLabel: string,
  payload: Record<string, unknown> = {}
) {
  await supabaseAdmin.from("evntszn_event_activity").insert({
    event_id: eventId,
    actor_user_id: actorUserId,
    activity_type: activityType,
    activity_label: activityLabel,
    payload,
  });
}
