import Link from "next/link";
import CustomerLoginForm from "./CustomerLoginForm";

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

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-8 px-4 py-10 md:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#0c0c15] p-8">
          <img
            src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1600&q=80"
            alt="EVNTSZN member access"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(162,89,255,0.30),transparent_35%),linear-gradient(180deg,rgba(0,0,0,0.50),rgba(0,0,0,0.88))]" />
          <div className="relative">
            <div className="inline-flex rounded-full border border-white/15 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/90">
              Member Access
            </div>

            <h1 className="mt-5 max-w-xl text-5xl font-black leading-[0.95] tracking-[-0.05em] text-white">
              Get back into your EVNTSZN account without getting lost.
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-white/78">
              Tickets, rewards, orders, and member access should feel premium from the first screen. Scanner,
              operations, admin, and HQ still stay behind their own protected surfaces.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/"
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
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-[#0c0c15] p-6 md:p-8">
          <div className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-[#b899ff]">
            Sign In
          </div>

          <h2 className="text-3xl font-black tracking-tight text-white">Member login</h2>

          <p className="mt-3 text-sm leading-6 text-white/70">
            Use the same account you created for EVNTSZN member access, ticket activity, and saved event movement.
          </p>

          <div className="mt-6">
            <CustomerLoginForm next={nextValue} />
          </div>
        </section>
      </div>
    </main>
  );
}
