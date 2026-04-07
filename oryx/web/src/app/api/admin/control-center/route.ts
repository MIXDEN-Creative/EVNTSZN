import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  await requireAdminPermission("admin.manage", "/epl/admin/control-center");

  const [
    usersRes,
    operatorRes,
    appsRes,
    logsRes,
    sponsorOrdersRes,
    eventsRes,
    ticketOrdersRes,
    sponsorsRes,
    staffAppsRes,
    opportunitiesRes,
    scannerOperatorsRes,
    scannerAssignmentsRes,
  ] = await Promise.all([
    supabaseAdmin.from("evntszn_profiles").select("user_id", { count: "exact", head: true }),
    supabaseAdmin.from("evntszn_operator_profiles").select("user_id", { count: "exact", head: true }),
    supabaseAdmin.from("evntszn_applications").select("id, status, application_type"),
    supabaseAdmin.from("evntszn_system_logs").select("id, severity, status, source, message, created_at").order("created_at", { ascending: false }).limit(10),
    supabaseAdmin.from("evntszn_sponsor_package_orders").select("id, status, amount_cents", { count: "exact" }),
    supabaseAdmin.from("evntszn_events").select("id, title, status, city, check_in_count", { count: "exact" }),
    supabaseAdmin.from("evntszn_ticket_orders").select("id, amount_total_cents, status, evntszn_events(title, city)", { count: "exact" }),
    supabaseAdmin.schema("epl").from("sponsor_partners").select("id, cash_value_cents, status", { count: "exact" }),
    supabaseAdmin.schema("epl").from("staff_applications").select("id, status, opportunity_type, hiring_decision"),
    supabaseAdmin.schema("epl").from("opportunities").select("id, status, opportunity_type, is_public"),
    supabaseAdmin.from("evntszn_operator_profiles").select("user_id, can_access_scanner"),
    supabaseAdmin.from("evntszn_event_staff").select("id, can_scan, status"),
  ]);

  const applications = appsRes.data || [];
  const paidOrders = (ticketOrdersRes.data || []).filter((row) => row.status === "paid");
  const ticketRevenue = paidOrders.reduce((sum, row) => sum + (row.amount_total_cents || 0), 0);
  const sponsorRevenue = (sponsorsRes.data || [])
    .reduce((sum, row) => sum + (row.cash_value_cents || 0), 0);
  const cityRevenueMap = new Map<string, number>();
  const eventRevenueMap = new Map<string, number>();

  for (const order of paidOrders) {
    const city = ((order.evntszn_events as { city?: string } | null)?.city || "Unassigned").trim();
    const eventTitle = ((order.evntszn_events as { title?: string } | null)?.title || "Event").trim();
    cityRevenueMap.set(city, (cityRevenueMap.get(city) || 0) + (order.amount_total_cents || 0));
    eventRevenueMap.set(eventTitle, (eventRevenueMap.get(eventTitle) || 0) + (order.amount_total_cents || 0));
  }

  const checkInTotal = (eventsRes.data || []).reduce((sum, row) => sum + (row.check_in_count || 0), 0);
  const issueCountsBySource = Object.entries(
    (logsRes.data || []).reduce<Record<string, number>>((acc, row) => {
      const key = String(row.source || "unknown");
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {}),
  ).map(([source, count]) => ({ source, count }));
  const issueCountsBySeverity = Object.entries(
    (logsRes.data || []).reduce<Record<string, number>>((acc, row) => {
      const key = String(row.severity || "unknown");
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {}),
  ).map(([severity, count]) => ({ severity, count }));
  const hiringStageCounts = Object.entries(
    (staffAppsRes.data || []).reduce<Record<string, number>>((acc, row) => {
      const key = String(row.status || "submitted");
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {}),
  ).map(([status, count]) => ({ status, count }));
  const opportunityCounts = {
    total: (opportunitiesRes.data || []).length,
    open: (opportunitiesRes.data || []).filter((row) => row.status === "open").length,
    public: (opportunitiesRes.data || []).filter((row) => row.is_public).length,
    paid: (opportunitiesRes.data || []).filter((row) => row.opportunity_type === "paid").length,
    volunteer: (opportunitiesRes.data || []).filter((row) => row.opportunity_type === "volunteer").length,
  };
  const cityRevenue = Array.from(cityRevenueMap.entries())
    .map(([city, cents]) => ({ city, cents }))
    .sort((a, b) => b.cents - a.cents)
    .slice(0, 6);
  const topEvents = Array.from(eventRevenueMap.entries())
    .map(([title, cents]) => ({ title, cents }))
    .sort((a, b) => b.cents - a.cents)
    .slice(0, 6);

  return NextResponse.json({
    stats: {
      totalUsers: usersRes.count || 0,
      operatorProfiles: operatorRes.count || 0,
      pendingApprovals: applications.filter((row) => row.status === "new" || row.status === "reviewing").length,
      openIssues: (logsRes.data || []).filter((row) => row.status !== "resolved").length,
      publicEvents: (eventsRes.data || []).filter((row) => row.status === "published").length,
      ticketRevenueCents: ticketRevenue,
      sponsorRevenueCents: sponsorRevenue,
      sponsorPackageOrders: sponsorOrdersRes.count || 0,
      checkInTotal,
      scannerCapableOperators: (scannerOperatorsRes.data || []).filter((row) => row.can_access_scanner).length,
      activeScanAssignments: (scannerAssignmentsRes.data || []).filter((row) => row.can_scan && row.status === "active").length,
      storeFailureCount: (logsRes.data || []).filter((row) => String(row.source || "").includes("printful")).length,
      webhookFailureCount: (logsRes.data || []).filter((row) => String(row.source || "").includes("stripe")).length,
    },
    applications,
    issues: logsRes.data || [],
    cityRevenue,
    topEvents,
    issueCountsBySource,
    issueCountsBySeverity,
    hiringStageCounts,
    opportunityCounts,
  });
}
