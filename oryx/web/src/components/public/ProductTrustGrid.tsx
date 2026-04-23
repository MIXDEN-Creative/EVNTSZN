import Link from "next/link";

type TrustItem = {
  title: string;
  body: string;
};

type TrustQuestion = {
  question: string;
  answer: string;
};

export default function ProductTrustGrid({
  eyebrow = "Why EVNTSZN",
  title,
  subtitle,
  proofTitle = "Proof",
  proof,
  outcomesTitle = "Outcomes",
  outcomes,
  objectionsTitle = "Common objections",
  objections,
  links,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  proofTitle?: string;
  proof: TrustItem[];
  outcomesTitle?: string;
  outcomes: TrustItem[];
  objectionsTitle?: string;
  objections: TrustQuestion[];
  links?: Array<{ href: string; label: string }>;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:px-8">
      <div className="rounded-[36px] border border-white/10 bg-[#0b0b12] p-6 md:p-8">
        <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#caa7ff]">{eyebrow}</div>
        <h2 className="mt-3 max-w-4xl text-3xl font-black tracking-tight text-white md:text-4xl">{title}</h2>
        {subtitle ? <p className="mt-4 max-w-3xl text-sm leading-7 text-white/66">{subtitle}</p> : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#d8c1ff]">{proofTitle}</div>
            <div className="mt-4 space-y-3">
              {proof.map((item) => (
                <div key={item.title} className="rounded-[20px] border border-white/10 bg-black/25 px-4 py-3">
                  <div className="text-sm font-black text-white">{item.title}</div>
                  <div className="mt-2 text-sm leading-6 text-white/64">{item.body}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#d8c1ff]">{outcomesTitle}</div>
            <div className="mt-4 space-y-3">
              {outcomes.map((item) => (
                <div key={item.title} className="rounded-[20px] border border-white/10 bg-black/25 px-4 py-3">
                  <div className="text-sm font-black text-white">{item.title}</div>
                  <div className="mt-2 text-sm leading-6 text-white/64">{item.body}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#d8c1ff]">{objectionsTitle}</div>
            <div className="mt-4 space-y-3">
              {objections.map((item) => (
                <div key={item.question} className="rounded-[20px] border border-white/10 bg-black/25 px-4 py-3">
                  <div className="text-sm font-black text-white">{item.question}</div>
                  <div className="mt-2 text-sm leading-6 text-white/64">{item.answer}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {links?.length ? (
          <div className="mt-8 flex flex-wrap gap-3">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="ev-button-secondary">
                {link.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
