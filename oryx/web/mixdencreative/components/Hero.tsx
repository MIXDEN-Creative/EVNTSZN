import Image from "next/image";

export function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden px-4 pb-16 pt-12 sm:px-6 sm:pb-20 lg:px-8 lg:pb-28 lg:pt-20"
    >
      <div className="absolute inset-x-0 top-0 -z-10 mx-auto h-[32rem] max-w-5xl rounded-full bg-[radial-gradient(circle_at_top,rgba(162,89,255,0.38),transparent_62%)] blur-3xl" />
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div className="space-y-7">
          <div className="inline-flex rounded-full border border-white/12 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-accent)]">
            Premium Creative Builds
          </div>
          <div className="space-y-5">
            <h1 className="max-w-4xl text-4xl font-bold uppercase leading-none text-white sm:text-5xl lg:text-7xl">
              Done-For-You Creative Systems for Creators, Brands &
              Entrepreneurs
            </h1>
            <p className="max-w-2xl text-base leading-7 text-white/74 sm:text-lg">
              MIXDEN Creative helps you turn your ideas into polished brand
              assets, content systems, launch materials, and digital
              experiences without building everything from scratch.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="#booking"
              className="inline-flex items-center justify-center rounded-full bg-[var(--color-accent)] px-6 py-3 text-sm font-semibold text-black transition hover:-translate-y-0.5 hover:bg-white"
            >
              Book Your Creative Strategy Call
            </a>
            <a
              href="#packages"
              className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/4 px-6 py-3 text-sm font-semibold text-white transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
              View Packages
            </a>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 rounded-[2rem] bg-[linear-gradient(145deg,rgba(162,89,255,0.34),rgba(245,245,245,0.06),transparent)] blur-2xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(160deg,rgba(245,245,245,0.08),rgba(46,46,46,0.52))] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.45)]">
            <div className="rounded-[1.5rem] border border-white/10 bg-black/60 p-5">
              <Image
                src="/images/mixden-creative-logo.png"
                alt="MIXDEN Creative logo"
                width={620}
                height={620}
                className="h-auto w-full object-contain"
                priority
              />
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                  Turnaround
                </p>
                <p className="mt-2 text-lg font-semibold text-white">3-14 days</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                  Delivery
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  Clean systems
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                  Built For
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  Brands & creators
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
