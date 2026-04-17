import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PublicPageFrame from "@/components/public/PublicPageFrame";
import CustomerLoginForm from "./CustomerLoginForm";
import { getAppOrigin, getSurfaceForPath, getWebOrigin } from "@/lib/domains";

export const metadata: Metadata = {
  title: "Member Login | EVNTSZN",
  description: "Sign in to EVNTSZN for tickets, saved events, orders, and attendee account access.",
  alternates: {
    canonical: `${getAppOrigin()}/account/login`,
  },
  openGraph: {
    title: "EVNTSZN Member Login",
    description: "Sign in for EVNTSZN tickets, saved events, orders, and attendee account access.",
    url: `${getAppOrigin()}/account/login`,
    siteName: "EVNTSZN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EVNTSZN Member Login",
    description: "Sign in for EVNTSZN tickets, saved events, orders, and attendee account access.",
  },
};

type LoginPageProps = {
  searchParams?: Promise<{
    next?: string | string[];
  }>;
};

export default async function AccountLoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const nextValue = Array.isArray(resolvedSearchParams.next)
    ? resolvedSearchParams.next[0] ?? "/account"
    : resolvedSearchParams.next ?? "/account";
  const nextSurface = getSurfaceForPath(nextValue);

  if (["admin", "hq", "ops", "scanner"].includes(nextSurface)) {
    redirect(`${getAppOrigin()}/admin-login?next=${encodeURIComponent(nextValue)}`);
  }

  return (
    <PublicPageFrame
      title="Choose the right EVNTSZN entry point."
      description="Member sign-in is for tickets, bookings, Link, Pulse, and league access. Internal operations stay on a separate protected lane for Curators, Partners, Sponsors, venue teams, scanner staff, city office, and HQ."
    >
      <section className="ev-public-section py-8 md:py-10">
        <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[40px] border border-white/10 bg-[#0c0c15] p-8 shadow-[0_32px_80px_rgba(0,0,0,0.5)] md:p-10">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#A259FF]">Member Lane</div>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-white md:text-5xl">Sign in to your EVNTSZN account.</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/65">
              Use the same email you use for tickets, saved events, reservations, crew requests, Link, and EPL registration.
              If you were invited into an operations desk, do not use this form.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[
                ["Tickets and orders", "Keep purchase history, confirmations, and event access in one account."],
                ["Reserve and Link", "Manage reservations, conversion links, and visitor-facing activity without mixing ops access."],
                ["League access", "Use one member account for EPL registration, updates, and season notices."],
              ].map(([label, body]) => (
                <div key={label} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                  <div className="text-sm font-bold text-white">{label}</div>
                  <p className="mt-3 text-sm leading-6 text-white/55">{body}</p>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <CustomerLoginForm next={nextValue} />
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[36px] border border-white/10 bg-white/[0.03] p-7">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">Need Operations Access?</div>
              <h2 className="mt-3 text-2xl font-black text-white">Use the internal sign-in lane.</h2>
              <p className="mt-3 text-sm leading-6 text-white/60">
                Curator, Partner, Sponsor, venue, scanner, city office, ops, and HQ desks stay behind role-based internal access.
              </p>
              <Link
                href={`${getAppOrigin()}/admin-login?next=${encodeURIComponent(nextValue)}`}
                className="mt-6 inline-flex w-full items-center justify-center rounded-full border border-white/15 bg-white px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-black transition hover:opacity-95"
              >
                Go to internal sign-in
              </Link>
            </section>

            <section className="rounded-[36px] border border-white/10 bg-white/[0.03] p-7">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">Next destination</div>
              <div className="mt-3 text-2xl font-black text-white">{nextValue}</div>
              <p className="mt-3 text-sm leading-6 text-white/60">
                After sign-in, EVNTSZN will return you to the requested page when that route belongs to the member lane.
              </p>
            </section>

            <section className="rounded-[36px] border border-white/10 bg-white/[0.03] p-7">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">New here?</div>
              <p className="mt-3 text-sm leading-6 text-white/60">
                Create a member account for purchases, registrations, reservations, and saved activity.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <Link
                  href={`${getAppOrigin()}/account/register?next=${encodeURIComponent(nextValue)}`}
                  className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  Create member account
                </Link>
                <Link href={getWebOrigin()} className="text-center text-sm font-bold text-white/60 transition hover:text-white">
                  Back to discovery
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </section>
    </PublicPageFrame>
  );
}
