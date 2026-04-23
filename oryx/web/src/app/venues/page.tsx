import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import VenueOpsClient from "@/components/evntszn/VenueOpsClient";
import PublicPageFrame from "@/components/public/PublicPageFrame";
import { getVenueDashboardSnapshot } from "@/lib/evntszn-phase";
import { buildCollectionPageSchema, buildPageMetadata } from "@/lib/seo";
import { getWebOrigin } from "@/lib/domains";

export const metadata: Metadata = buildPageMetadata({
  title: "EVNTSZN Venues | listing, Smart Fill, and venue operations",
  description:
    "Browse the EVNTSZN venue system, see Smart Fill status, and move into the right lane for listing, reserve, and nightlife operations.",
  path: "/venues",
  origin: getWebOrigin(),
});

export default async function VenuesPage() {
  const snapshot = await getVenueDashboardSnapshot();

  return (
    <PublicPageFrame
      title="Venue listing and venue operations should feel connected, not confused."
      description="Browse the venue system, see what EVNTSZN tracks, and move into the right lane for listing, reserve, and nightlife operations."
      heroImage="https://images.unsplash.com/photo-1514525253361-bee243870eb2?auto=format&fit=crop&w=1800&q=80"
      structuredData={buildCollectionPageSchema({
        name: "EVNTSZN Venues",
        description:
          "Venue listing, Smart Fill, reserve readiness, and nightlife operations.",
        path: "/venues",
      })}
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
