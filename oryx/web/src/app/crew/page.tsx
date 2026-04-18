import { Badge } from "@/components/ui/badge";
import CrewBookingClient from "@/components/evntszn/CrewBookingClient";
import { getCrewMembersForPhase } from "@/lib/evntszn-phase";

export default async function CrewPage() {
  const members = await getCrewMembersForPhase();

  return (
    <main className="ev-public-page">
      <section className="ev-public-section py-8">
        <Badge>Crew</Badge>
        <h1 className="ev-title max-w-5xl">A live marketplace for DJs, bartenders, photographers, videographers, and curators.</h1>
      </section>
      <section className="ev-public-section pb-14">
        <CrewBookingClient members={members} />
      </section>
    </main>
  );
}
