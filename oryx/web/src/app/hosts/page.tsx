// src/app/hosts/page.tsx
'use client';

import Link from 'next/link';
import { getLoginUrl } from '@/lib/domains';
import PublicPageFrame from '@/components/public/PublicPageFrame';
import { PUBLIC_CITIES, PUBLIC_HOST_MARKETS } from '@/lib/public-cities';

const HostsPage = () => {
  const hostMarketsWithState = PUBLIC_HOST_MARKETS.map(market => {
    const city = PUBLIC_CITIES.find((item) => item.name === market);
    const state = city?.stateCode || '';
    return { name: market, state };
  });

  return (
    <PublicPageFrame
      title="EVNTSZN Host Program"
      description="Become an approved EVNTSZN Host and operate premium city nights within our network."
      heroImage="https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=1800&q=80"
      seo={{
        title: "EVNTSZN Host Program - Operate Premium City Nights",
        description: "Join the EVNTSZN Host Program to run exclusive nightlife experiences in Baltimore, Washington, Rehoboth Beach, Ocean City, and Bethany Beach.",
      }}
    >
      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:px-8">
        <div className="ev-panel p-6">
          <div className="ev-section-kicker">Your next move</div>
          <div className="mt-3 text-2xl font-black tracking-tight text-white md:text-3xl">
            Operate as an EVNTSZN Host
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/72">
            The EVNTSZN Host Program is for established operators, venue managers, and community leaders who want to run premium
            city nights within the EVNTSZN network. Hosts benefit from our commission structure, access to advanced tools,
            and a clear path to greater operational responsibility. This is distinct from an independent organizer path;
            hosts are integrated partners in the EVNTSZN ecosystem.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/hosts/apply" className="ev-button-primary px-8">
              Apply as a Host
            </Link>
            <Link href={getLoginUrl("/ops", "app.evntszn.com")} className="ev-button-secondary px-8">
              Enter Host Ops Portal
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:px-8">
        <div className="ev-panel p-6">
          <div className="ev-section-kicker">Open Host Markets</div>
          <div className="mt-3 text-2xl font-black tracking-tight text-white">Current EVNTSZN Host Openings</div>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/72">
            We are actively reviewing hosts for Baltimore, Washington, Rehoboth Beach, Ocean City, and Bethany Beach. Approved hosts work premium city nights, operate inside the live host commission structure, and build toward deeper city-office responsibility.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {hostMarketsWithState.map((market) => (
              <div key={market.name} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 text-center">
                <div className="text-2xl font-bold text-white">{market.name}</div>
                <div className="mt-1 text-sm font-semibold text-white/70">{market.state}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:px-8">
        <div className="ev-panel p-6">
          <div className="ev-section-kicker">Host Program Value</div>
          <div className="mt-3 text-2xl font-black tracking-tight text-white">Why EVNTSZN Host?</div>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-2xl font-semibold mb-3 text-white">Integrated Ecosystem</h3>
              <p className="text-sm leading-relaxed text-white/70">
                Gain access to EVNTSZN's full suite of tools, including Link Pro, Reserve, and Crew Marketplace integrations,
                all managed within a cohesive operational framework. Benefit from our established commission structure and
                priority placement for your events.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-3 text-white">Growth & Responsibility</h3>
              <p className="text-sm leading-relaxed text-white/70">
                Progress through Host levels (Host, Certified Host, Pro Host, City Leader) with increasing system control
                and revenue share. Build your market presence and become a key operator within the EVNTSZN network.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:px-8 text-center">
        <h2 className="text-4xl font-bold mb-8 text-white">Not an EVNTSZN Host?</h2>
        <p className="text-lg text-white/70 max-w-3xl mx-auto mb-8">
          If you're organizing your own events, managing your brand, or building your audience independently, the Independent Organizer path might be for you.
        </p>
        <Link href="/organizer/apply" className="ev-button-primary px-8 py-3 text-lg">
          Learn about Independent Organizers
        </Link>
      </section>
    </PublicPageFrame>
  );
};

export default HostsPage;
