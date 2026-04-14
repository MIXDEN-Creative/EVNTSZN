import type { Metadata } from "next";
import PublicPageFrame from "@/components/public/PublicPageFrame";
import ProgramApplicationForm from "../../shared/ProgramApplicationForm";

export const metadata: Metadata = {
  title: "Apply to Ambassador | EVNTSZN",
  description:
    "Submit interest for the EVNTSZN Ambassador program. Ambassador supports city growth, referrals, and public-facing community pull as a separate program from Signal.",
  alternates: {
    canonical: "https://evntszn.com/ambassador/apply",
  },
};

export default function AmbassadorApplyPage() {
  return (
    <PublicPageFrame>
      <section className="mx-auto max-w-4xl px-4 py-16 md:px-6 lg:py-24 lg:px-8 text-center flex flex-col items-center">
        <div className="ev-kicker text-[#A259FF]">Restricted Program</div>
        <h1 className="ev-title mt-6 max-w-4xl">Request consideration for Ambassador activation.</h1>
        <p className="ev-subtitle mt-6 max-w-2xl text-white/60">
          Ambassador is a community-focused growth and referral program. Activation is managed exclusively by HQ and local City Offices.
          Submission of this form is a request for consideration, not an automatic grant of access.
        </p>
        <div className="mt-12 w-full text-left">
          <ProgramApplicationForm programKey="ambassador" />
        </div>
      </section>
    </PublicPageFrame>
  );
}
