const depositExamples = [
  "Foundation Build: $250 deposit",
  "Creator System Build: $750 deposit",
  "Done-For-You Build: $1,500 deposit",
];

export function DepositInfo() {
  return (
    <section id="deposit" className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto grid max-w-7xl gap-8 rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(162,89,255,0.18),rgba(245,245,245,0.03),rgba(0,0,0,0.92))] p-6 sm:p-8 lg:grid-cols-[0.9fr_1.1fr] lg:p-10">
        <div>
          <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-accent)]">
            Deposit Policy
          </p>
          <h2 className="mt-4 text-3xl font-bold uppercase leading-tight text-white sm:text-4xl">
            50% Deposit Required to Begin
          </h2>
        </div>
        <div className="space-y-6">
          <p className="max-w-2xl text-base leading-7 text-white/72">
            All MIXDEN Creative projects require a 50% deposit to reserve your
            project slot. The remaining 50% balance is due before final files,
            links, and assets are delivered.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {depositExamples.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-black/50 p-4 text-sm font-medium text-white/82"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
