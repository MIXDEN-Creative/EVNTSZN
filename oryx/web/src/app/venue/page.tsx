import Link from "next/link";
import { getPlatformViewer } from "@/lib/evntszn";
import { getReserveOrigin } from "@/lib/domains";
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";

export default async function VenuePublicPage() {
  const viewer = await getPlatformViewer();
  const isLoggedIn = !!viewer.user;

  return (
    <main className="min-h-screen bg-black text-white">
      <PublicNav />
      <section className="relative min-h-[520px] overflow-hidden border-b border-white/10 pt-[var(--public-page-top-space)]">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1514525253361-bee243870eb2?auto=format&fit=crop&w=2000&q=80"
            alt="Venue Management"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        </div>
        <div className="relative mx-auto grid min-h-[520px] max-w-7xl gap-8 px-4 pb-16 pt-12 md:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pb-20">
          <div className="flex flex-col justify-end">
            <div className="ev-kicker text-[#b899ff]">Venue growth + reserve</div>
            <h1 className="mt-4 text-5xl font-black tracking-tight md:text-7xl lg:text-8xl leading-[0.9]">
              Run nightlife demand, venue visibility, and reservation flow without splitting the stack.
            </h1>
            <p className="mt-8 max-w-2xl text-lg md:text-xl leading-relaxed text-white/80">
              EVNTSZN Venue is the public and operational lane for venue groups that need discovery, demand routing, and Reserve-ready intake in one composed system.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/venue/agreement?intent=venue-onboarding" className="ev-button-primary px-8">
                Start venue intake
              </Link>
              <Link href={isLoggedIn ? "/venue/dashboard" : "/account/login?next=/venue/dashboard"} className="ev-button-secondary px-8">
                Enter Venue Dashboard
              </Link>
              <Link href={`${getReserveOrigin()}/`} className="ev-button-secondary px-8">
                Explore Reserve
              </Link>
            </div>
          </div>

          <div className="grid content-end gap-4 lg:pb-4">
            {[
              ["Venue intake", "Public venue interest routes into the internal desk workflow instead of stopping at a marketing CTA."],
              ["Reserve expansion", "Reservation and waitlist demand can move into Reserve with venue-aware intake and follow-through."],
              ["Discovery weight", "Venue presence, event visibility, and city-facing nightlife demand stay tied together."],
            ].map(([title, body]) => (
              <div key={title} className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02)),rgba(5,5,8,0.6)] p-5 backdrop-blur-xl">
                <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#d5b8ff]">{title}</div>
                <p className="mt-3 text-sm leading-6 text-white/68">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="plans" className="mx-auto max-w-7xl px-4 py-24 md:px-6 lg:px-8">
        <div className="grid gap-10 xl:grid-cols-3">
          <div className="rounded-[48px] border border-white/10 bg-[#0c0c15] p-10 md:p-14">
            <div className="text-xs font-bold uppercase tracking-[0.24em] text-[#A259FF]">Standard</div>
            <h2 className="mt-6 text-4xl font-black text-white md:text-5xl">EVNTSZN Venue</h2>
            <p className="mt-6 text-lg text-white/60">Free venue listing with public profile, pulse, and event visibility.</p>
            <ul className="mt-10 space-y-4 text-white/75">
              <li className="flex items-center gap-3">✓ Public venue profile</li>
              <li className="flex items-center gap-3">✓ Live pulse score</li>
              <li className="flex items-center gap-3">✓ Event visibility</li>
              <li className="flex items-center gap-3">✓ Smart Fill add-on available for $29/month</li>
            </ul>
            <div className="mt-12 text-3xl font-black">$0 / mo</div>
          </div>

          <div className="rounded-[48px] border border-[#A259FF]/30 bg-white/[0.03] p-10 md:p-14">
            <div className="text-xs font-bold uppercase tracking-[0.24em] text-[#caa7ff]">Professional</div>
            <h2 className="mt-6 text-4xl font-black text-white md:text-5xl">Venue Pro</h2>
            <p className="mt-6 text-lg text-white/60">Operational layer with Smart Fill, Nodes, messaging, and Pulse built in.</p>
            <ul className="mt-10 space-y-4 text-white/75">
              <li className="flex items-center gap-3">✓ Smart Fill included</li>
              <li className="flex items-center gap-3">✓ Nodes included</li>
              <li className="flex items-center gap-3">✓ NFC cards, messaging, event requests, photos, private calendar, and Link Pro included</li>
              <li className="flex items-center gap-3">✓ Reserve available on the Pro with Reserve plan</li>
            </ul>
            <div className="mt-12 text-3xl font-black">$39.00 / mo</div>
          </div>

          <div className="rounded-[48px] border border-white/10 bg-[#120c19] p-10 md:p-14">
            <div className="text-xs font-bold uppercase tracking-[0.24em] text-[#caa7ff]">Reserve enabled</div>
            <h2 className="mt-6 text-4xl font-black text-white md:text-5xl">Venue Pro + Reserve</h2>
            <p className="mt-6 text-lg text-white/60">Everything in Venue Pro plus EVNTSZN Reserve for nightlife reservations and waitlist control.</p>
            <ul className="mt-10 space-y-4 text-white/75">
              <li className="flex items-center gap-3">✓ Reservations, waitlist system, time slots, and capacity control</li>
              <li className="flex items-center gap-3">✓ Venue-aware booking and monthly booking dashboard</li>
              <li className="flex items-center gap-3">✓ Revenue tracking for EVNTSZN Reserve performance</li>
              <li className="flex items-center gap-3">✓ Includes everything in Venue Pro</li>
            </ul>
            <div className="mt-12 text-3xl font-black">$99.00 / mo + $0.30 / reservation</div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6 lg:px-8">
        <div className="mb-8 rounded-[32px] border border-white/10 bg-white/[0.03] p-6 text-white/72">
          Reserve standalone stays separate from Venue Pro. It is $39/month when venue capacity is under 150, $79/month at capacity 150+, and $0.50 per reservation.
        </div>
        <div className="rounded-[48px] border border-white/10 bg-white/[0.02] p-10 md:p-16 text-center">
          <h2 className="text-4xl font-black tracking-tight text-white md:text-6xl">Ready to activate?</h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/70">
            Claim your venue profile, activate Pro when needed, or launch EVNTSZN Reserve for nightlife reservations and waitlists.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/venue/agreement?intent=tier-request" className="ev-button-primary px-10">Activate Venue</Link>
            <Link href={`${getReserveOrigin()}/`} className="ev-button-secondary px-10">Reserve workflow</Link>
          </div>
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
