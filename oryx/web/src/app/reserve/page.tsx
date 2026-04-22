import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import PulseActivityBeacon from "@/components/evntszn/PulseActivityBeacon";
import ReservePageClient from "@/components/evntszn/ReservePageClient";
import PublicPageFrame from "@/components/public/PublicPageFrame";
import { getReserveVenuesForPhase } from "@/lib/evntszn-phase";

export default async function ReservePage() {
  const venues = await getReserveVenuesForPhase();

  return (
    <PublicPageFrame
      title="Reserve should feel calm, premium, and immediately bookable."
      description="EVNTSZN Reserve is the booking product for nightlife tables, time slots, and waitlist pressure. The experience is simple, high-trust, and ready to convert."
      heroImage="https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1800&q=80"
    >
      <main className="ev-public-page">
        <PulseActivityBeacon sourceType="reserve_view" city={venues[0]?.city || "Baltimore"} referenceType="reserve" referenceId="reserve-home" />
        <section className="ev-public-section py-8">
          <Badge>Reserve</Badge>
          <h1 className="ev-title max-w-5xl">Tables, time slots, waitlist pressure, and paid reservation holds.</h1>
          <p className="ev-subtitle max-w-3xl">
            EVNTSZN Reserve is the booking layer for nights out. It keeps the flow clean, keeps urgency visible, and keeps the next step obvious.
          </p>
        </section>

        <section className="ev-public-section pb-8">
          <ReservePageClient venues={venues} />
        </section>

        <section className="ev-public-section pb-14">
          <div className="grid gap-5 md:grid-cols-3">
            {[
              ["Limited availability", "Urgency stays visible so the first session has tension."],
              ["Live time slots", "Guests book from visible inventory, not a blind request form."],
              ["Trustworthy checkout", "Paid holds route cleanly without exposing unfinished fallback states."],
            ].map(([title, body]) => (
              <Card key={title}>
                <CardTitle>{title}</CardTitle>
                <CardDescription className="mt-3">{body}</CardDescription>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </PublicPageFrame>
  );
}
