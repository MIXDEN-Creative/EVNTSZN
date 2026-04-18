import { Badge } from "@/components/ui/badge";
import VenueOpsClient from "@/components/evntszn/VenueOpsClient";
import { getVenueDashboardSnapshot } from "@/lib/evntszn-phase";

export default async function VenuesPage() {
  const snapshot = await getVenueDashboardSnapshot();

  return (
    <main className="ev-public-page">
      <section className="ev-public-section py-8">
        <Badge>Venues</Badge>
        <h1 className="ev-title max-w-5xl">Free venue listing, Smart Fill toggle, and live entry into the system.</h1>
      </section>
      <section className="ev-public-section pb-14">
        <VenueOpsClient mode="listing" snapshot={snapshot} />
      </section>
    </main>
  );
}
