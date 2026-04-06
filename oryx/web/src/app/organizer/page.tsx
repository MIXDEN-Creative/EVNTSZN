import OrganizerDashboard from "./OrganizerDashboard";
import { getPlatformViewer, requirePlatformUser } from "@/lib/evntszn";
import { supabaseAdmin } from "@/lib/supabase-admin";

export default async function OrganizerPage() {
  await requirePlatformUser("/organizer");
  const viewer = await getPlatformViewer();

  const { data: events } = await supabaseAdmin
    .from("evntszn_events")
    .select("id, slug, title, status, visibility, start_at, check_in_count")
    .eq("organizer_user_id", viewer.user!.id)
    .order("start_at", { ascending: true });

  return (
    <main className="min-h-screen bg-black px-6 py-12 text-white">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs uppercase tracking-[0.28em] text-[#A259FF]">Organizer OS</p>
        <h1 className="mt-3 text-5xl font-black tracking-tight">Event operating system</h1>
        <p className="mt-4 max-w-3xl text-lg text-white/66">
          Manage event setup, ticket releases, scanner routes, and venue execution from one
          premium EVNTSZN workspace.
        </p>

        <div className="mt-10">
          <OrganizerDashboard
            canOperate={viewer.isPlatformAdmin || viewer.profile?.primary_role === "organizer"}
            events={events || []}
          />
        </div>
      </div>
    </main>
  );
}
