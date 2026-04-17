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
    sponsorAccountsRes,
    programMembersRes,
    staffAppsRes,
    opportunitiesRes,
    scannerOperatorsRes,
    scannerAssignmentsRes,
    cityProfilesRes,
    supportTicketsRes,
    growthEventsRes,
    growthSummaryRes,
    growthAttributionsRes,
  ] = await Promise.all([
    supabaseAdmin.from("evntszn_profiles").select("user_id", { count: "exact", head: true }),
    supabaseAdmin.from("evntszn_operator_profiles").select("user_id", { count: "exact", head: true }),
    supabaseAdmin.from("evntszn_applications").select("id, status, application_type"),
    supabaseAdmin.from("evntszn_system_logs").select("id, severity, status, source, message, created_at").order("created_at", { ascending: false }).limit(10),
    supabaseAdmin.from("evntszn_sponsor_package_orders").select("id, status, amount_usd", { count: "exact" }),
    supabaseAdmin.from("evntszn_events").select("id, title, status, city, check_in_count", { count: "exact" }),
    supabaseAdmin.from("evntszn_ticket_orders").select("id, amount_total_usd, status, evntszn_events(title, city)", { count: "exact" }),
    supabaseAdmin.schema("epl").from("sponsor_partners").select("id, cash_value_usd, status", { count: "exact" }),
    supabaseAdmin.from("evntszn_sponsor_accounts").select("id, status, scope_type, activation_status", { count: "exact" }),
    supabaseAdmin.from("evntszn_program_members").select("id, program_key, status, city, activation_readiness", { count: "exact" }),
    supabaseAdmin.schema("epl").from("staff_applications").select("id, status, opportunity_type, hiring_decision"),
    supabaseAdmin.schema("epl").from("opportunities").select("id, status, opportunity_type, is_public"),
    supabaseAdmin.from("evntszn_operator_profiles").select("user_id, can_access_scanner"),
    supabaseAdmin.from("evntszn_event_staff").select("id, can_scan, status"),
    supabaseAdmin.from("evntszn_operator_profiles").select("city_scope, organizer_classification, is_active"),
    supabaseAdmin.from("support_tickets").select("id, status, issue_type, severity"),
    supabaseAdmin
      .from("growth_compensation_events")
      .select("id, entity_id, attributed_to_user_id, revenue_amount_usd, compensation_amount_usd, source_event_id, created_at, metadata_json"),
    supabaseAdmin
      .from("growth_compensation_summary")
      .select("id, attributed_to_user_id, total_compensation_usd, last_updated_at"),
    supabaseAdmin
      .from("growth_attributions")
      .select("id, entity_type, entity_id, attributed_to_user_id, attribution_active"),
  ]);

  const applications = appsRes.data || [];
  const paidOrders = (ticketOrdersRes.data || []).filter((row) => row.status === "paid");
  const ticketRevenueUsd = paidOrders.reduce((sum, row) => sum + Number(row.amount_total_usd || 0), 0);
  const sponsorRevenueUsd = (sponsorsRes.data || [])
    .reduce((sum, row) => sum + Number(row.cash_value_usd || 0), 0);
  const cityRevenueMap = new Map<string, number>();
  const eventRevenueMap = new Map<string, number>();

  for (const order of paidOrders) {
    const city = ((order.evntszn_events as { city?: string } | null)?.city || "Unassigned").trim();
    const eventTitle = ((order.evntszn_events as { title?: string } | null)?.title || "Event").trim();
    cityRevenueMap.set(city, (cityRevenueMap.get(city) || 0) + (order.amount_total_usd || 0));
    eventRevenueMap.set(eventTitle, (eventRevenueMap.get(eventTitle) || 0) + (order.amount_total_usd || 0));
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
  const sponsorAccountCounts = Object.entries(
    (sponsorAccountsRes.data || []).reduce<Record<string, number>>((acc, row) => {
      const key = `${String(row.status || "unknown")}:${String(row.activation_status || "prospect")}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {}),
  ).map(([status, count]) => ({ status, count }));
  const programCounts = Object.entries(
    (programMembersRes.data || []).reduce<Record<string, number>>((acc, row) => {
      const key = `${row.program_key}:${row.status}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {}),
  ).map(([key, count]) => ({ key, count }));
  const opportunityCounts = {
    total: (opportunitiesRes.data || []).length,
    open: (opportunitiesRes.data || []).filter((row) => row.status === "open").length,
    public: (opportunitiesRes.data || []).filter((row) => row.is_public).length,
    paid: (opportunitiesRes.data || []).filter((row) => row.opportunity_type === "paid").length,
    volunteer: (opportunitiesRes.data || []).filter((row) => row.opportunity_type === "volunteer").length,
  };
  const hostOrganizerMix = (cityProfilesRes.data || []).reduce(
    (acc, row) => {
      if (!row.is_active) return acc;
      if (row.organizer_classification === "evntszn_host" || row.organizer_classification === "city_host") acc.hosts += 1;
      if (row.organizer_classification === "independent_organizer") acc.independentOrganizers += 1;
      return acc;
    },
    { hosts: 0, independentOrganizers: 0 },
  );
  const pendingProgramReviews = (programMembersRes.data || []).filter((row) => row.status === "applicant" || row.status === "reviewing").length;
  const sponsorLifecycle = {
    prospects: (sponsorAccountsRes.data || []).filter((row) => row.activation_status === "prospect").length,
    active: (sponsorAccountsRes.data || []).filter((row) => row.activation_status === "active").length,
  };
  const cityReadinessCounts = Object.entries(
    (cityProfilesRes.data || []).reduce<Record<string, { hosts: number; programs: number }>>((acc, row) => {
      const cities = Array.isArray(row.city_scope) && row.city_scope.length ? row.city_scope : ["Unassigned"];
      for (const city of cities) {
        if (!acc[city]) acc[city] = { hosts: 0, programs: 0 };
        if (row.organizer_classification === "evntszn_host" || row.organizer_classification === "city_host") {
          acc[city].hosts += 1;
        }
      }
      return acc;
    }, {}),
  ).map(([city, values]) => ({
    city,
    hosts: values.hosts,
    programs: (programMembersRes.data || []).filter((row) => String(row.city || "Unassigned").trim() === city && (row.activation_readiness === "ready" || row.activation_readiness === "active")).length,
  }));
  const cityRevenue = Array.from(cityRevenueMap.entries())
    .map(([city, revenueUsd]) => ({ city, revenueUsd }))
    .sort((a, b) => b.revenueUsd - a.revenueUsd)
    .slice(0, 6);
  const topEvents = Array.from(eventRevenueMap.entries())
    .map(([title, revenueUsd]) => ({ title, revenueUsd }))
    .sort((a, b) => b.revenueUsd - a.revenueUsd)
    .slice(0, 6);
  const growthEvents = growthEventsRes.data || [];
  const totalAttributedRevenueUsd = growthEvents.reduce((sum, row) => sum + Number(row.revenue_amount_usd || 0), 0);
  const totalGrowthCompensationUsd = growthEvents.reduce((sum, row) => sum + Number(row.compensation_amount_usd || 0), 0);
  const growthByHost = Object.entries(
    growthEvents.reduce<Record<string, { revenueUsd: number; compensationUsd: number; orderCount: number }>>((acc, row) => {
      const key = String(row.entity_id || "unknown");
      if (!acc[key]) acc[key] = { revenueUsd: 0, compensationUsd: 0, orderCount: 0 };
      acc[key].revenueUsd += Number(row.revenue_amount_usd || 0);
      acc[key].compensationUsd += Number(row.compensation_amount_usd || 0);
      acc[key].orderCount += 1;
      return acc;
    }, {}),
  ).map(([entityId, value]) => ({ entityId, ...value }));
  const growthByEvent = Object.entries(
    growthEvents.reduce<Record<string, { revenueUsd: number; compensationUsd: number; orderCount: number }>>((acc, row) => {
      const key = String(row.source_event_id || "unknown");
      if (!acc[key]) acc[key] = { revenueUsd: 0, compensationUsd: 0, orderCount: 0 };
      acc[key].revenueUsd += Number(row.revenue_amount_usd || 0);
      acc[key].compensationUsd += Number(row.compensation_amount_usd || 0);
      acc[key].orderCount += 1;
      return acc;
    }, {}),
  ).map(([eventId, value]) => ({ eventId, ...value }));
  const activeAttributedEntities = (growthAttributionsRes.data || []).filter((row) => row.attribution_active).length;
  const inactiveAttributedEntities = (growthAttributionsRes.data || []).filter((row) => !row.attribution_active).length;

  return NextResponse.json({
    stats: {
      totalUsers: usersRes.count || 0,
      operatorProfiles: operatorRes.count || 0,
      pendingApprovals: applications.filter((row) => row.status === "new" || row.status === "reviewing").length,
      openIssues: (logsRes.data || []).filter((row) => row.status !== "resolved").length,
      publicEvents: (eventsRes.data || []).filter((row) => row.status === "published").length,
      ticketRevenueUsd,
      sponsorRevenueUsd,
      sponsorPackageOrders: sponsorOrdersRes.count || 0,
      sponsorAccounts: sponsorAccountsRes.count || 0,
      programMembers: programMembersRes.count || 0,
      pendingProgramReviews,
      activeHosts: hostOrganizerMix.hosts,
      independentOrganizers: hostOrganizerMix.independentOrganizers,
      sponsorProspects: sponsorLifecycle.prospects,
      activeSponsors: sponsorLifecycle.active,
      supportTicketsOpen: (supportTicketsRes.data || []).filter((row) => row.status === "open" || row.status === "in_progress" || row.status === "escalated").length,
      supportTicketsEscalated: (supportTicketsRes.data || []).filter((row) => row.status === "escalated").length,
      checkInTotal,
      scannerCapableOperators: (scannerOperatorsRes.data || []).filter((row) => row.can_access_scanner).length,
      activeScanAssignments: (scannerAssignmentsRes.data || []).filter((row) => row.can_scan && row.status === "active").length,
      storeFailureCount: (logsRes.data || []).filter((row) => String(row.source || "").includes("printful")).length,
      webhookFailureCount: (logsRes.data || []).filter((row) => String(row.source || "").includes("stripe")).length,
      totalAttributedRevenueUsd,
      totalGrowthCompensationUsd,
      activeAttributedEntities,
      inactiveAttributedEntities,
    },
    applications,
    issues: logsRes.data || [],
    cityRevenue,
    topEvents,
    issueCountsBySource,
    issueCountsBySeverity,
    sponsorAccountCounts,
    programCounts,
    hiringStageCounts,
    opportunityCounts,
    hostOrganizerMix,
    cityReadinessCounts,
    growthCompensation: {
      totalAttributedRevenueUsd,
      totalCompensationUsd: totalGrowthCompensationUsd,
      activeAttributedEntities,
      inactiveAttributedEntities,
      summaries: growthSummaryRes.data || [],
      byHost: growthByHost,
      byEvent: growthByEvent,
    },
    supportCountsByType: Object.entries(
      (supportTicketsRes.data || []).reduce<Record<string, number>>((acc, row) => {
        const key = String(row.issue_type || "other");
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}),
    ).map(([type, count]) => ({ type, count })),
  });
}
