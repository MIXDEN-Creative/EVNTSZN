import Link from "next/link";
import InternalAccessForm from "./InternalAccessForm";

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen bg-[#07070b] text-white">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl gap-6 px-4 py-6 md:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <section className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,#7c3aed55,transparent_45%),linear-gradient(180deg,#181127_0%,#0b0b12_100%)] p-6 md:p-8 lg:p-10">
          <div className="mb-8">
            <div className="text-lg font-black tracking-tight">EVNTSZN</div>
          </div>

          <div className="mb-4 inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-white/80">
            Internal Access
          </div>

          <h1 className="max-w-xl text-4xl font-black leading-[0.95] tracking-tight md:text-5xl lg:text-6xl">
            Enter EVNTSZN operations with the right role, not an attendee login.
          </h1>

          <p className="mt-6 max-w-xl text-sm leading-7 text-white/70 md:text-base">
            HQ, admin, ops, scanner, and office tools stay behind invite-based
            internal access and role checks. Use the email that was invited into
            internal tools, or founder credentials for override.
          </p>

          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:scale-[0.99]"
            >
              Back to EVNTSZN
            </Link>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 md:p-8 lg:p-10">
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#c084fc]">
            Secure Access
          </div>

          <h2 className="text-3xl font-black tracking-tight md:text-4xl">
            Internal sign-in
          </h2>

          <p className="mt-4 max-w-xl text-sm leading-7 text-white/70 md:text-base">
            Start here for staff-only surfaces. Attendee accounts stay on the
            account page, internal recovery stays on this path, and
            scanner/admin tools never open from casual attendee sign-in.
          </p>

          <div className="mt-8 rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5 md:p-6">
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
              Invited Staff Access
            </div>

            <h3 className="text-2xl font-bold tracking-tight">
              Sign in with your invited internal email
            </h3>

            <p className="mt-3 text-sm leading-7 text-white/65">
              Admin, HQ, ops, scanner, and office access only open for invited
              accounts with active internal roles. This is a password sign-in
              for internal tools, not an attendee account flow.
            </p>

            <div className="mt-6">
              <InternalAccessForm />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
