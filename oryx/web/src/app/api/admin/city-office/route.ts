import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

function normalizeCity(value: string | null | undefined) {
  return (value || "Unassigned").trim();
}

export async function GET(request: NextRequest) {
  await requireAdminPermission("admin.manage", "/epl/admin/city-office");

  const cityFilter = request.nextUrl.searchParams.get("city");

  const [eventsRes, applicationsRes, profilesRes, ordersRes, sponsorOrdersRes] = await Promise.all([
    supabaseAdmin
      .from("evntszn_events")
      .select("id, city, status, start_at, check_in_count"),
    supabaseAdmin
      .from("evntszn_applications")
      .select("id, city, status, application_type, discovery_eligible"),
    supabaseAdmin
      .from("evntszn_operator_profiles")
      .select("user_id, role_key, city_scope, is_active"),
    supabaseAdmin
      .from("evntszn_ticket_orders")
      .select("id, amount_total_cents, status, evntszn_events(city)")
      .eq("status", "paid"),
    supabaseAdmin
      .from("evntszn_sponsor_package_orders")
      .select("id, amount_cents, status, metadata"),
  ]);

  const error =
    eventsRes.error || applicationsRes.error || profilesRes.error || ordersRes.error || sponsorOrdersRes.error;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
        paidRevenueCents: 0,
        sponsorRevenueCents: 0,
        operators: [] as any[],
        applications: [] as any[],
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
      row.operators.push({
        userId: profile.user_id,
        roleKey: profile.role_key,
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

  const cities = Array.from(cityMap.values())
    .filter((row) => !cityFilter || row.city.toLowerCase() === cityFilter.toLowerCase())
    .sort((a, b) => a.city.localeCompare(b.city));

  return NextResponse.json({ cities });
}
