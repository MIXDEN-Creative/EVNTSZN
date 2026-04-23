import { Badge } from "@/components/ui/badge";
import EngagementBeacon from "@/components/engagement/EngagementBeacon";
import EngagementLoopPanel from "@/components/engagement/EngagementLoopPanel";
import CrewBookingClient from "@/components/evntszn/CrewBookingClient";
import PublicPageFrame from "@/components/public/PublicPageFrame";
import { getCrewMembersForPhase } from "@/lib/evntszn-phase";

export default async function CrewPage() {
  const members = await getCrewMembersForPhase();

  return (
    <PublicPageFrame
      title="Book premium event talent with clear trust, pricing, and scope."
      description="Crew is EVNTSZN's premium event services marketplace for operators who need reliable talent, transparent pricing, and a cleaner booking path."
      heroImage="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1800&q=80"
    >
      <main className="ev-public-page">
        <EngagementBeacon eventType="crew_view" city={members[0]?.city || "Baltimore"} referenceType="crew" referenceId="marketplace" dedupeKey={`crew:view:${new Date().toISOString().slice(0, 10)}`} />
        <section className="ev-public-section py-8">
          <Badge>Crew</Badge>
          <h1 className="ev-title max-w-5xl">A live marketplace for DJs, bartenders, photographers, videographers, and curators.</h1>
        </section>
        <section className="ev-public-section pb-8">
          <EngagementLoopPanel
            contextLabel="Crew trust"
            title="Turn one request into repeat operator status."
            body="Crew now feeds trusted-requester progression, crew connector achievements, and a more durable marketplace loop than simple lead capture."
            actionHref="/enter"
            actionLabel="Enter EVNTSZN"
          />
        </section>
        <section className="ev-public-section pb-14">
          <CrewBookingClient members={members} />
        </section>
      </main>
    </PublicPageFrame>
  );
}
