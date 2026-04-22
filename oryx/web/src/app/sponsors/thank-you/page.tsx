import Link from "next/link";
import PublicPageFrame from "@/components/public/PublicPageFrame";

type ThankYouProps = {
  searchParams?: Promise<{
    city?: string | string[];
    budget?: string | string[];
    invoice?: string | string[];
  }>;
};

export default async function SponsorsThankYouPage({ searchParams }: ThankYouProps) {
  const params = (await searchParams) ?? {};
  const city = Array.isArray(params.city) ? params.city[0] : params.city;
  const budget = Array.isArray(params.budget) ? params.budget[0] : params.budget;
  const invoice = Array.isArray(params.invoice) ? params.invoice[0] : params.invoice;

  return (
    <PublicPageFrame
      title="Sponsor application received."
      description="Your sponsor application is in the EVNTSZN commercial review flow."
    >
      <section className="mx-auto max-w-4xl px-4 py-16 md:px-6 lg:px-8">
        <div className="rounded-[36px] border border-white/10 bg-[#0c0c15] p-8 md:p-10">
          <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#caa7ff]">Sponsor desk</div>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-white md:text-5xl">Thanks. Your sponsor application is live.</h1>
          <p className="mt-5 text-base leading-7 text-white/68">
            EVNTSZN has your company, target city, budget range, and placement interest. The sponsor desk can now route the brand into packages, invoice flow, or activation planning without a dead branch.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] border border-white/10 bg-black/25 p-4 text-sm text-white/70">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">Target city</div>
              <div className="mt-2 text-lg font-bold text-white">{city || "Captured"}</div>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-black/25 p-4 text-sm text-white/70">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">Budget range</div>
              <div className="mt-2 text-lg font-bold text-white">{budget || "Captured"}</div>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-black/25 p-4 text-sm text-white/70">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">Commercial mode</div>
              <div className="mt-2 text-lg font-bold text-white">{invoice ? "Invoice requested" : "Package review"}</div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/sponsors/packages" className="ev-button-secondary">View sponsor packages</Link>
            <Link href="/enter" className="ev-button-primary">Enter EVNTSZN</Link>
          </div>
        </div>
      </section>
    </PublicPageFrame>
  );
}
