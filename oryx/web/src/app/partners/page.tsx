// src/app/partners/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import PublicPageFrame from '@/components/public/PublicPageFrame';
import Image from 'next/image'; // Assuming image for icons or partner logos

const PartnerProgramPage = () => {
  return (
    <PublicPageFrame
      title="EVNTSZN Partner Program"
      description="Collaborate with EVNTSZN and grow your brand's reach."
      heroImage="/public/hero-partners.jpg" // Placeholder
      seo={{
        title: "EVNTSZN Partner Program | Grow Your Brand",
        description: "Explore partnership opportunities with EVNTSZN. Increase visibility, sponsor events, and integrate with our ecosystem.",
      }}
    >
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0">
          <Image
            src="/public/hero-partners-background.jpg" // Placeholder background
            alt="Partner program background"
            layout="fill"
            objectFit="cover"
            className="opacity-30"
          />
        </div>
        <div className="mx-auto max-w-7xl px-4 py-20 md:px-6 lg:px-8 relative">
          <h1 className="text-5xl font-bold mb-4 text-white text-center max-w-4xl mx-auto">
            Grow Together: Partner with EVNTSZN
          </h1>
          <p className="text-xl text-gray-300 text-center max-w-3xl mx-auto mt-6">
            Join EVNTSZN as a partner and unlock new levels of visibility, engagement, and growth for your brand.
          </p>
          <div className="mt-12 flex justify-center">
            <Link href="#partner-plans" className="ev-button-primary px-8 py-3 text-lg">
              Explore Partnership Tiers
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 lg:px-8">
        <h2 className="text-4xl font-bold text-center mb-12 text-white">Partnership Tiers</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Partner Free */}
          <div className="ev-panel p-6 rounded-2xl border border-white/10 shadow-xl backdrop-blur-xl">
            <h3 className="text-2xl font-bold mb-2 text-white">Partner</h3>
            <p className="text-gray-400 mb-6 text-sm">Basic visibility and listing.</p>
            <div className="mb-6">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-gray-400">/month</span>
            </div>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-center text-sm">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 4.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 10.586l6.293-6.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                Partner profile page
              </li>
              <li className="flex items-center text-sm">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 4.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 10.586l6.293-6.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                Low priority logo placement
              </li>
              <li className="flex items-center text-sm">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 4.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 10.586l6.293-6.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                Tag in events & EPL games
              </li>
              <li className="flex items-center text-sm">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                No guaranteed placement
              </li>
            </ul>
          </div>

          {/* Partner Pro */}
          <div className="ev-panel p-6 rounded-2xl border border-purple-500 shadow-xl backdrop-blur-xl relative">
            <div className="absolute top-0 right-0 bg-purple-500 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">PRO</div>
            <h3 className="text-2xl font-bold mb-2 text-white">Partner Pro</h3>
            <p className="text-gray-400 mb-6 text-sm">Priority listing & limited feed mentions.</p>
            <div className="mb-6">
              <span className="text-4xl font-bold">$99</span>
              <span className="text-gray-400">/month</span>
            </div>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-center text-sm"><svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 4.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 10.586l6.293-6.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>All Partner features</li>
              <li className="flex items-center text-sm"><svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 4.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 10.586l6.293-6.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>Priority listing</li>
              <li className="flex items-center text-sm"><svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 4.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 10.586l6.293-6.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>Featured partner badge</li>
              <li className="flex items-center text-sm"><svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 4.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 10.586l6.293-6.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>Limited Pulse Feed mentions</li>
              <li className="flex items-center text-sm"><svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>No EPL integration</li>
            </ul>
          </div>

          {/* Partner Elite */}
          <div className="ev-panel p-6 rounded-2xl border border-orange-500 shadow-xl backdrop-blur-xl relative">
            <div className="absolute top-0 right-0 bg-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">ELITE</div>
            <h3 className="text-2xl font-bold mb-2 text-white">Partner Elite</h3>
            <p className="text-gray-400 mb-6 text-sm">Priority exposure, EPL integration, advanced analytics.</p>
            <div className="mb-6">
              <span className="text-4xl font-bold">$249</span>
              <span className="text-gray-400">/month</span>
            </div>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-center text-sm"><svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 4.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 10.586l6.293-6.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>All Partner Pro features</li>
              <li className="flex items-center text-sm"><svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 4.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 10.586l6.293-6.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>Priority Pulse Feed exposure</li>
              <li className="flex items-center text-sm"><svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 4.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 10.586l6.293-6.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>EPL integrations</li>
              <li className="flex items-center text-sm"><svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 4.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 10.586l6.293-6.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>Featured placement in venue pages</li>
              <li className="flex items-center text-sm"><svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 4.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 10.586l6.293-6.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>Premium analytics</li>
            </ul>
          </div>

          {/* Partner Premier */}
          <div className="ev-panel p-6 rounded-2xl border border-blue-500 shadow-xl backdrop-blur-xl relative">
             <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">PREMIER</div>
            <h3 className="text-2xl font-bold mb-2 text-white">Partner Premier</h3>
            <p className="text-gray-400 mb-6 text-sm">Top-tier visibility, homepage features, EPL co-branding.</p>
            <div className="mb-6">
              <span className="text-4xl font-bold">$499</span>
              <span className="text-gray-400">/month</span>
            </div>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-center text-sm"><svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 4.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 10.586l6.293-6.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>All Partner Elite features</li>
              <li className="flex items-center text-sm"><svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 4.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 10.586l6.293-6.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>Top-tier Pulse visibility</li>
              <li className="flex items-center text-sm"><svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 4.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 10.586l6.293-6.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>Guaranteed placement</li>
              <li className="flex items-center text-sm"><svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 4.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 10.586l6.293-6.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>Homepage featured sections</li>
              <li className="flex items-center text-sm"><svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 4.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 10.586l6.293-6.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>Co-branded opportunities</li>
            </ul>
          </div>

          {/* EPL Partner Layer */}
          <div className="ev-panel p-6 rounded-2xl border border-red-500 shadow-xl backdrop-blur-xl relative">
             <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">EPL LAYER</div>
            <h3 className="text-2xl font-bold mb-2 text-white">EPL Partner</h3>
            <p className="text-gray-400 mb-6 text-sm">Branding on game days, EPL content integration.</p>
            <div className="mb-6">
              <span className="text-4xl font-bold">+</span>
              <span className="text-gray-400"> on top of Partner Pro/Elite/Premier</span>
            </div>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-center text-sm"><svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 4.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 10.586l6.293-6.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>Branding on game days</li>
              <li className="flex items-center text-sm"><svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 4.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 10.586l6.293-6.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>Mention in EPL content</li>
              <li className="flex items-center text-sm"><svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 4.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 10.586l6.293-6.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>Broadcast integration</li>
              <li className="flex items-center text-sm"><svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 4.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 10.586l6.293-6.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>On-field/Jersey placement (where applicable)</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 lg:px-8 text-center">
        <h2 className="text-4xl font-bold mb-8 text-white">Partner Add-Ons</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="ev-panel p-6 rounded-2xl border border-white/10 shadow-xl backdrop-blur-xl">
            <h3 className="text-2xl font-bold mb-2 text-white">Partner Boosts</h3>
            <p className="text-gray-400 mb-6 text-sm">Same pricing as Boosted Moments.</p>
            <div className="mb-4">
              <span className="text-3xl font-bold">$5 - $75</span>
            </div>
            <p className="text-sm text-gray-300">Boost offers, campaigns, and events.</p>
          </div>
          <div className="ev-panel p-6 rounded-2xl border border-white/10 shadow-xl backdrop-blur-xl">
            <h3 className="text-2xl font-bold mb-2 text-white">Sponsored Smart Fill</h3>
            <p className="text-gray-400 mb-6 text-sm">Attach your brand to opportunities.</p>
            <div className="mb-4">
              <span className="text-3xl font-bold">Varies</span>
            </div>
            <p className="text-sm text-gray-300">Pricing varies by city demand.</p>
          </div>
          <div className="ev-panel p-6 rounded-2xl border border-white/10 shadow-xl backdrop-blur-xl">
            <h3 className="text-2xl font-bold mb-2 text-white">Node Sponsorship</h3>
            <p className="text-gray-400 mb-6 text-sm">Brand appears when tapped.</p>
            <div className="mb-4">
              <span className="text-3xl font-bold">Custom</span>
            </div>
            <p className="text-sm text-gray-300">Premium physical exposure.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 lg:px-8 text-center">
        <h2 className="text-4xl font-bold mb-8 text-white">Ready to Partner?</h2>
        <p className="text-lg text-white/70 max-w-3xl mx-auto mb-8">
          Connect with us to discuss tailored partnership opportunities and elevate your brand with EVNTSZN.
        </p>
        <Link href="/contact" className="ev-button-primary px-8 py-3 text-lg">
          Contact Sales
        </Link>
      </section>
    </PublicPageFrame>
  );
};

export default PartnerProgramPage;
