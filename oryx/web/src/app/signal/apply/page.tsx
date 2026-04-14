import type { Metadata } from "next";
import PublicPageFrame from "@/components/public/PublicPageFrame";
import ProgramApplicationForm from "../../shared/ProgramApplicationForm";

export const metadata: Metadata = {
  title: "Apply to Signal | EVNTSZN",
  description:
    "Request consideration for the EVNTSZN Signal program. Signal is a controlled support and activation layer, not a general public operator role.",
  alternates: {
    canonical: "https://evntszn.com/signal/apply",
  },
};

export default function SignalApplyPage() {
  return (
    <PublicPageFrame>
      <section className="mx-auto max-w-4xl px-4 py-16 md:px-6 lg:py-24 lg:px-8 text-center flex flex-col items-center">
        <div className="ev-kicker text-[#A259FF]">Restricted Program</div>
        <h1 className="ev-title mt-6 max-w-4xl">Request consideration for Signal activation.</h1>
        <p className="ev-subtitle mt-6 max-w-2xl text-white/60">
          Signal is a controlled support and field activation layer. Activation is managed exclusively by HQ and local City Offices. 
          Submission of this form is a request for consideration, not an automatic grant of access.
        </p>
        <div className="mt-12 w-full text-left">
          <ProgramApplicationForm programKey="signal" />
        </div>
      </section>
    </PublicPageFrame>
  );
}
