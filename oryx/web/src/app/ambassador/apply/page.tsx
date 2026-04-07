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
      <section className="mx-auto max-w-4xl px-4 py-16 md:px-6 lg:px-8">
        <div className="ev-kicker">Ambassador program</div>
        <h1 className="ev-title max-w-4xl">Apply to Ambassador if you can help drive city awareness, referrals, and community pull.</h1>
        <p className="ev-subtitle max-w-2xl">
          Ambassador is a separate pipeline from Signal. It supports visibility and growth readiness, not uncontrolled operator access or internal host privileges by default.
        </p>
        <div className="mt-8">
          <ProgramApplicationForm programKey="ambassador" />
        </div>
      </section>
    </PublicPageFrame>
  );
}
