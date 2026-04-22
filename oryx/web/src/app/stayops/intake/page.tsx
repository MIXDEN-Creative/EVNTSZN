import type { Metadata } from "next";
import Link from "next/link";
import PublicPageFrame from "@/components/public/PublicPageFrame";
import { getStayOpsOrigin } from "@/lib/domains";
import StayOpsIntakeForm from "@/components/public/StayOpsIntakeForm";

export const metadata: Metadata = {
  alternates: {
    canonical: `${getStayOpsOrigin()}/intake`,
  },
};

export default function StayOpsIntakePage() {
  return (
    <PublicPageFrame
      title="Start StayOps with a real intake, not a dead lead form."
      description="Send property type, location, expected revenue, selected tier, and add-ons into the EVNTSZN StayOps review flow."
      heroImage="https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1800&q=80"
    >
      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <StayOpsIntakeForm />
          <div className="grid gap-4">
            <div className="rounded-[30px] border border-white/10 bg-[#0c0c15] p-6">
              <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#caa7ff]">What happens next</div>
              <div className="mt-3 text-3xl font-black text-white">Review, underwriting, onboarding.</div>
              <p className="mt-3 text-sm leading-6 text-white/64">
                EVNTSZN reviews the property, confirms tier fit, scopes add-ons, and moves the asset into onboarding without sending you into a dead operational branch.
              </p>
            </div>
            <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6">
              <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#caa7ff]">Payment placeholder</div>
              <p className="mt-3 text-sm leading-6 text-white/64">
                Setup fees and selected add-ons can be invoiced during onboarding. The intake stores invoice intent so the commercial lane remains open without blocking submission.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/stayops" className="ev-button-secondary">Back to StayOps</Link>
                <Link href="/enter" className="ev-button-primary">Enter EVNTSZN</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicPageFrame>
  );
}
