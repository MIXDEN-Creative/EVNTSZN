import { Badge } from "@/components/ui/badge";
import VenueOpsClient from "@/components/evntszn/VenueOpsClient";
import PublicPageFrame from "@/components/public/PublicPageFrame";
import { getVenueDashboardSnapshot } from "@/lib/evntszn-phase";

export default async function VenuesPage() {
  const snapshot = await getVenueDashboardSnapshot();

  return (
    <PublicPageFrame
      title="Venue listing and venue operations should feel connected, not confused."
      description="Browse the venue system, see what EVNTSZN tracks, and move into the right lane for listing, reserve, and nightlife operations."
      heroImage="https://images.unsplash.com/photo-1514525253361-bee243870eb2?auto=format&fit=crop&w=1800&q=80"
    >
      <main className="ev-public-page">
        <section className="ev-public-section py-8">
          <Badge>Venues</Badge>
          <h1 className="ev-title max-w-5xl">Free venue listing, Smart Fill toggle, and live entry into the system.</h1>
        </section>
        <section className="ev-public-section pb-14">
          <VenueOpsClient mode="listing" snapshot={snapshot} />
        </section>
      </main>
    </PublicPageFrame>
  );
}
