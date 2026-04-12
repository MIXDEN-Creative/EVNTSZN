import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PublicNav from "@/components/public/PublicNav";
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
    <main className="min-h-screen bg-black text-white">
      <PublicNav />
      <div className="mx-auto grid max-w-[1500px] gap-8 px-4 py-10 md:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:py-14">
        <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(162,89,255,0.22),transparent_38%),linear-gradient(180deg,#12111b_0%,#0a0a11_60%,#060609_100%)] p-8 shadow-[0_26px_70px_rgba(0,0,0,0.42)]">
          <div className="absolute inset-0 bg-[linear-gradient(125deg,rgba(255,255,255,0.05),transparent_20%),radial-gradient(circle_at_82%_0%,rgba(255,255,255,0.08),transparent_24%)] opacity-80" />
          <div className="relative">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link href={getWebOrigin()} className="inline-flex text-lg font-black tracking-tight text-white">
                EVNTSZN
              </Link>
              <div className="flex flex-wrap gap-3">
                <Link href={getWebOrigin()} className="rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm font-semibold text-white/84 transition hover:bg-white/10">
                  Public homepage
                </Link>
                <a
                  href={`${getAppOrigin()}/admin-login?next=${encodeURIComponent(nextValue)}`}
                  className="rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm font-semibold text-white/84 transition hover:bg-white/10"
                >
                  Internal staff access
                </a>
              </div>
            </div>
            <div className="inline-flex rounded-full border border-white/15 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/90">
              Attendee Account
            </div>

            <h1 className="mt-5 max-w-xl text-5xl font-black leading-[0.95] tracking-[-0.05em] text-white">
              Pick up your EVNTSZN night without losing your place.
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-white/78">
              Use this account for tickets, saved events, orders, and checkout history. Internal staff tools stay on their own protected sign-in, so member access stays clean and attendee-facing.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={getWebOrigin()}
                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90"
              >
                Back to EVNTSZN
              </Link>

              <a
                href="https://epl.evntszn.com"
                className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Explore EPL
              </a>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                ["Tickets and orders", "Keep one account for purchase history, confirmations, and event access."],
                ["League access", "Use the same member account for EPL registration follow-up, league updates, and season notices."],
                ["Protected staff tools stay separate", "If you work in ops, scanner, admin, or HQ, use the internal sign-in instead of the attendee flow."],
              ].map(([label, body]) => (
                <div key={label} className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                  <div className="text-sm font-semibold text-white">{label}</div>
                  <p className="mt-2 text-sm leading-6 text-white/65">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-[#0c0c15] p-6 md:p-8 lg:p-10">
          <div className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-[#b899ff]">
            Sign In
          </div>

          <h2 className="text-3xl font-black tracking-tight text-white">Attendee sign in</h2>

          <p className="mt-3 text-sm leading-6 text-white/70">
            Use the same email you use for tickets, saved events, and order history.
          </p>

          <div className="mt-6">
            <CustomerLoginForm next={nextValue} />
          </div>

        </section>
      </div>
    </main>
  );
}
