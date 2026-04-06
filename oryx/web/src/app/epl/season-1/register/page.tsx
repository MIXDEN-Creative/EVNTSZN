import RegisterForm from "./RegisterForm";

export default function EPLSeasonOneRegisterPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto max-w-5xl px-6 py-16 md:px-8">
        <div className="mb-10 overflow-hidden rounded-[36px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
          <p className="text-xs uppercase tracking-[0.28em] text-[#A259FF]">EVNTSZN Prime League</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Season 1 Player Registration
          </h1>
          <p className="mt-4 max-w-3xl text-base text-white/70 md:text-lg">
            Submit your registration, lock in your player profile, and move into the Season 1 pipeline.
            Clean process. Serious league.
          </p>
        </div>

        <div className="rounded-[36px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <RegisterForm />
        </div>
      </section>
    </main>
  );
}
