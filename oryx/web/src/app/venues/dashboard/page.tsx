import { Badge } from "@/components/ui/badge";
import VenueOpsClient from "@/components/evntszn/VenueOpsClient";
import { getVenueDashboardSnapshot } from "@/lib/evntszn-phase";

export default async function VenuesDashboardPage() {
  const snapshot = await getVenueDashboardSnapshot();

  return (
    <main className="ev-public-page">
      <section className="ev-public-section py-8">
        <Badge>Venue Dashboard</Badge>
        <h1 className="ev-title max-w-5xl">Basic remote venue operations.</h1>
      </section>
      <section className="ev-public-section pb-14">
        <VenueOpsClient mode="dashboard" snapshot={snapshot} />
      </section>
    </main>
  );
}
