import Link from "next/link";
import type { Metadata } from "next";
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";
import RegisterForm from "./RegisterForm";
import { getAppOrigin, getWebOrigin } from "@/lib/domains";

export const metadata: Metadata = {
  title: "Member Registration | EVNTSZN",
  description: "Create your EVNTSZN account for tickets, saved events, and attendee access.",
};

type RegisterPageProps = {
  searchParams?: Promise<{
    next?: string | string[];
  }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const nextValue = Array.isArray(resolvedSearchParams.next)
    ? resolvedSearchParams.next[0] ?? "/account"
    : resolvedSearchParams.next ?? "/account";

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
                <Link
                  href={`${getAppOrigin()}/account/login?next=${encodeURIComponent(nextValue)}`}
                  className="rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm font-semibold text-white/84 transition hover:bg-white/10"
                >
                  Member sign in
                </Link>
              </div>
            </div>
            <div className="inline-flex rounded-full border border-white/15 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/90">
              Attendee Account
            </div>

            <h1 className="mt-5 max-w-xl text-5xl font-black leading-[0.95] tracking-[-0.05em] text-white">
              One account for everything worth showing up for.
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-white/78">
              Keep your tickets, saved events, and league history in one clean path.
            </p>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                ["One identity", "Use the same member account for tickets, saved events, and league nights."],
                ["Fast checkout", "Keep your member identity consistent for faster purchases across all surfaces."],
                ["Internal staff separate", "Operators and internal staff use a separate operational sign-in path."],
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
            Register
          </div>

          <h2 className="text-3xl font-black tracking-tight text-white">Create member account</h2>

          <p className="mt-3 text-sm leading-6 text-white/70">
            Join EVNTSZN to manage your tickets and saved event activity.
          </p>

          <div className="mt-6">
            <RegisterForm next={nextValue} />
          </div>
        </section>
      </div>
      <PublicFooter />
    </main>
  );
}
