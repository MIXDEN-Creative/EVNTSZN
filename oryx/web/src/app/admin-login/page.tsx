// src/app/admin-login/page.tsx
import Link from "next/link";
import InternalAccessForm from "./InternalAccessForm";

type AdminLoginPageProps = {
  searchParams?: Promise<{
    next?: string | string[];
  }>;
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const nextValue = Array.isArray(resolvedSearchParams.next)
    ? resolvedSearchParams.next[0] ?? "/admin"
    : resolvedSearchParams.next ?? "/admin";

  return (
    <main className="min-h-screen bg-[#07070b] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-[500px]">
        <div className="mb-10 text-center">
          <Link href="/" className="inline-block">
            <span className="text-3xl font-black tracking-tighter text-white">EVNTSZN</span>
          </Link>
        </div>

        <section className="rounded-[40px] border border-white/10 bg-[#0c0c15] p-8 md:p-12 shadow-[0_32px_80px_rgba(0,0,0,0.5)]">
          <div className="mb-4 inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-[#caa7ff]">
            Internal Access
          </div>

          <h1 className="text-4xl font-black tracking-tight text-white leading-[0.95]">
            Secure operations sign-in.
          </h1>

          <p className="mt-6 text-sm leading-7 text-white/50">
            HQ, admin, ops, and scanner tools stay behind role-based internal access. 
            Use the email invited into operations, or founder credentials for override.
          </p>

          <div className="mt-10">
            <InternalAccessForm next={nextValue} />
          </div>

          <div className="mt-10 pt-8 border-t border-white/5 text-center">
            <Link
              href="/"
              className="text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white transition-all"
            >
              ← Back to public site
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
