import type { Metadata } from "next";
import PublicPageFrame from "@/components/public/PublicPageFrame";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Read how EVNTSZN handles account, discovery, event, and transaction data.",
};

export default function PrivacyPage() {
  return (
    <PublicPageFrame>
      <section className="mx-auto max-w-4xl px-4 py-14 md:px-6 lg:px-8">
        <div className="ev-kicker">Privacy</div>
        <h1 className="ev-title">Privacy Policy</h1>
        <div className="ev-panel mt-8 space-y-6 p-6 md:p-8 text-white/74">
          <p>
            EVNTSZN™ collects only the information needed to support discovery, ticketing, checkout, account access, scanner verification, and league operations. We use that information to deliver the product, protect users, prevent fraud, and improve the platform.
          </p>
          <p>
            Account details, order history, reward activity, and event participation data may be processed through EVNTSZN, Powered by ORYX, with infrastructure and vendor support from providers including Supabase, Stripe, Printful, Resend, and Cloudflare.
          </p>
          <p>
            We do not sell personal data as a standalone business. We may use analytics, operational logs, and aggregated discovery behavior to improve platform quality, search relevance, and fraud prevention.
          </p>
          <p>
            If you need account assistance or data-rights support, contact the EVNTSZN support channel listed on the platform. ORYX is a product of MIXDEN Creative.
          </p>
        </div>
      </section>
    </PublicPageFrame>
  );
}
