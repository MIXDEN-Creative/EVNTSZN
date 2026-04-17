// src/app/admin-login/page.tsx
import Link from "next/link";
import PublicPageFrame from "@/components/public/PublicPageFrame";
import InternalAccessForm from "./InternalAccessForm";

type AdminLoginPageProps = {
  searchParams?: Promise<{
    next?: string | string[];
  }>;
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const nextValue = Array.isArray(resolvedSearchParams.next)
    ? resolvedSearchParams.next[0] ?? "/epl/admin"
    : resolvedSearchParams.next ?? "/epl/admin";

  return (
    <PublicPageFrame
      title="Secure internal access for EVNTSZN operations."
      description="This lane is for invited operational roles only: EVNTSZN Curators, Partners, Sponsors, venue teams, city office, scanner staff, ops, and HQ. Public members should use the member sign-in lane instead."
    >
      <section className="ev-public-section py-8 md:py-10">
        <div className="grid gap-8 xl:grid-cols-[0.82fr_1.18fr]">
          <aside className="space-y-6">
            <section className="rounded-[36px] border border-white/10 bg-white/[0.03] p-7">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#caa7ff]">Operations Lane</div>
              <h2 className="mt-3 text-2xl font-black text-white">Who should use this sign-in?</h2>
              <div className="mt-5 grid gap-3">
                {[
                  "EVNTSZN Curators managing network-led event activity",
                  "Partners operating self-serve event or growth lanes",
                  "Sponsors managing campaigns, placements, and deliverables",
                  "Venue, reserve, scanner, city office, ops, and HQ teams",
                ].map((item) => (
                  <div key={item} className="rounded-[24px] border border-white/10 bg-black/30 px-4 py-4 text-sm leading-6 text-white/68">
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[36px] border border-white/10 bg-white/[0.03] p-7">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">Next destination</div>
              <div className="mt-3 text-2xl font-black text-white">{nextValue}</div>
              <p className="mt-3 text-sm leading-6 text-white/60">
                EVNTSZN will route you into the correct desk after role verification so dashboards, queue access, and permissions line up with your operational surface.
              </p>
            </section>

            <section className="rounded-[36px] border border-white/10 bg-white/[0.03] p-7">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">Need the public lane instead?</div>
              <p className="mt-3 text-sm leading-6 text-white/60">
                Tickets, orders, registrations, Link, and public account tools stay on the member sign-in flow.
              </p>
              <Link
                href={`/account/login?next=${encodeURIComponent(nextValue)}`}
                className="mt-6 inline-flex w-full items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Go to member sign-in
              </Link>
            </section>
          </aside>

          <div className="rounded-[40px] border border-white/10 bg-[#0c0c15] p-8 shadow-[0_32px_80px_rgba(0,0,0,0.5)] md:p-12">
            <div className="mb-4 inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-[#caa7ff]">
              Internal Access
            </div>
            <h2 className="text-4xl font-black tracking-tight text-white leading-[0.95]">Secure operations sign-in.</h2>
            <p className="mt-6 max-w-2xl text-sm leading-7 text-white/55">
              Use your invited internal account, or founder override when needed. This lane protects admin tools, operational queues, reserve workflows, EPL controls, and scanner access from the public product surface.
            </p>
            <div className="mt-10">
              <InternalAccessForm next={nextValue} />
            </div>
            <div className="mt-10 border-t border-white/5 pt-8 text-center">
              <Link href="/" className="text-xs font-bold uppercase tracking-widest text-white/40 transition-all hover:text-white">
                Back to public site
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicPageFrame>
  );
}
