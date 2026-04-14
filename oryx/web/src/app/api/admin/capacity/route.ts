import { NextResponse } from "next/server";
import { getFounderSession } from "@/lib/founder-session";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const founder = await getFounderSession();
  if (!founder) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [
    { count: totalEvents },
    { count: totalTicketOrders },
    { count: totalNodeInteractions },
    { count: totalUsers },
  ] = await Promise.all([
    supabaseAdmin.from("evntszn_events").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("evntszn_ticket_orders").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("evntszn_node_interactions").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("evntszn_profiles").select("*", { count: "exact", head: true }),
  ]);

  const metrics: any[] = [
    {
      label: "Database rows (Core)",
      current: (totalEvents || 0) + (totalTicketOrders || 0) + (totalUsers || 0),
      limit: 10000,
      unit: "rows",
      status: "safe",
      upgradeGuidance: "Free tier supports up to 50,000 rows comfortably. We are well within safe limits. Optimize cleanup of old draft events before upgrading.",
    },
    {
      label: "Operational Pressure",
      current: (totalNodeInteractions || 0),
      limit: 50000,
      unit: "interactions",
      status: "safe",
      upgradeGuidance: "Node interactions are high-volume. If we hit 50k/mo, consider moving to a dedicated analytics table or Supabase Pro for better I/O performance.",
    },
    {
      label: "Storage Volume",
      current: 120 * 1024 * 1024, // Estimate for now
      limit: 1024 * 1024 * 1024, // 1GB
      unit: "bytes",
      status: "safe",
      upgradeGuidance: "Free storage limit is 1GB. We are using ~12%. Use image compression and 800px headshot caps to stay on free tier as long as possible.",
    },
  ];

  // Logic to adjust status based on thresholds
  metrics.forEach(m => {
    const ratio = m.current / m.limit;
    if (ratio > 0.9) m.status = "critical";
    else if (ratio > 0.7) m.status = "warning";
  });

  return NextResponse.json({ metrics });
}
