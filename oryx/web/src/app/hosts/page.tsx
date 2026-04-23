import type { Metadata } from "next";
import Link from 'next/link';
import PublicPageFrame from '@/components/public/PublicPageFrame';
import ProductTrustGrid from '@/components/public/ProductTrustGrid';
import SystemActivityRail from '@/components/public/SystemActivityRail';
import { buildCollectionPageSchema, buildPageMetadata } from '@/lib/seo';
import { getWebOrigin } from '@/lib/domains';
import { PUBLIC_CITIES, PUBLIC_HOST_MARKETS } from '@/lib/public-cities';

export const metadata: Metadata = buildPageMetadata({
  title: "EVNTSZN Curator Network | premium city nights and network operators",
  description:
    "Apply to the EVNTSZN Curator Network to operate premium city nights with deeper platform support, controlled access, and venue-linked tools.",
  path: "/hosts",
  origin: getWebOrigin(),
});

const HostsPage = () => {
  const hostMarketsWithState = PUBLIC_HOST_MARKETS.map(market => {
    const city = PUBLIC_CITIES.find((item) => item.name === market);
    const state = city?.stateCode || '';
    return { name: market, state };
  });

  return (
    <PublicPageFrame
      title="EVNTSZN Curators"
      description="Become an approved EVNTSZN Curator and operate premium city nights within the network."
      heroImage="https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=1800&q=80"
      structuredData={buildCollectionPageSchema({
        name: "EVNTSZN Curator Network",
        description:
          "Approved network operators running premium city nights inside EVNTSZN.",
        path: "/hosts",
      })}
    >
      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:px-8">
        <div className="ev-panel p-6">
          <div className="ev-section-kicker">Your next move</div>
          <div className="mt-3 text-2xl font-black tracking-tight text-white md:text-3xl">Operate as an EVNTSZN Curator</div>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/72">
            The EVNTSZN Curator path is for established operators, venue managers, and community leaders who want to run premium city nights within the EVNTSZN network. Curators operate inside the EVNTSZN structure with deeper platform support and controlled access.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/hosts/apply" className="ev-button-primary px-8">
              Apply as a Curator
            </Link>
            <Link href="/admin-login?next=/ops" className="ev-button-secondary px-8">
              Enter Curator Ops
            </Link>
          </div>
        </div>
      </section>

      <SystemActivityRail cityLabel="Baltimore" audienceLabel="curators" mode="compact" />

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:px-8">
        <div className="ev-panel p-6">
          <div className="ev-section-kicker">Open Curator Markets</div>
          <div className="mt-3 text-2xl font-black tracking-tight text-white">Current EVNTSZN Curator Openings</div>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/72">
            We are actively reviewing curators for Baltimore, Washington, Rehoboth Beach, Ocean City, and Bethany Beach. Approved curators work premium city nights and build toward deeper city-office responsibility.
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
          <div className="ev-section-kicker">Curator program value</div>
          <div className="mt-3 text-2xl font-black tracking-tight text-white">Why EVNTSZN Curator?</div>
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
                Progress through curator levels with increasing system control
                and revenue share. Build your market presence and become a key operator within the EVNTSZN network.
              </p>
            </div>
          </div>
        </div>
      </section>

      <ProductTrustGrid
        title="Curators are not generic hosts. They are approved network operators."
        subtitle="The Curator Network exists for operators who want deeper platform support, controlled access, and city-night responsibility inside EVNTSZN."
        proofTitle="Proof"
        proof={[
          { title: "Approved role", body: "Curators operate inside a controlled network instead of a loose marketplace." },
          { title: "City-night responsibility", body: "The lane is built for real nights, not just profile traffic." },
          { title: "Ecosystem support", body: "Curators sit closer to venue, reserve, and operator workflows than partners do." },
        ]}
        outcomesTitle="Outcomes"
        outcomes={[
          { title: "More authority", body: "The role is clear, premium, and easy to understand." },
          { title: "More leverage", body: "Approved curators get the support and routing layer needed to operate well." },
          { title: "More growth", body: "The network structure makes scale easier without turning the page into a generic signup." },
        ]}
        objectionsTitle="Objections"
        objections={[
          { question: "Is this the same as Partner?", answer: "No. Curators are approved operators inside the network; Partners are independent organizers." },
          { question: "Do I need a venue?", answer: "Not always, but the role is strongest when paired with venue and city responsibilities." },
          { question: "Is it available everywhere?", answer: "It is market-based and approval-driven, not open-ended." },
        ]}
        links={[
          { href: "/organizer", label: "See Partner Program" },
          { href: "/venue", label: "See Venue" },
          { href: "/venue-program", label: "See Venue Plans" },
        ]}
      />

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:px-8 text-center">
        <h2 className="text-4xl font-bold mb-8 text-white">Not an EVNTSZN Curator?</h2>
        <p className="text-lg text-white/70 max-w-3xl mx-auto mb-8">
          If you're organizing your own events, managing your brand, or building your audience independently, the Partner path might be for you.
        </p>
        <Link href="/organizer/apply" className="ev-button-primary px-8 py-3 text-lg">
          Learn about Partners
        </Link>
        <div className="mt-6 flex justify-center">
          <Link href="/curator" className="ev-button-secondary px-8 py-3 text-lg">
            Open Curator landing
          </Link>
        </div>
      </section>
    </PublicPageFrame>
  );
};

export default HostsPage;
