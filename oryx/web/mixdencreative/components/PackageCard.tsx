type PackageCardProps = {
  name: string;
  price: string;
  deposit: string;
  balance: string;
  turnaround: string;
  bestFor: string;
  features: readonly string[];
  ctaLabel: string;
  featured?: boolean;
};

export function PackageCard({
  name,
  price,
  deposit,
  balance,
  turnaround,
  bestFor,
  features,
  ctaLabel,
  featured = false,
}: PackageCardProps) {
  return (
    <article
      className={`flex h-full flex-col rounded-[2rem] border p-6 shadow-[0_28px_90px_rgba(0,0,0,0.28)] transition hover:-translate-y-1 ${
        featured
          ? "border-[var(--color-accent)] bg-[linear-gradient(180deg,rgba(162,89,255,0.18),rgba(14,14,14,0.96))]"
          : "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(14,14,14,0.96))]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-white/46">
            Package
          </p>
          <h3 className="mt-2 text-2xl font-bold uppercase text-white">
            {name}
          </h3>
        </div>
        {featured ? (
          <span className="rounded-full bg-[var(--color-accent)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-black">
            Most Popular
          </span>
        ) : null}
      </div>

      <div className="mt-8 flex items-end gap-2">
        <span className="text-4xl font-bold text-white">{price}</span>
        <span className="pb-1 text-sm text-white/56">flat project fee</span>
      </div>

      <div className="mt-6 grid gap-3 text-sm text-white/72">
        <p>
          <span className="font-semibold text-white">Deposit:</span> {deposit}
        </p>
        <p>
          <span className="font-semibold text-white">Balance:</span> {balance}
        </p>
        <p>
          <span className="font-semibold text-white">Turnaround:</span>{" "}
          {turnaround}
        </p>
        <p>
          <span className="font-semibold text-white">Best for:</span> {bestFor}
        </p>
      </div>

      <ul className="mt-8 space-y-3 text-sm leading-6 text-white/72">
        {features.map((feature) => (
          <li key={feature} className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <a
        href="#booking"
        className="mt-8 inline-flex items-center justify-center rounded-full border border-transparent bg-white px-5 py-3 text-sm font-semibold text-black transition hover:border-white hover:bg-transparent hover:text-white"
      >
        {ctaLabel}
      </a>
    </article>
  );
}
