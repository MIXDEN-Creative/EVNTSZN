import Link from "next/link";
import PublicPageFrame from "@/components/public/PublicPageFrame";

const SPONSOR_TIERS = [
  {
    title: "City Activation",
    price: "$1,500+",
    note: "Events + discovery",
    points: [
      "Event sponsorship packages",
      "City activation planning",
      "Premium placement in discovery and venue flows",
      "Sponsor inquiry routed into the EVNTSZN sponsor desk",
    ],
  },
  {
    title: "Pulse Visibility",
    price: "$2,500+",
    note: "Public energy layer",
    points: [
      "Pulse placement around live city movement",
      "Brand visibility inside public-safe feed surfaces",
      "Sponsored city moments tied to attendance intent",
      "Operational follow-through for sponsor delivery",
    ],
  },
  {
    title: "EPL Sponsor",
    price: "$2,500+",
    note: "League lane",
    points: [
      "League-night sponsorship",
      "Club and standings adjacency",
      "Game-night brand presence",
      "Supporter-facing sponsor activation planning",
    ],
  },
  {
    title: "Sponsor Premier",
    price: "$5,000+",
    note: "Cross-platform package",
    points: [
      "Guaranteed placement across Events, Pulse, Venues, and EPL",
      "Premium platform placement strategy",
      "Co-branded event and league activations",
      "Commercial planning support with sponsor desk ownership",
    ],
  },
];

export default function SponsorsPage() {
  return (
    <PublicPageFrame
      title="EVNTSZN Sponsors"
      description="Put your brand inside EVNTSZN events, venues, EPL, and Pulse with one clean sponsorship lane."
      heroImage="https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=1800&q=80"
      seo={{
        title: "EVNTSZN Sponsors | Brand visibility across nightlife, venues, and EPL",
        description: "Sponsor EVNTSZN events, venues, EPL, and Pulse with structured placements, analytics, and live activation lanes.",
      }}
    >
      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="ev-panel p-7 md:p-8">
            <div className="ev-section-kicker">Sponsor system</div>
            <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight text-white md:text-5xl">
              Brand visibility that lands inside the room, not beside it.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/68">
              Sponsors are brands and businesses paying for visibility. This lane now routes sponsor interest into a real sponsor desk workflow, while package checkout and sponsor records stay tied to the same operational thread.
            </p>
            <div className="mt-7 grid gap-3 md:grid-cols-3">
              {[
                ["Events", "Attach sponsor identity to high-traffic events and branded city moments."],
                ["Pulse", "Move from low-priority listing to guaranteed Pulse exposure as tiers scale."],
                ["EPL + venues", "Extend visibility into league nights, venue pages, and Reserve-aware surfaces."],
              ].map(([title, body]) => (
                <div key={title} className="rounded-[22px] border border-white/10 bg-black/30 p-3.5">
                  <div className="text-sm font-black text-white">{title}</div>
                  <div className="mt-2 text-sm leading-5 text-white/62">{body}</div>
                </div>
              ))}
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/sponsors/apply" className="ev-button-primary px-8">
                Become a Sponsor
              </Link>
              <Link href="/sponsors/packages" className="ev-button-primary px-8">
                Open sponsor packages
              </Link>
              <Link href="/enter" className="ev-button-secondary px-8">
                Enter EVNTSZN
              </Link>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(135deg,rgba(162,89,255,0.18),rgba(255,255,255,0.03))] p-5">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#e2d0ff]">Operationally real</div>
              <div className="mt-3 text-2xl font-black text-white">Sponsor interest now lands in the sponsor desk.</div>
              <p className="mt-3 text-sm leading-6 text-white/65">Growth and Sponsorships can work sponsor inquiries as queued internal items instead of relying on disconnected records.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1">
              {[
                "Featured placement",
                "Pulse sponsor boosts",
                "Citywide brand activations",
                "Reserve-aware venue visibility",
              ].map((item) => (
                <div key={item} className="rounded-[22px] border border-white/10 bg-black/30 px-5 py-4 text-base font-semibold text-white">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:px-8">
        <div className="ev-section-kicker">Sponsor pricing</div>
        <h2 className="mt-3 text-4xl font-black tracking-tight text-white">Choose the exposure lane that fits the brand.</h2>
        <div className="mt-8 grid gap-6 xl:grid-cols-4">
          {SPONSOR_TIERS.map((tier) => (
            <article key={tier.title} className="rounded-[28px] border border-white/10 bg-black/30 p-5">
              <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#caa7ff]">{tier.note}</div>
              <div className="mt-3 text-2xl font-black text-white">{tier.title}</div>
              <div className="mt-4 text-4xl font-black text-white">{tier.price}</div>
              <div className="mt-5 space-y-2.5 text-sm text-white/70">
                {tier.points.map((point) => (
                  <div key={point} className="rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-2.5">
                    {point}
                  </div>
                ))}
              </div>
              <Link href="/sponsors/packages" className="ev-button-primary mt-5 w-full justify-center">
                Request tier
              </Link>
              <Link href="/sponsors/apply" className="ev-button-secondary mt-3 w-full justify-center">
                Become a Sponsor
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 md:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-4">
          {[
            ["Events", "Sponsor headline events, room energy, and major attendance moments."],
            ["Pulse", "Appear inside public city movement without making the feed feel cluttered."],
            ["EPL", "Align with league nights, teams, and supporter attention."],
            ["Venue + Reserve", "Show up where premium dining and nightlife demand is already converting."],
          ].map(([title, body]) => (
            <div key={title} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#caa7ff]">{title}</div>
              <p className="mt-3 text-sm leading-6 text-white/64">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </PublicPageFrame>
  );
}
