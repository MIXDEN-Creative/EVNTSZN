import Link from "next/link";
import PublicPageFrame from "@/components/public/PublicPageFrame";

type EnterPageProps = {
  searchParams?: Promise<{
    next?: string | string[];
  }>;
};

export default async function EnterPage({ searchParams }: EnterPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const nextValue = Array.isArray(resolvedSearchParams.next)
    ? resolvedSearchParams.next[0] ?? "/account"
    : resolvedSearchParams.next ?? "/account";

  const internalNext = encodeURIComponent(nextValue === "/account" ? "/ops" : nextValue);
  const memberNext = encodeURIComponent(nextValue);

  return (
    <PublicPageFrame
      title="Choose the right EVNTSZN entry lane."
      description="Member access, operator access, venue access, partner access, and curator access stay clearly separated so discovery feels calm and operations stay secure."
      heroImage="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1800&q=80"
    >
      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[36px] border border-white/10 bg-[#0c0c15] p-7 md:p-9">
            <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#caa7ff]">Entry System</div>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-white md:text-5xl">
              One clean front door. Clear lanes after that.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/68">
              Guests and members use the member lane for tickets, bookings, Link, saved plans, and EPL participation.
              Operators, partners, venues, city office, and admins use internal access tied to role checks.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {[
                ["Guest / Member", "Tickets, bookings, saved events, reservations, Pulse, and account tools."],
                ["Curator", "Approved network operators managing EVNTSZN-led city nights."],
                ["Partner", "Independent operators running their own event businesses on EVNTSZN."],
                ["Venue", "Venue system access for reserve, intake, and nightlife operations."],
              ].map(([title, body]) => (
                <div key={title} className="rounded-[24px] border border-white/10 bg-black/25 p-5">
                  <div className="text-lg font-black text-white">{title}</div>
                  <p className="mt-3 text-sm leading-6 text-white/60">{body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <Link href={`/account/login?next=${memberNext}`} className="rounded-[32px] border border-white/10 bg-white text-black p-6 transition hover:opacity-95">
              <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-black/55">Member Lane</div>
              <div className="mt-3 text-3xl font-black tracking-tight">Sign in for tickets and bookings</div>
              <p className="mt-4 text-sm leading-6 text-black/70">
                The public account lane for guests, members, reserve bookings, Link, and league participation.
              </p>
            </Link>

            <Link href={`/account/register?next=${memberNext}`} className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 transition hover:border-white/20 hover:bg-white/[0.07]">
              <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#caa7ff]">New Member</div>
              <div className="mt-3 text-3xl font-black tracking-tight text-white">Create an EVNTSZN account</div>
              <p className="mt-4 text-sm leading-6 text-white/62">
                Start once, then move across discovery, tickets, bookings, and public platform services from one profile.
              </p>
            </Link>

            <Link href={`/admin-login?next=${internalNext}`} className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 transition hover:border-white/20 hover:bg-white/[0.07]">
              <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#caa7ff]">Internal Access</div>
              <div className="mt-3 text-3xl font-black tracking-tight text-white">Enter operator, venue, partner, or admin access</div>
              <p className="mt-4 text-sm leading-6 text-white/62">
                Use this lane if you operate a city, venue, team, or program surface. EVNTSZN routes the desk after verification.
              </p>
            </Link>
          </div>
        </div>
      </section>
    </PublicPageFrame>
  );
}
