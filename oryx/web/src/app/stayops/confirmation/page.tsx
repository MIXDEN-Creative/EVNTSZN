import type { Metadata } from "next";
import Link from "next/link";
import PublicPageFrame from "@/components/public/PublicPageFrame";
import { getStayOpsOrigin } from "@/lib/domains";

export const metadata: Metadata = {
  alternates: {
    canonical: `${getStayOpsOrigin()}/confirmation`,
  },
};

type ConfirmationProps = {
  searchParams?: Promise<{
    mode?: string | string[];
    tier?: string | string[];
    invoice?: string | string[];
  }>;
};

export default async function StayOpsConfirmationPage({ searchParams }: ConfirmationProps) {
  const params = (await searchParams) ?? {};
  const mode = Array.isArray(params.mode) ? params.mode[0] : params.mode;
  const tier = Array.isArray(params.tier) ? params.tier[0] : params.tier;
  const invoice = Array.isArray(params.invoice) ? params.invoice[0] : params.invoice;

  return (
    <PublicPageFrame
      title="StayOps intake received."
      description="Your property intake is in the EVNTSZN review flow and ready for onboarding follow-through."
    >
      <section className="mx-auto max-w-4xl px-4 py-16 md:px-6 lg:px-8">
        <div className="rounded-[36px] border border-white/10 bg-[#0c0c15] p-8 md:p-10">
          <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#caa7ff]">Confirmation</div>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-white md:text-5xl">
            {mode === "onboarding" ? "Proceed to onboarding." : "We'll review & onboard you."}
          </h1>
          <p className="mt-5 text-base leading-7 text-white/68">
            EVNTSZN has the StayOps intake, service tier, property details, and add-on intent. The asset can now be reviewed as a revenue operation instead of a disconnected listing.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] border border-white/10 bg-black/25 p-4 text-sm text-white/70">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">Selected tier</div>
              <div className="mt-2 text-lg font-bold text-white">{tier ? `${tier}%` : "Captured"}</div>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-black/25 p-4 text-sm text-white/70">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">Onboarding mode</div>
              <div className="mt-2 text-lg font-bold text-white">{mode === "onboarding" ? "Direct onboarding" : "Review first"}</div>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-black/25 p-4 text-sm text-white/70">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">Setup fee / add-ons</div>
              <div className="mt-2 text-lg font-bold text-white">{invoice ? "Invoice requested" : "Handled in onboarding"}</div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/stayops" className="ev-button-secondary">Back to StayOps</Link>
            <Link href="/enter" className="ev-button-primary">Enter EVNTSZN</Link>
          </div>
        </div>
      </section>
    </PublicPageFrame>
  );
}
