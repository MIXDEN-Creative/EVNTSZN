import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { toDatabaseUserId } from "@/lib/access-control";

function normalizeCity(value: string | null | undefined) {
  return (value || "Unassigned").trim();
}

export async function GET(request: NextRequest) {
  await requireAdminPermission("city.manage", "/epl/admin/city-office");

  const cityFilter = request.nextUrl.searchParams.get("city");

  const [eventsRes, applicationsRes, profilesRes, ordersRes, sponsorOrdersRes, programsRes, sponsorAccountsRes, officesRes] = await Promise.all([
    supabaseAdmin
      .from("evntszn_events")
      .select("id, city, status, start_at, check_in_count"),
    supabaseAdmin
      .from("evntszn_applications")
      .select("id, city, status, application_type, discovery_eligible"),
    supabaseAdmin
      .from("evntszn_operator_profiles")
      .select("user_id, role_key, organizer_classification, city_scope, is_active"),
    supabaseAdmin
      .from("evntszn_ticket_orders")
      .select("id, amount_total_cents, status, evntszn_events(city)")
      .eq("status", "paid"),
    supabaseAdmin
      .from("evntszn_sponsor_package_orders")
      .select("id, amount_cents, status, metadata"),
    supabaseAdmin
      .from("evntszn_program_members")
      .select("id, full_name, program_key, city, status, activation_state, activation_readiness, assigned_manager_user_id"),
    supabaseAdmin
      .from("evntszn_sponsor_accounts")
      .select("id, name, scope_type, city_scope, status, activation_status, fulfillment_status, asset_ready, epl_category"),
    supabaseAdmin
      .from("city_offices")
      .select("id, office_name, city, state, region, office_status, office_lead_user_id, notes, description, created_at, updated_at"),
  ]);

  const error =
    eventsRes.error || applicationsRes.error || profilesRes.error || ordersRes.error || sponsorOrdersRes.error || programsRes.error || sponsorAccountsRes.error || officesRes.error;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const profileUserIds = Array.from(
    new Set(
      (profilesRes.data || [])
        .map((profile: any) => profile.user_id)
        .filter(Boolean),
    ),
  );
  const { data: profileRows, error: profileRowsError } = profileUserIds.length
    ? await supabaseAdmin
        .from("evntszn_profiles")
        .select("user_id, full_name, city, state")
        .in("user_id", profileUserIds)
    : { data: [], error: null };

  if (profileRowsError) {
    return NextResponse.json({ error: profileRowsError.message }, { status: 500 });
  }

  const cityMap = new Map<string, any>();
  const ensureCity = (cityName: string) => {
    if (!cityMap.has(cityName)) {
      cityMap.set(cityName, {
        city: cityName,
        totalEvents: 0,
        publishedEvents: 0,
        upcomingEvents: 0,
        pendingApprovals: 0,
        hosts: 0,
        organizers: 0,
        hostUpgradeCandidates: 0,
        signalMembers: 0,
        ambassadorMembers: 0,
        paidRevenueCents: 0,
        sponsorRevenueCents: 0,
        sponsorAccounts: 0,
        operators: [] as any[],
        applications: [] as any[],
        programMembers: [] as any[],
        sponsorRelationships: [] as any[],
        offices: [] as any[],
      });
    }
    return cityMap.get(cityName);
  };

  for (const event of eventsRes.data || []) {
    const row = ensureCity(normalizeCity(event.city));
    row.totalEvents += 1;
    if (event.status === "published") row.publishedEvents += 1;
    if (event.start_at && new Date(event.start_at).getTime() > Date.now()) row.upcomingEvents += 1;
  }

  for (const application of applicationsRes.data || []) {
    const row = ensureCity(normalizeCity(application.city));
    if (application.status === "new" || application.status === "reviewing") row.pendingApprovals += 1;
    row.applications.push({
      id: application.id,
      status: application.status,
      type: application.application_type,
      discoveryEligible: application.discovery_eligible,
    });
  }

  for (const profile of profilesRes.data || []) {
    const cities = Array.isArray(profile.city_scope) && profile.city_scope.length
      ? profile.city_scope
      : ["Unassigned"];
    for (const city of cities) {
      const row = ensureCity(normalizeCity(city));
      if (!profile.is_active) continue;
      if (String(profile.role_key || "").includes("host")) row.hosts += 1;
      if (String(profile.role_key || "").includes("organizer")) row.organizers += 1;
      if (profile.organizer_classification === "independent_organizer") row.hostUpgradeCandidates += 1;
      row.operators.push({
        userId: profile.user_id,
        roleKey: profile.role_key,
        organizerClassification: profile.organizer_classification,
        isActive: profile.is_active,
      });
    }
  }

  for (const order of ordersRes.data || []) {
    const eventCity = normalizeCity((order.evntszn_events as any)?.city);
    const row = ensureCity(eventCity);
    row.paidRevenueCents += order.amount_total_cents || 0;
  }

  for (const order of sponsorOrdersRes.data || []) {
    const city = normalizeCity((order.metadata as Record<string, unknown> | null)?.city as string | undefined);
    const row = ensureCity(city);
    if (order.status === "paid") row.sponsorRevenueCents += order.amount_cents || 0;
  }

  for (const member of programsRes.data || []) {
    const row = ensureCity(normalizeCity(member.city));
    if (member.program_key === "signal") row.signalMembers += 1;
    if (member.program_key === "ambassador") row.ambassadorMembers += 1;
    row.programMembers.push({
      id: member.id,
      fullName: member.full_name,
      programKey: member.program_key,
      status: member.status,
      activationState: member.activation_state,
      activationReadiness: member.activation_readiness,
      assignedManagerUserId: member.assigned_manager_user_id,
    });
  }

  for (const account of sponsorAccountsRes.data || []) {
    const cities = Array.isArray(account.city_scope) && account.city_scope.length
      ? account.city_scope
      : account.scope_type === "city"
        ? ["Unassigned"]
        : [];
    for (const city of cities) {
      const row = ensureCity(normalizeCity(city));
      if (account.status === "active" || account.status === "pending" || account.status === "lead") {
        row.sponsorAccounts += 1;
      }
      row.sponsorRelationships.push({
        id: account.id,
        name: account.name,
        scopeType: account.scope_type,
        status: account.status,
        activationStatus: account.activation_status,
        fulfillmentStatus: account.fulfillment_status,
        assetReady: Boolean(account.asset_ready),
        eplCategory: account.epl_category,
      });
    }
  }

  const profileMap = new Map((profileRows || []).map((profile: any) => [profile.user_id, profile]));
  for (const office of officesRes.data || []) {
    const row = ensureCity(normalizeCity(office.city));
    const leadProfile = office.office_lead_user_id ? profileMap.get(office.office_lead_user_id) : null;
    row.offices.push({
      id: office.id,
      officeName: office.office_name,
      city: office.city,
      state: office.state,
      region: office.region,
      officeStatus: office.office_status,
      officeLeadUserId: office.office_lead_user_id,
      officeLeadName: leadProfile?.full_name || null,
      notes: office.notes,
      description: office.description,
      createdAt: office.created_at,
      updatedAt: office.updated_at,
    });
  }

  const cities = Array.from(cityMap.values())
    .filter((row) => !cityFilter || row.city.toLowerCase() === cityFilter.toLowerCase())
    .sort((a, b) => a.city.localeCompare(b.city));

  return NextResponse.json({
    cities,
    offices: (officesRes.data || []).map((office) => ({
      id: office.id,
      officeName: office.office_name,
      city: office.city,
      state: office.state,
      region: office.region,
      officeStatus: office.office_status,
      officeLeadUserId: office.office_lead_user_id,
      officeLeadName: office.office_lead_user_id ? profileMap.get(office.office_lead_user_id)?.full_name || null : null,
      notes: office.notes,
      description: office.description,
      createdAt: office.created_at,
      updatedAt: office.updated_at,
    })),
    officeLeads: Array.from(
      new Map(
        (profilesRes.data || []).map((profile: any) => [
          profile.user_id,
          {
            userId: profile.user_id,
            fullName: profileMap.get(profile.user_id)?.full_name || null,
            city: profileMap.get(profile.user_id)?.city || null,
            state: profileMap.get(profile.user_id)?.state || null,
          },
        ]),
      ).values(),
    ),
  });
}

export async function POST(request: NextRequest) {
  await requireAdminPermission("city.manage", "/epl/admin/city-office");

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const officeId = String(body.id || "").trim();
  const officeName = String(body.officeName || "").trim();
  const city = String(body.city || "").trim();
  const state = String(body.state || "").trim() || null;
  const region = String(body.region || "").trim() || null;
  const officeStatus = String(body.officeStatus || "active").trim() || "active";
  const notes = String(body.notes || "").trim() || null;
  const description = String(body.description || "").trim() || null;
  const officeLeadUserId = body.officeLeadUserId ? toDatabaseUserId(String(body.officeLeadUserId || "").trim()) : null;

  if (!officeName || !city) {
    return NextResponse.json({ error: "Office name and city are required." }, { status: 400 });
  }

  const payload = {
    office_name: officeName,
    city,
    state,
    region,
    office_status: officeStatus,
    office_lead_user_id: officeLeadUserId,
    notes,
    description,
  };

  const result = officeId
    ? await supabaseAdmin.from("city_offices").update(payload).eq("id", officeId).select("id").single()
    : await supabaseAdmin.from("city_offices").insert(payload).select("id").single();

  if (result.error || !result.data) {
    return NextResponse.json({ error: result.error?.message || "Could not save office." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, officeId: result.data.id });
}
