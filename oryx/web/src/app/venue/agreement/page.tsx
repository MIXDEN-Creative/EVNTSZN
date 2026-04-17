import Link from "next/link";
import PublicPageFrame from "@/components/public/PublicPageFrame";
import VenueAgreementForm from "@/components/public/VenueAgreementForm";

export default function VenueAgreementPage() {
  return (
    <PublicPageFrame
      title="Venue Agreement"
      description="Route venue paperwork, operating terms, and approval notes through one EVNTSZN agreement workflow."
      heroImage="https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1800&q=80"
      seo={{
        title: "Venue Agreement | EVNTSZN",
        description: "Send venue agreement intake into the EVNTSZN agreements desk with market routing, contact details, and approval context.",
      }}
    >
      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
          <div className="ev-panel p-6 md:p-8">
            <div className="ev-section-kicker">Agreement routing</div>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-white">Move venue approvals without email sprawl.</h1>
            <p className="mt-4 text-sm leading-6 text-white/65">
              This route sends the intake into the agreements desk with the venue, market, applicant, and operating context attached so founder and HQ can assign it, move it, and clear blockers.
            </p>
            <div className="mt-6 space-y-3 text-sm text-white/70">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">Agreement intake lands in the <span className="text-white">Agreements Desk</span>.</div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">Venue onboarding context stays attached for <span className="text-white">Host</span>, <span className="text-white">Venue</span>, and <span className="text-white">Reserve</span> routing.</div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">If the venue needs Reserve as part of launch, move directly into the <Link href="/reserve" className="text-white underline">Reserve path</Link>.</div>
            </div>
          </div>

          <VenueAgreementForm />
        </div>
      </section>
    </PublicPageFrame>
  );
}
