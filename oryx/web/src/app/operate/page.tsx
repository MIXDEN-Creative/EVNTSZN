import Link from "next/link";
import PublicPageFrame from "@/components/public/PublicPageFrame";

const OPERATE_LANES = [
  {
    label: "Curator Network",
    href: "/hosts",
    cta: "/admin-login?next=/ops",
    title: "Operate premium EVNTSZN-led nights.",
    body: "For approved network operators managing city-facing rooms, event cadence, and nightlife quality inside the EVNTSZN standard.",
  },
  {
    label: "Partner Workspace",
    href: "/organizer",
    cta: "/admin-login?next=/organizer",
    title: "Run your own event business on EVNTSZN.",
    body: "For self-directed operators using EVNTSZN for ticketing, discovery, audience conversion, and production workflows.",
  },
  {
    label: "Venue System",
    href: "/venue",
    cta: "/admin-login?next=/venue",
    title: "Activate venue growth, reserve, and intake.",
    body: "For venue teams managing reserve availability, event-linked demand, nightlife operations, and platform onboarding.",
  },
  {
    label: "League + City Ops",
    href: "/epl",
    cta: "/admin-login?next=/city-office",
    title: "Manage league, city, and internal operating desks.",
    body: "For EPL operations, city office workflows, operator assignments, support desks, and internal queues.",
  },
];

export default function OperatePage() {
  return (
    <PublicPageFrame
      title="Operate the city-facing system without losing clarity."
      description="EVNTSZN separates guest-facing discovery from the operational lanes that run nights, bookings, teams, venues, and city movement."
      heroImage="https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1800&q=80"
    >
      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {OPERATE_LANES.map((lane) => (
            <article key={lane.label} className="rounded-[34px] border border-white/10 bg-[#0c0c15] p-7 md:p-8">
              <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#caa7ff]">{lane.label}</div>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-white">{lane.title}</h2>
              <p className="mt-4 text-sm leading-7 text-white/64">{lane.body}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={lane.href} className="ev-button-secondary">
                  Learn more
                </Link>
                <Link href={lane.cta} className="ev-button-primary">
                  Enter lane
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </PublicPageFrame>
  );
}
