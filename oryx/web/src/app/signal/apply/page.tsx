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
      <section className="mx-auto max-w-4xl px-4 py-16 md:px-6 lg:px-8">
        <div className="ev-kicker">Signal program</div>
        <h1 className="ev-title max-w-4xl">Apply to Signal if you can support activation, visibility, and controlled network execution.</h1>
        <p className="ev-subtitle max-w-2xl">
          Signal is a managed program layer for city support, activation, and aligned field execution. It is not the same as Ambassador and it does not automatically grant broader operator access.
        </p>
        <div className="mt-8">
          <ProgramApplicationForm programKey="signal" />
        </div>
      </section>
    </PublicPageFrame>
  );
}
