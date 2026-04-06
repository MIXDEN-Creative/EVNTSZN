import VenueOpsDashboard from "./VenueOpsDashboard";
import SurfaceShell from "@/components/shells/SurfaceShell";
import { getPlatformViewer, requirePlatformRole } from "@/lib/evntszn";
import { supabaseAdmin } from "@/lib/supabase-admin";

export default async function VenuePage() {
  await requirePlatformRole("/venue", ["venue"]);
  const viewer = await getPlatformViewer();

  const [venueEventsRes, staffEventsRes] = await Promise.all([
    supabaseAdmin
      .from("evntszn_events")
      .select("id, slug, title, start_at, scanner_status, check_in_count, city, state, evntszn_venues!inner(owner_user_id)")
      .eq("evntszn_venues.owner_user_id", viewer.user!.id)
      .order("start_at", { ascending: true }),
    supabaseAdmin
      .from("evntszn_event_staff")
      .select("evntszn_events!inner(id, slug, title, start_at, scanner_status, check_in_count, city, state)")
      .eq("user_id", viewer.user!.id)
      .eq("status", "active")
      .eq("role_code", "venue_manager"),
  ]);

  const venueEvents = (venueEventsRes.data || []).map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    start_at: row.start_at,
    scanner_status: row.scanner_status,
    check_in_count: row.check_in_count,
    city: row.city,
    state: row.state,
  }));

  const staffedEvents = (staffEventsRes.data || []).flatMap((row) => {
    const event = Array.isArray(row.evntszn_events) ? row.evntszn_events[0] : row.evntszn_events;
    return event
      ? [
          {
            id: event.id,
            slug: event.slug,
            title: event.title,
            start_at: event.start_at,
            scanner_status: event.scanner_status,
            check_in_count: event.check_in_count,
            city: event.city,
            state: event.state,
          },
        ]
      : [];
  });

  const byId = new Map([...venueEvents, ...staffedEvents].map((event) => [event.id, event]));

  return (
    <SurfaceShell
      surface="ops"
      eyebrow="Venue ops"
      title="Front gate and room control"
      description="Venue operators get a purpose-built dashboard for scanner access, attendance pulse, and event-day execution without exposing scanner routes in public navigation."
      meta={
        <>
          <div className="ev-meta-card">
            <div className="ev-meta-label">Assigned events</div>
            <div className="ev-meta-value">{byId.size} events currently connected to this venue operator account.</div>
          </div>
          <div className="ev-meta-card">
            <div className="ev-meta-label">Execution lane</div>
            <div className="ev-meta-value">Scanner launch, check-in visibility, and venue staffing stay separated from public attendee flows.</div>
          </div>
        </>
      }
    >
      <VenueOpsDashboard
        canOperate={viewer.isPlatformAdmin || viewer.profile?.primary_role === "venue"}
        events={Array.from(byId.values())}
      />
    </SurfaceShell>
  );
}
