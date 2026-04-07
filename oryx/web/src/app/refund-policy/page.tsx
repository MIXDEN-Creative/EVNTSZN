import type { Metadata } from "next";
import PublicPageFrame from "@/components/public/PublicPageFrame";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Review EVNTSZN refund expectations for tickets, registrations, league fees, and merchandise.",
};

export default function RefundPolicyPage() {
  return (
    <PublicPageFrame>
      <section className="mx-auto max-w-4xl px-4 py-14 md:px-6 lg:px-8">
        <div className="ev-kicker">Refunds</div>
        <h1 className="ev-title">Refund Policy</h1>
        <div className="ev-panel mt-8 space-y-6 p-6 md:p-8 text-white/74">
          <p>
            Refund eligibility depends on the product type and the event or league rules attached to the purchase. Some ticket sales, registration fees, and made-to-order merchandise may be final unless the event is canceled, materially changed, or otherwise covered by a stated exception.
          </p>
          <p>
            Merchandise fulfilled through Printful follows fulfillment-stage limitations. Once production begins, cancellation or refund availability may be limited unless the item arrives defective or materially incorrect.
          </p>
          <p>
            Eventbrite-style blanket guarantees are not assumed. Users should review event-specific policies at checkout. If a refund path is approved, EVNTSZN will process it through the original payment rail where possible.
          </p>
        </div>
      </section>
    </PublicPageFrame>
  );
}
