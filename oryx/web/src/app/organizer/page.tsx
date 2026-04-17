import Link from "next/link";
import PublicPageFrame from "@/components/public/PublicPageFrame";
import SurfaceShell from "@/components/shells/SurfaceShell";
import { getLoginUrl } from "@/lib/domains";
import { getPlatformViewer } from "@/lib/evntszn";
import { supabaseAdmin } from "@/lib/supabase-admin";
import OrganizerDashboard from "./OrganizerDashboard";

export const dynamic = "force-dynamic";

export default async function OrganizerPage() {
  const viewer = await getPlatformViewer();

  if (viewer.user) {
    const canOperate =
      viewer.isPlatformAdmin ||
      viewer.profile?.primary_role === "organizer" ||
      viewer.operatorProfile?.organizer_classification === "independent_organizer";

    const { data: events } = await supabaseAdmin
      .from("evntszn_events")
      .select("id, slug, title, status, visibility, start_at, check_in_count")
      .eq("organizer_user_id", viewer.user.id)
      .order("start_at", { ascending: false });

    return (
      <SurfaceShell
        surface="ops"
        eyebrow="Partner workspace"
        title="Run your events without leaving the operating layer"
        description="Create events, price tickets in dollars, manage inventory, and work from a real partner dashboard."
      >
        <OrganizerDashboard canOperate={canOperate} events={events || []} />
      </SurfaceShell>
    );
  }

  return (
    <PublicPageFrame
      title="Partner"
      description="Manage your own events, brand, and audience with EVNTSZN's platform tools."
      heroImage="https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1800&q=80"
      seo={{
        title: "Partner | EVNTSZN Platform",
        description: "Run your own events with EVNTSZN platform tools while keeping your brand, audience, and operating lane intact.",
      }}
    >
      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:px-8">
        <div className="ev-panel p-6">
          <div className="ev-section-kicker">Partner path</div>
          <div className="mt-3 text-2xl font-black tracking-tight text-white md:text-3xl">
            Operate as a Partner
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/72">
            The Partner path is for individuals and groups who manage events, brand, and audience independently. Use Link, Crew, Reserve, and event operations without entering the EVNTSZN Curator economics.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/organizer/apply" className="ev-button-primary px-8">
              Apply as Partner
            </Link>
            <Link href={getLoginUrl("/organizer", "app.evntszn.com")} className="ev-button-secondary px-8">
              Enter Organizer Dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:px-8">
        <div className="ev-panel p-6">
          <div className="ev-section-kicker">Partner program value</div>
          <div className="mt-3 text-2xl font-black tracking-tight text-white">Why EVNTSZN for Partners?</div>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-2xl font-semibold mb-3 text-white">Platform tools</h3>
              <p className="text-sm leading-relaxed text-white/70">
            Access EVNTSZN Link for promotion, the Crew Marketplace to find talent, and EVNTSZN Reserve for bookings. All three are routed to keep partner operations clean.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-3 text-white">Monetization & control</h3>
              <p className="text-sm leading-relaxed text-white/70">
                Keep your event economics intact, price tickets in dollars, control inventory, and run your own event cadence without inheriting curator-network splits.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:px-8 text-center">
        <h2 className="text-4xl font-bold mb-8 text-white">Interested in partnering with EVNTSZN?</h2>
        <p className="text-lg text-white/70 max-w-3xl mx-auto mb-8">
          If you need a larger commercial relationship, explore the sponsor lane for brands, activations, and city-level placements.
        </p>
        <Link href="/sponsors" className="ev-button-primary px-8 py-3 text-lg">
          Explore sponsors
        </Link>
      </section>
    </PublicPageFrame>
  );
}
