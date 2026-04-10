import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/epl/supabase-admin";
import {
  VOLUNTEER_PERK_OPTIONS,
  getAccessTrackLabel,
  buildAssignmentPermissionCodes,
  buildCompensationLabel,
  buildPublicPositionSummary,
  normalizeAccessTrack,
  normalizeAssignmentStatus,
  normalizePositionStatus,
  normalizeRoleType,
  normalizeStringArray,
  normalizeVisibility,
} from "@/lib/epl-staffing";
import { toDatabaseUserId } from "@/lib/access-control";

type TemplateRow = {
  id: string;
  legacy_opportunity_id?: string | null;
  title: string;
  role_code: string | null;
  department: string | null;
  role_type: string;
  summary: string | null;
  responsibilities: string[] | null;
  requirements: string[] | null;
  default_access_role_id: string | null;
  default_assignment_permission_codes: string[] | null;
  default_operational_tags: string[] | null;
  volunteer_perks: string[] | null;
  pay_amount: number | null;
  pay_type: string | null;
  employment_status: string | null;
  access_track: string | null;
  is_active: boolean;
  sort_order: number;
  roles?: { id: string; name?: string | null } | { id: string; name?: string | null }[] | null;
};

type PositionRow = {
  id: string;
  legacy_opportunity_id?: string | null;
  role_template_id: string;
  title_override: string | null;
  season_id: string | null;
  city: string | null;
  state: string | null;
  position_status: string;
  visibility: string;
  slots_needed: number;
  slots_filled: number;
  priority: number;
  notes: string | null;
  publicly_listed: boolean;
  starts_at: string | null;
  ends_at: string | null;
  access_role_id: string | null;
  assignment_permission_codes: string[] | null;
  onboarding_notes: string | null;
  volunteer_perks: string[] | null;
  pay_amount: number | null;
  pay_type: string | null;
  employment_status: string | null;
  access_track: string | null;
  created_at: string;
  updated_at: string;
  staff_role_templates?: TemplateRow | TemplateRow[] | null;
  seasons?: { id: string; name?: string | null; slug?: string | null } | { id: string; name?: string | null; slug?: string | null }[] | null;
  evntszn_events?: { id: string; title?: string | null; slug?: string | null; city?: string | null } | { id: string; title?: string | null; slug?: string | null; city?: string | null }[] | null;
  roles?: { id: string; name?: string | null } | { id: string; name?: string | null }[] | null;
};

function unwrapOne<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] || null : value || null;
}

function mapPositionToLegacyOpportunity(position: PositionRow) {
  const template = unwrapOne(position.staff_role_templates);
  const season = unwrapOne(position.seasons);
  return {
    id: position.id,
    legacy_opportunity_id: position.legacy_opportunity_id || null,
    role_code: template?.role_code || null,
    title: position.title_override || template?.title || "Open position",
    department: template?.department || null,
    opportunity_type: template?.role_type || "volunteer",
    summary: template?.summary || buildPublicPositionSummary({
      summary: template?.summary,
      notes: position.notes,
      role_type: template?.role_type,
      city: position.city,
      season_name: season?.name || null,
      event_title: unwrapOne(position.evntszn_events)?.title || null,
    }),
    description: position.notes || null,
    requirements: template?.requirements || [],
    perks: position.volunteer_perks?.length ? position.volunteer_perks : template?.volunteer_perks || [],
    pay_label: buildCompensationLabel({
      role_type: template?.role_type,
      pay_amount: position.pay_amount ?? template?.pay_amount ?? null,
      pay_type: position.pay_type ?? template?.pay_type ?? null,
      employment_status: position.employment_status ?? template?.employment_status ?? null,
    }),
    status: position.position_status,
    is_public: position.visibility === "public" && position.publicly_listed,
    location_city: position.city,
    location_state: position.state,
    priority_score: position.priority,
    display_order: template?.sort_order ?? 100,
    access_role_id: position.access_role_id || template?.default_access_role_id || null,
    assignment_permission_codes: position.assignment_permission_codes || template?.default_assignment_permission_codes || [],
    assignment_logic: position.onboarding_notes ? { notes: position.onboarding_notes } : {},
    access_track: position.access_track || template?.access_track || "none",
    access_track_label: getAccessTrackLabel(position.access_track || template?.access_track || "none"),
    season_id: position.season_id,
  };
}

async function getLeagueAndSeason(supabase: ReturnType<typeof getSupabaseAdmin>, seasonSlug: string | null) {
  const { data: leagueRow, error: leagueError } = await supabase
    .schema("epl")
    .from("leagues")
    .select("id")
    .eq("slug", "epl")
    .single();

  if (leagueError || !leagueRow) {
    throw new Error(leagueError?.message || "League not found.");
  }

  let seasonId: string | null = null;
  if (seasonSlug) {
    const { data: seasonRow, error: seasonError } = await supabase
      .schema("epl")
      .from("seasons")
      .select("id")
      .eq("slug", seasonSlug)
      .maybeSingle();
    if (seasonError) {
      throw new Error(seasonError.message);
    }
    seasonId = seasonRow?.id || null;
  }

  return { leagueId: leagueRow.id, seasonId };
}

async function syncLegacyOpportunity(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  data: {
    legacyOpportunityId?: string | null;
    leagueId: string;
    seasonId: string | null;
    template: TemplateRow | null;
    position: {
      titleOverride?: string | null;
      status: string;
      visibility: string;
      city: string | null;
      state: string | null;
      priority: number;
      publiclyListed: boolean;
      accessRoleId: string | null;
      assignmentPermissionCodes: string[];
      onboardingNotes: string | null;
      notes: string | null;
      payAmount: number | null;
      payType: string | null;
      employmentStatus: string | null;
      volunteerPerks: string[];
      accessTrack: string | null;
    };
  },
) {
  if (!data.template) return null;

  const legacyPayload = {
    league_id: data.leagueId,
    season_id: data.seasonId,
    role_code: data.template.role_code,
    title: data.position.titleOverride || data.template.title,
    department: data.template.department,
    opportunity_type: data.template.role_type,
    summary: data.template.summary,
    description: data.position.notes || (data.template.responsibilities || []).join("\n"),
    requirements: data.template.requirements || [],
    perks: data.position.volunteerPerks.length ? data.position.volunteerPerks : data.template.volunteer_perks || [],
    pay_label: buildCompensationLabel({
      role_type: data.template.role_type,
      pay_amount: data.position.payAmount ?? data.template.pay_amount ?? null,
      pay_type: data.position.payType ?? data.template.pay_type ?? null,
      employment_status: data.position.employmentStatus ?? data.template.employment_status ?? null,
    }),
    status:
      data.position.status === "archived"
        ? "draft"
        : data.position.status === "nearly_filled"
          ? "open"
          : data.position.status,
    is_public: data.position.visibility === "public" && data.position.publiclyListed,
    location_city: data.position.city,
    location_state: data.position.state,
    priority_score: data.position.priority,
    display_order: data.template.sort_order || 100,
    access_role_id: data.position.accessRoleId || data.template.default_access_role_id || null,
    assignment_permission_codes:
      data.position.assignmentPermissionCodes.length
        ? data.position.assignmentPermissionCodes
        : data.template.default_assignment_permission_codes || [],
    assignment_logic: data.position.onboardingNotes ? { notes: data.position.onboardingNotes } : {},
  };

  if (data.legacyOpportunityId) {
    const { error } = await supabase
      .schema("epl")
      .from("opportunities")
      .update({ ...legacyPayload, updated_at: new Date().toISOString() })
      .eq("id", data.legacyOpportunityId);
    if (error) throw new Error(error.message);
    return data.legacyOpportunityId;
  }

  const { data: inserted, error } = await supabase
    .schema("epl")
    .from("opportunities")
    .insert(legacyPayload)
    .select("id")
    .single();
  if (error || !inserted) {
    throw new Error(error?.message || "Could not create legacy opportunity.");
  }
  return inserted.id;
}

export async function GET() {
  await requireAdminPermission("opportunities.manage", "/epl/admin/opportunities");
  const supabase = getSupabaseAdmin();

  const [templatesRes, positionsRes, assignmentsRes, applicantsRes, seasonsRes, rolesRes, eventsRes, usersRes] = await Promise.all([
    supabase
      .schema("epl")
      .from("staff_role_templates")
      .select("*, roles:default_access_role_id(id, name)")
      .order("sort_order", { ascending: true })
      .order("title", { ascending: true }),
    supabase
      .schema("epl")
      .from("staff_positions")
      .select(`
        *,
        staff_role_templates (*, roles:default_access_role_id(id, name)),
        seasons (id, name, slug),
        evntszn_events:event_id (id, title, slug, city),
        roles:access_role_id (id, name)
      `)
      .order("priority", { ascending: true })
      .order("created_at", { ascending: false }),
    supabase
      .schema("epl")
      .from("staff_assignments")
      .select(`
        *,
        staff_positions (
          id,
          title_override,
          city,
          position_status,
          staff_role_templates (title, role_type)
        ),
        evntszn_profiles:user_id (
          user_id,
          full_name,
          city
        ),
        staff_applications:application_id (
          id,
          first_name,
          last_name,
          email,
          status
        )
      `)
      .order("created_at", { ascending: false }),
    supabase
      .schema("epl")
      .from("staff_applications")
      .select("id, first_name, last_name, email, status, city, state, preferred_roles, opportunity_id, position_id, role_template_id, created_at")
      .order("created_at", { ascending: false }),
    supabase.schema("epl").from("seasons").select("id, name, slug").order("created_at", { ascending: false }),
    supabase.from("roles").select("id, name, primary_role, role_subtype").eq("is_active", true).order("name", { ascending: true }),
    supabase.from("evntszn_events").select("id, title, slug, city, start_at").order("start_at", { ascending: false }).limit(50),
    supabase.from("evntszn_profiles").select("user_id, full_name, city, state, primary_role").eq("is_active", true).order("full_name", { ascending: true }),
  ]);

  const error =
    templatesRes.error ||
    positionsRes.error ||
    assignmentsRes.error ||
    applicantsRes.error ||
    seasonsRes.error ||
    rolesRes.error ||
    eventsRes.error ||
    usersRes.error;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const positions = (positionsRes.data || []) as PositionRow[];
  const templates = (templatesRes.data || []) as TemplateRow[];

  return NextResponse.json({
    templates,
    positions,
    assignments: assignmentsRes.data || [],
    applicants: applicantsRes.data || [],
    seasons: seasonsRes.data || [],
    accessRoles: rolesRes.data || [],
    events: eventsRes.data || [],
    users: usersRes.data || [],
    volunteerPerks: VOLUNTEER_PERK_OPTIONS,
    opportunities: positions.map(mapPositionToLegacyOpportunity),
  });
}

export async function POST(req: NextRequest) {
  const { user } = await requireAdminPermission("opportunities.manage", "/epl/admin/opportunities");
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const supabase = getSupabaseAdmin();
  const action = String(body.action || "").trim();

  if (action === "saveAssignment") {
    const positionId = String(body.positionId || "").trim();
    if (!positionId) {
      return NextResponse.json({ error: "Position is required." }, { status: 400 });
    }

    const payload = {
      position_id: positionId,
      user_id: String(body.userId || "").trim() || null,
      application_id: String(body.applicationId || "").trim() || null,
      assignment_status: normalizeAssignmentStatus(body.assignmentStatus),
      notes: String(body.notes || "").trim() || null,
      assigned_by: toDatabaseUserId(user.id),
      assigned_at: new Date().toISOString(),
    };

    if (body.id) {
      const { error } = await supabase
        .schema("epl")
        .from("staff_assignments")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", body.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, updated: true });
    }

    const { error } = await supabase.schema("epl").from("staff_assignments").insert(payload);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, created: true });
  }

  if (action === "saveTemplate") {
    const templatePayload = {
      title: String(body.title || "").trim(),
      role_code: String(body.roleCode || "").trim() || null,
      department: String(body.department || "").trim() || null,
      role_type: normalizeRoleType(body.roleType),
      summary: String(body.summary || "").trim() || null,
      responsibilities: normalizeStringArray(body.responsibilities),
      requirements: normalizeStringArray(body.requirements),
      default_access_role_id: String(body.defaultAccessRoleId || "").trim() || null,
      default_assignment_permission_codes: buildAssignmentPermissionCodes(body.defaultAssignmentPermissionCodes),
      default_operational_tags: normalizeStringArray(body.defaultOperationalTags),
      volunteer_perks: normalizeStringArray(body.volunteerPerks),
      pay_amount: body.payAmount ? Number(body.payAmount) : null,
      pay_type: String(body.payType || "").trim() || null,
      employment_status: String(body.employmentStatus || "").trim() || null,
      access_track: normalizeAccessTrack(body.accessTrack),
      is_active: body.isActive !== false,
      sort_order: Number(body.sortOrder || 100),
    };

    if (!templatePayload.title) {
      return NextResponse.json({ error: "Template title is required." }, { status: 400 });
    }

    if (body.id) {
      const { error } = await supabase
        .schema("epl")
        .from("staff_role_templates")
        .update({ ...templatePayload, updated_at: new Date().toISOString() })
        .eq("id", body.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, updated: true });
    }

    const { data, error } = await supabase
      .schema("epl")
      .from("staff_role_templates")
      .insert(templatePayload)
      .select("id")
      .single();
    if (error || !data) return NextResponse.json({ error: error?.message || "Could not create template." }, { status: 500 });
    return NextResponse.json({ ok: true, created: true, id: data.id });
  }

  const templateId = String(body.roleTemplateId || body.templateId || "").trim();
  const seasonSlug = String(body.seasonSlug || "").trim() || null;

  try {
    const { leagueId, seasonId } = await getLeagueAndSeason(supabase, seasonSlug);

    let template: TemplateRow | null = null;
    if (templateId) {
      const templateRes = await supabase
        .schema("epl")
        .from("staff_role_templates")
        .select("*")
        .eq("id", templateId)
        .maybeSingle();
      if (templateRes.error) throw new Error(templateRes.error.message);
      template = templateRes.data as TemplateRow | null;
    }

    if (!template && !String(body.title || "").trim()) {
      return NextResponse.json({ error: "Role template or title is required." }, { status: 400 });
    }

    if (!template) {
      const createdTemplate = await supabase
        .schema("epl")
        .from("staff_role_templates")
        .insert({
          title: String(body.title || "").trim(),
          role_code: String(body.roleCode || "").trim() || null,
          department: String(body.department || "").trim() || null,
          role_type: normalizeRoleType(body.roleType || body.opportunityType),
          summary: String(body.summary || "").trim() || null,
          responsibilities: normalizeStringArray(body.responsibilities || body.description),
          requirements: normalizeStringArray(body.requirements),
          default_access_role_id: String(body.defaultAccessRoleId || body.accessRoleId || "").trim() || null,
          default_assignment_permission_codes: buildAssignmentPermissionCodes(body.defaultAssignmentPermissionCodes || body.assignmentPermissionCodes),
          default_operational_tags: normalizeStringArray(body.defaultOperationalTags || body.department),
          volunteer_perks: normalizeStringArray(body.volunteerPerks || body.perks),
          pay_amount: body.payAmount ? Number(body.payAmount) : null,
          pay_type: String(body.payType || "").trim() || null,
          employment_status: String(body.employmentStatus || "").trim() || null,
          access_track: normalizeAccessTrack(body.accessTrack),
          is_active: true,
          sort_order: Number(body.displayOrder || 100),
        })
        .select("*")
        .single();
      if (createdTemplate.error || !createdTemplate.data) {
        throw new Error(createdTemplate.error?.message || "Could not create template.");
      }
      template = createdTemplate.data as TemplateRow;
    }

    const positionPayload = {
      role_template_id: template.id,
      title_override: String(body.titleOverride || "").trim() || (body.title && body.id ? String(body.title).trim() : null),
      season_id: seasonId,
      event_id: String(body.eventId || "").trim() || null,
      city: String(body.city || body.locationCity || "").trim() || null,
      state: String(body.state || body.locationState || "").trim() || null,
      position_status: normalizePositionStatus(body.positionStatus || body.status),
      visibility: normalizeVisibility(body.visibility || ((body.isPublic ?? true) ? "public" : "internal_only")),
      slots_needed: Number(body.slotsNeeded || 1),
      slots_filled: Number(body.slotsFilled || 0),
      priority: Number(body.priority || body.priorityScore || 100),
      notes: String(body.notes || body.description || "").trim() || null,
      publicly_listed: body.publiclyListed !== false && body.isPublic !== false,
      starts_at: String(body.startsAt || "").trim() || null,
      ends_at: String(body.endsAt || "").trim() || null,
      access_role_id: String(body.accessRoleId || "").trim() || template.default_access_role_id || null,
      assignment_permission_codes: buildAssignmentPermissionCodes(body.assignmentPermissionCodes),
      onboarding_notes: String(body.onboardingNotes || body.assignmentLogic || "").trim() || null,
      volunteer_perks: normalizeStringArray(body.volunteerPerks || body.perks),
      pay_amount: body.payAmount ? Number(body.payAmount) : null,
      pay_type: String(body.payType || "").trim() || null,
      employment_status: String(body.employmentStatus || "").trim() || null,
      access_track: normalizeAccessTrack(body.accessTrack || template.access_track),
    };

    let legacyOpportunityId = String(body.legacyOpportunityId || "").trim() || null;

    if (body.id) {
      const { data: existingPosition, error: existingPositionError } = await supabase
        .schema("epl")
        .from("staff_positions")
        .select("legacy_opportunity_id")
        .eq("id", body.id)
        .maybeSingle();
      if (existingPositionError) throw new Error(existingPositionError.message);
      legacyOpportunityId = existingPosition?.legacy_opportunity_id || legacyOpportunityId;

      const { error } = await supabase
        .schema("epl")
        .from("staff_positions")
        .update({ ...positionPayload, updated_at: new Date().toISOString() })
        .eq("id", body.id);
      if (error) throw new Error(error.message);
    } else {
      const insertPosition = await supabase
        .schema("epl")
        .from("staff_positions")
        .insert(positionPayload)
        .select("id, legacy_opportunity_id")
        .single();
      if (insertPosition.error || !insertPosition.data) {
        throw new Error(insertPosition.error?.message || "Could not create position.");
      }
      body.id = insertPosition.data.id;
      legacyOpportunityId = insertPosition.data.legacy_opportunity_id || null;
    }

    const syncedLegacyId = await syncLegacyOpportunity(supabase, {
      legacyOpportunityId,
      leagueId,
      seasonId,
      template,
      position: {
        titleOverride: positionPayload.title_override,
        status: positionPayload.position_status,
        visibility: positionPayload.visibility,
        city: positionPayload.city,
        state: positionPayload.state,
        priority: positionPayload.priority,
        publiclyListed: positionPayload.publicly_listed,
        accessRoleId: positionPayload.access_role_id,
        assignmentPermissionCodes: positionPayload.assignment_permission_codes,
        onboardingNotes: positionPayload.onboarding_notes,
        notes: positionPayload.notes,
        payAmount: positionPayload.pay_amount,
        payType: positionPayload.pay_type,
        employmentStatus: positionPayload.employment_status,
        volunteerPerks: positionPayload.volunteer_perks,
        accessTrack: positionPayload.access_track,
      },
    });

    if (body.id && syncedLegacyId) {
      const { error: syncBackError } = await supabase
        .schema("epl")
        .from("staff_positions")
        .update({ legacy_opportunity_id: syncedLegacyId })
        .eq("id", body.id);
      if (syncBackError) throw new Error(syncBackError.message);
    }

    return NextResponse.json({ ok: true, updated: Boolean(body.id), positionId: body.id, legacyOpportunityId: syncedLegacyId });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save staffing position." },
      { status: 500 },
    );
  }
}
