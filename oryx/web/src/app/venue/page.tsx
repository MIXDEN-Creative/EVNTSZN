import Link from "next/link";
import { getPlatformViewer } from "@/lib/evntszn";
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";

export default async function VenuePublicPage() {
  const viewer = await getPlatformViewer();
  const isLoggedIn = !!viewer.user;

  return (
    <main className="min-h-screen bg-black text-white">
      <PublicNav />
      <section className="relative h-[60vh] min-h-[500px] overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1514525253361-bee243870eb2?auto=format&fit=crop&w=2000&q=80"
            alt="Venue Management"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        </div>
        <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-16 md:px-6 lg:px-8">
          <div className="ev-kicker text-[#b899ff]">Venue Operating Suite</div>
          <h1 className="mt-4 text-5xl font-black tracking-tight md:text-7xl lg:text-8xl leading-[0.9]">
            Run the gate.
          </h1>
          <p className="mt-8 max-w-2xl text-lg md:text-xl leading-relaxed text-white/80">
            Professional tools for venue owners to manage scanner access, real-time occupancy, and event-day execution across the EVNTSZN network.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href={isLoggedIn ? "/venue/dashboard" : "/account/login?next=/venue/dashboard"} className="ev-button-primary px-10 py-4">
              Enter Venue Dashboard
            </Link>
            <Link href="#plans" className="ev-button-secondary px-10 py-4">
              View Plans
            </Link>
          </div>
        </div>
      </section>

      <section id="plans" className="mx-auto max-w-7xl px-4 py-24 md:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="rounded-[48px] border border-white/10 bg-[#0c0c15] p-10 md:p-14">
            <div className="text-xs font-bold uppercase tracking-[0.24em] text-[#A259FF]">Standard</div>
            <h2 className="mt-6 text-4xl font-black text-white md:text-5xl">EVNTSZN Venue</h2>
            <p className="mt-6 text-lg text-white/60">Professional listing and discovery for your venue across the EVNTSZN network.</p>
            <ul className="mt-10 space-y-4 text-white/75">
              <li className="flex items-center gap-3">✓ Public venue profile</li>
              <li className="flex items-center gap-3">✓ Live pulse score</li>
              <li className="flex items-center gap-3">✓ Event visibility</li>
              <li className="flex items-center gap-3">✓ Listing analytics</li>
            </ul>
            <div className="mt-12 text-3xl font-black">$0 / mo</div>
          </div>

          <div className="rounded-[48px] border border-[#A259FF]/30 bg-white/[0.03] p-10 md:p-14">
            <div className="text-xs font-bold uppercase tracking-[0.24em] text-[#caa7ff]">Professional</div>
            <h2 className="mt-6 text-4xl font-black text-white md:text-5xl">Venue Pro</h2>
            <p className="mt-6 text-lg text-white/60">Complete operating system for front-gate control and nightlife management.</p>
            <ul className="mt-10 space-y-4 text-white/75">
              <li className="flex items-center gap-3">✓ Mobile scanner access</li>
              <li className="flex items-center gap-3">✓ Real-time occupancy tracking</li>
              <li className="flex items-center gap-3">✓ Staffing assignments</li>
              <li className="flex items-center gap-3">✓ Optional Reserve integration</li>
            </ul>
            <div className="mt-12 text-3xl font-black">$39.00 / mo</div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6 lg:px-8">
        <div className="rounded-[48px] border border-white/10 bg-white/[0.02] p-10 md:p-16 text-center">
          <h2 className="text-4xl font-black tracking-tight text-white md:text-6xl">Ready to activate?</h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/70">
            Apply as a venue partner to claim your profile and start managing your gate with EVNTSZN.
          </p>
          <div className="mt-10 flex justify-center">
            <Link href="/venue/agreement" className="ev-button-primary px-12 py-4 text-lg">Activate Venue</Link>
          </div>
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
