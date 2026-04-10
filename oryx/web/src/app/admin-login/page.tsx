import Link from "next/link";
import type { Metadata } from "next";
import FounderLoginForm from "@/app/account/login/FounderLoginForm";
import InternalAccessForm from "./InternalAccessForm";
import { getAppOrigin, getSurfaceForPath, getWebOrigin, normalizeNextPath } from "@/lib/domains";

export const metadata: Metadata = {
  title: "Internal Access | EVNTSZN",
  description: "Secure internal access for EVNTSZN HQ, admin, ops, scanner, and office users.",
  alternates: {
    canonical: `${getAppOrigin()}/admin-login`,
  },
  openGraph: {
    title: "EVNTSZN Internal Access",
    description: "Secure internal access for EVNTSZN HQ, admin, ops, scanner, and office users.",
    url: `${getAppOrigin()}/admin-login`,
    siteName: "EVNTSZN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EVNTSZN Internal Access",
    description: "Secure internal access for EVNTSZN HQ, admin, ops, scanner, and office users.",
  },
};

type AdminLoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = await searchParams;
  const requestedNext = normalizeNextPath(params?.next || "/epl/admin");
  const nextSurface = getSurfaceForPath(requestedNext);
  const next = ["admin", "hq", "ops", "scanner"].includes(nextSurface) ? requestedNext : "/epl/admin";

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-8 px-4 py-10 md:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#0c0c15] p-8">
          <Link href={getWebOrigin()} className="relative z-10 inline-flex text-lg font-black tracking-tight text-white">
            EVNTSZN
          </Link>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(162,89,255,0.22),transparent_35%),linear-gradient(180deg,#09090c_0%,#050507_100%)]" />
          <div className="relative">
            <div className="inline-flex rounded-full border border-white/15 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/90">
              Internal access
            </div>
            <h1 className="mt-5 max-w-xl text-5xl font-black leading-[0.95] tracking-[-0.05em] text-white">
              Enter EVNTSZN internal tools with the right role, not a casual member link.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/78">
              HQ, admin, ops, scanner, and office surfaces stay behind invite-based internal access and role checks. Use the invited email for staff access or founder credentials for override.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={getWebOrigin()} className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90">
                Back to EVNTSZN
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-6 rounded-[32px] border border-white/10 bg-[#0c0c15] p-6 md:p-8">
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#b899ff]">Secure access</div>
            <h2 className="text-3xl font-black tracking-tight text-white">Internal sign-in</h2>
            <p className="mt-3 text-sm leading-6 text-white/70">
              Start here for staff-only surfaces. Member login stays on the account page, internal recovery stays on this access path, and scanner/admin tools never open from casual attendee login.
            </p>
          </div>

          <InternalAccessForm next={next} />
          <FounderLoginForm next={next} />
        </section>
      </div>
    </main>
  );
}
