import type { Metadata } from "next";
import PublicPageFrame from "@/components/public/PublicPageFrame";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Review the terms that govern EVNTSZN accounts, discovery, ticketing, league access, and platform use.",
};

export default function TermsPage() {
  return (
    <PublicPageFrame>
      <section className="mx-auto max-w-4xl px-4 py-14 md:px-6 lg:px-8">
        <div className="ev-kicker">Terms</div>
        <h1 className="ev-title">Terms of Use</h1>
        <div className="ev-panel mt-8 space-y-6 p-6 md:p-8 text-white/74">
          <p>
            By using EVNTSZN™, you agree to use the platform lawfully, protect your account credentials, and respect all event, league, ticketing, scanner, and checkout policies tied to the experiences you access.
          </p>
          <p>
            Tickets, registrations, memberships, merchandise purchases, and event-related actions may be subject to additional event-specific or vendor-specific terms, including policies enforced through Stripe, Printful, and venue or organizer requirements.
          </p>
          <p>
            EVNTSZN reserves the right to suspend access, cancel fraudulent orders, deny scanner entry, or revoke platform privileges where misuse, abuse, or policy violations occur.
          </p>
          <p>
            EVNTSZN is Powered by ORYX. ORYX is a product of MIXDEN Creative.
          </p>
        </div>
      </section>
    </PublicPageFrame>
  );
}
