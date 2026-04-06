import OrganizerDashboard from "./OrganizerDashboard";
import SurfaceShell from "@/components/shells/SurfaceShell";
import { getPlatformViewer, requirePlatformRole } from "@/lib/evntszn";
import { supabaseAdmin } from "@/lib/supabase-admin";

export default async function OrganizerPage() {
  await requirePlatformRole("/organizer", ["organizer"]);
  const viewer = await getPlatformViewer();

  const { data: events } = await supabaseAdmin
    .from("evntszn_events")
    .select("id, slug, title, status, visibility, start_at, check_in_count")
    .eq("organizer_user_id", viewer.user!.id)
    .order("start_at", { ascending: true });

  return (
    <SurfaceShell
      surface="ops"
      eyebrow="Organizer OS"
      title="Event operating system"
      description="Manage event setup, ticket releases, scanner routes, and venue execution from one premium EVNTSZN workspace."
      meta={
        <>
          <div className="ev-meta-card">
            <div className="ev-meta-label">Live events</div>
            <div className="ev-meta-value">{events?.length || 0} productions connected to this organizer account.</div>
          </div>
          <div className="ev-meta-card">
            <div className="ev-meta-label">Operator mode</div>
            <div className="ev-meta-value">Ticketing, scanner handoff, and event visibility remain contained inside the ops surface.</div>
          </div>
        </>
      }
    >
      <OrganizerDashboard
        canOperate={viewer.isPlatformAdmin || viewer.profile?.primary_role === "organizer"}
        events={events || []}
      />
    </SurfaceShell>
  );
}
