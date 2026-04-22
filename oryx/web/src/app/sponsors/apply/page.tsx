import Link from "next/link";
import PublicPageFrame from "@/components/public/PublicPageFrame";
import SponsorApplyForm from "@/components/public/SponsorApplyForm";

export default function SponsorsApplyPage() {
  return (
    <PublicPageFrame
      title="Become a sponsor through one clear commercial intake."
      description="Send company, budget, city, placement interest, and contact info into the EVNTSZN sponsor desk."
      heroImage="https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=1800&q=80"
    >
      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <SponsorApplyForm />
          <div className="grid gap-4">
            <div className="rounded-[30px] border border-white/10 bg-[#0c0c15] p-6">
              <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#caa7ff]">Commercial lane</div>
              <div className="mt-3 text-3xl font-black text-white">Events, Pulse, EPL, and premium placement.</div>
              <p className="mt-3 text-sm leading-6 text-white/64">
                Sponsors are routed into one commercial system, not scattered across static pages. EVNTSZN can review budget, city, and placement goals before moving into package purchase or invoice.
              </p>
            </div>
            <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6">
              <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#caa7ff]">Next action</div>
              <p className="mt-3 text-sm leading-6 text-white/64">
                If your package is already defined, you can still move into direct package purchase. If not, the sponsor desk can scope the commercial plan first.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/sponsors/packages" className="ev-button-secondary">View packages</Link>
                <Link href="/enter" className="ev-button-primary">Enter EVNTSZN</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicPageFrame>
  );
}
