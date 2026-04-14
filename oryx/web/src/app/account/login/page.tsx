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
      <div className="mx-auto max-w-2xl px-4 py-16 md:px-6 lg:py-24">
        <section className="rounded-[48px] border border-white/10 bg-[#0c0c15] p-10 md:p-16 shadow-[0_32px_80px_rgba(0,0,0,0.5)]">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#A259FF]">
            Sign In
          </div>

          <h1 className="mt-6 text-5xl font-black tracking-tight text-white leading-tight">
            Member sign in
          </h1>

          <p className="mt-6 text-lg text-white/60 leading-relaxed">
            Use the same email you use for tickets, saved events, and order history. 
            If you need staff or admin access, use the <a href={`${getAppOrigin()}/admin-login?next=${encodeURIComponent(nextValue)}`} className="text-white underline transition hover:text-[#caa7ff]">Internal Link</a>.
          </p>

          <div className="mt-12">
            <CustomerLoginForm next={nextValue} />
          </div>

          <div className="mt-12 pt-10 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
            <p className="text-sm text-white/40">
              New here? <Link href={`${getAppOrigin()}/account/register?next=${encodeURIComponent(nextValue)}`} className="text-white font-bold transition hover:text-[#caa7ff]">Create account</Link>
            </p>
            <Link href={getWebOrigin()} className="text-sm font-bold text-white/60 transition hover:text-white">
              Back to discovery
            </Link>
          </div>
        </section>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Tickets and orders", "Keep one account for purchase history, confirmations, and event access."],
            ["League access", "One member account for EPL registration, team updates, and season notices."],
            ["Secure staff tools", "HQ, ops, and admin desks stay separate for security and a cleaner attendee flow."],
          ].map(([label, body]) => (
            <div key={label} className="rounded-[32px] border border-white/5 bg-white/[0.02] p-8">
              <div className="text-sm font-bold text-white">{label}</div>
              <p className="mt-4 text-sm leading-6 text-white/50">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
