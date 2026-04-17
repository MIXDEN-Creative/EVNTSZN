import Link from "next/link";
import PublicPageFrame from "@/components/public/PublicPageFrame";
import ReserveIntakeForm from "@/components/public/ReserveIntakeForm";

const RESERVE_PLANS = [
  {
    title: "Venue Listing",
    price: "$0",
    cadence: "/month",
    note: "Discovery presence only",
    cta: { href: "/venue-program", label: "List your venue" },
    points: ["Venue listing and city visibility", "Works with venue agreement routing", "No reservation workflow"],
  },
  {
    title: "Venue Pro",
    price: "$39",
    cadence: "/month",
    note: "Operations layer",
    cta: { href: "/venue-program", label: "Start Venue Pro" },
    points: ["Venue operating suite", "Smart Fill and messaging included", "Reserve can be added when the venue is ready"],
  },
  {
    title: "Venue Pro + Reserve",
    price: "$99",
    cadence: "/month + $0.30 / reservation",
    note: "Best fit for nightlife venues",
    cta: { href: "#reserve-intake", label: "Route Reserve" },
    points: ["Reserve slot control and waitlist ops", "Venue dashboard and booking oversight", "Live routing into the Reserve desk"],
  },
  {
    title: "Reserve Standalone",
    price: "$79",
    cadence: "/month + $0.50 / reservation",
    note: "For dedicated booking operations",
    cta: { href: "#reserve-intake", label: "Launch standalone" },
    points: ["Reservation flow without Venue Pro", "Capacity, waitlist, and guest routing", "Best fit for event-only booking operations"],
  },
];

export default function ReservePage() {
  return (
    <PublicPageFrame
      title="EVNTSZN Reserve"
      description="Dining reservations, nightlife tables, waitlist control, and guest routing for venues that need a real reservation engine."
      heroImage="https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1800&q=80"
      seo={{
        title: "EVNTSZN Reserve | Booking, Waitlist, and Table Flow",
        description: "Reserve is the EVNTSZN booking layer for dining and nightlife venues, guest flow, table routing, and launch-ready reservation operations.",
      }}
    >
      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="ev-panel p-8 md:p-10">
            <div className="ev-section-kicker">Reserve operating layer</div>
            <h1 className="mt-3 text-5xl font-black tracking-tight text-white md:text-6xl">Bookings, waitlist, and table control for nightlife.</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/68">
              Reserve is built for venues that need real guest flow, not a static listing. Control dining reservations, nightlife table inventory, waitlist pressure, and launch routing from one native EVNTSZN system.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#caa7ff]">Fill control</div>
                <div className="mt-3 text-sm text-white/65">Live slot limits, waitlist pressure, and guest pacing.</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#caa7ff]">Dining ready</div>
                <div className="mt-3 text-sm text-white/65">Full dining reservation flow and pre-service guest pacing on the same stack.</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#caa7ff]">Venue routing</div>
                <div className="mt-3 text-sm text-white/65">Works cleanly with venue onboarding, agreements, and host operations.</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#caa7ff]">Internal desk</div>
                <div className="mt-3 text-sm text-white/65">Every Reserve intake lands in the Reserve desk for assignment and approval.</div>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="#reserve-plans" className="ev-button-primary px-8">View pricing</Link>
              <Link href="#reserve-intake" className="ev-button-secondary px-8">Send to Reserve desk</Link>
              <Link href="/account/reserve" className="ev-button-secondary px-8">Open Reserve dashboard</Link>
            </div>
          </div>

          <div className="grid gap-4">
            {[
              "Free listing for discovery only",
              "Venue Pro for operating tools without reservations",
              "Venue Pro + Reserve for full booking control",
              "Standalone Reserve for dedicated booking businesses",
            ].map((line) => (
              <div key={line} className="rounded-[28px] border border-white/10 bg-black/30 p-6 text-lg font-semibold text-white">
                {line}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="reserve-plans" className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:px-8">
        <div className="ev-section-kicker">Reserve pricing</div>
        <h2 className="mt-3 text-4xl font-black tracking-tight text-white">Choose the booking lane that matches the venue.</h2>
        <div className="mt-8 grid gap-6 lg:grid-cols-4">
          {RESERVE_PLANS.map((plan) => (
            <div key={plan.title} className="rounded-[32px] border border-white/10 bg-black/30 p-6">
              <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#caa7ff]">{plan.note}</div>
              <div className="mt-3 text-3xl font-black text-white">{plan.title}</div>
              <div className="mt-6 text-4xl font-black text-white">{plan.price}</div>
              <div className="mt-1 text-sm text-white/45">{plan.cadence}</div>
              <div className="mt-6 space-y-3 text-sm text-white/68">
                {plan.points.map((point) => (
                  <div key={point} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">{point}</div>
                ))}
              </div>
              <Link href={plan.cta.href} className="ev-button-primary mt-6 w-full justify-center">
                {plan.cta.label}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section id="reserve-intake" className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
          <div className="ev-panel p-6 md:p-8">
            <div className="ev-section-kicker">Routing</div>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-white">Launch Reserve with one routed intake.</h2>
            <p className="mt-4 text-sm leading-6 text-white/65">
              The Reserve desk receives the plan, venue, market, and weekly volume so founder or HQ can assign the launch, route approvals, and move implementation without a dead end.
            </p>
            <div className="mt-6 space-y-3 text-sm text-white/70">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">Reserve launch requests are tracked as live work items.</div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">Venue and agreement follow-up can move directly into the correct desk without re-entry.</div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">If the venue is not yet cleared, start with the <Link href="/venue/agreement" className="text-white underline">venue agreement flow</Link>.</div>
            </div>
          </div>

          <ReserveIntakeForm />
        </div>
      </section>
    </PublicPageFrame>
  );
}
