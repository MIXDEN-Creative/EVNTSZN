// src/app/link/page.tsx
'use client';

import Link from 'next/link';
import React from 'react';

const LinkPage = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <header className="text-center mb-16">
        <h1 className="text-5xl font-bold mb-4">EVNTSZN Link: Your Ultimate Event Hub</h1>
        <p className="text-xl text-gray-600">Connect, promote, and convert with our powerful link-in-bio and event promotion tools.</p>
      </header>

      <section className="mb-16">
        <h2 className="text-4xl font-bold text-center mb-8">Transform Your Event Presence</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-lg mb-4">
              EVNTSZN Link is designed to be the central point for your event promotions, artist profiles, and venue listings.
              Whether you're an independent organizer looking to make a splash or a seasoned host aiming to streamline
              your operations, Link provides the tools to drive engagement and conversions.
            </p>
            <p className="text-lg mb-4">
              From basic event linking to advanced analytics and NFC compatibility, Link scales with your needs.
            </p>
          </div>
          <div className="text-center">
            {/* Placeholder for a relevant visual */}
            <div className="w-64 h-64 bg-gradient-to-r from-purple-400 to-blue-500 rounded-lg shadow-xl mx-auto flex items-center justify-center text-white text-2xl font-semibold">
              Link Your World
            </div>
          </div>
        </div>
      </section>

      <section className="mb-16">
        <h2 className="text-4xl font-bold text-center mb-12">Choose Your Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Link Free */}
          <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200 flex flex-col justify-between">
            <div>
              <h3 className="text-3xl font-bold mb-2">Link Free</h3>
              <p className="text-gray-500 mb-6">For basic event linking and discovery.</p>
              <div className="mb-6">
                <span className="text-5xl font-bold">$0</span>
                <span className="text-gray-500">/month</span>
              </div>
              <ul className="space-y-4 text-lg text-gray-700">
                <li className="flex items-center">
                  <svg className="w-6 h-6 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 4.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 10.586l6.293-6.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                  Basic link-in-bio page
                </li>
                <li className="flex items-center">
                  <svg className="w-6 h-6 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 4.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 10.586l6.293-6.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                  Event linking
                </li>
                <li className="flex items-center">
                  <svg className="w-6 h-6 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 4.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 10.586l6.293-6.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                  Basic customization
                </li>
                <li className="flex items-center">
                  <svg className="w-6 h-6 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                  No NFC compatibility
                </li>
                <li className="flex items-center">
                  <svg className="w-6 h-6 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                  Standard analytics only
                </li>
                 <li className="flex items-center">
                  <svg className="w-6 h-6 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                  Cannot pass premium ticket fee
                </li>
              </ul>
            </div>
            <div className="mt-8">
              <Link href="/auth/signup?plan=link-free" legacyBehavior>
                <a className="block w-full text-center py-3 px-6 rounded-lg font-semibold bg-gray-200 text-gray-800 hover:bg-gray-300">
                  Start Free
                </a>
              </Link>
            </div>
          </div>

          {/* Link Pro */}
          <div className="bg-white rounded-lg shadow-lg p-8 border border-purple-500 flex flex-col justify-between relative">
            <div className="absolute top-0 right-0 bg-purple-500 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">PRO</div>
            <div>
              <h3 className="text-3xl font-bold mb-2">Link Pro</h3>
              <p className="text-gray-500 mb-6">For organizers seeking advanced features and conversion tracking.</p>
              <div className="mb-6">
                <span className="text-5xl font-bold">$29</span>
                <span className="text-gray-500">/month</span>
              </div>
              <ul className="space-y-4 text-lg text-gray-700">
                <li className="flex items-center">
                  <svg className="w-6 h-6 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 4.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 10.586l6.293-6.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                  Custom branded page
                </li>
                <li className="flex items-center">
                  <svg className="w-6 h-6 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 4.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 10.586l6.293-6.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                  Unlimited links
                </li>
                <li className="flex items-center">
                  <svg className="w-6 h-6 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 4.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 10.586l6.293-6.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                  Event integration
                </li>
                <li className="flex items-center">
                  <svg className="w-6 h-6 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 4.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 10.586l6.293-6.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                  NFC card compatibility
                </li>
                <li className="flex items-center">
                  <svg className="w-6 h-6 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 4.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 10.586l6.293-6.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                  Advanced analytics
                </li>
                <li className="flex items-center">
                  <svg className="w-6 h-6 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 4.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 10.586l6.293-6.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                  Conversion tracking
                </li>
                 <li className="flex items-center">
                  <svg className="w-6 h-6 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 4.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 10.586l6.293-6.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                  Can pass premium ticket fee
                </li>
              </ul>
            </div>
            <div className="mt-8">
              <Link href="/auth/upgrade?plan=link-pro" legacyBehavior>
                <a className="block w-full text-center py-3 px-6 rounded-lg font-semibold bg-purple-500 text-white hover:bg-purple-600">
                  Upgrade to Pro
                </a>
              </Link>
            </div>
          </div>

          {/* Included in Organizer Pro / Host Program */}
          <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200 flex flex-col justify-between">
            <div>
              <h3 className="text-3xl font-bold mb-2">Included in Pro</h3>
              <p className="text-gray-500 mb-6">Bundled with Organizer Pro and Host Program tiers.</p>
              <div className="mb-6">
                <span className="text-5xl font-bold">Included</span>
              </div>
              <ul className="space-y-4 text-lg text-gray-700">
                <li className="flex items-center">
                  <svg className="w-6 h-6 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 4.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 10.586l6.293-6.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                  Link Pro features
                </li>
                <li className="flex items-center">
                  <svg className="w-6 h-6 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 4.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 10.586l6.293-6.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                  Priority discovery boost
                </li>
                <li className="flex items-center">
                  <svg className="w-6 h-6 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 4.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 10.586l6.293-6.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                  Advanced analytics
                </li>
                 <li className="flex items-center">
                  <svg className="w-6 h-6 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 4.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 10.586l6.293-6.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                  Can pass premium ticket fee
                </li>
                <li className="flex items-center">
                  <svg className="w-6 h-6 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 4.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 10.586l6.293-6.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                  Smart Fill pricing benefits
                </li>
              </ul>
            </div>
            <div className="mt-8">
              <Link href="/auth/signup?tier=pro-organizer" legacyBehavior>
                <a className="block w-full text-center py-3 px-6 rounded-lg font-semibold bg-gray-200 text-gray-800 hover:bg-gray-300">
                  Learn More
                </a>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-16 text-center">
        <h2 className="text-4xl font-bold mb-8">Role-Based Value</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-2xl font-semibold mb-3">Independent Organizer</h3>
            <p className="text-gray-700">Leverage Link Free for basic event promotion or upgrade to Pro for advanced analytics and conversion tracking.</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-2xl font-semibold mb-3">EVNTSZN Host</h3>
            <p className="text-gray-700">Get Link Pro included. Enhance your venue's profile, track event performance, and drive more attendees.</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-2xl font-semibold mb-3">Pro Host & City Leader</h3>
            <p className="text-gray-700">Benefit from all Link Pro features, plus priority placement and deeper integration into the EVNTSZN ecosystem.</p>
          </div>
        </div>
      </section>

      <section className="mb-16 text-center">
        <h2 className="text-4xl font-bold mb-8">Analytics & Conversion Tracking</h2>
        <p className="text-lg text-gray-700 max-w-3xl mx-auto">
          Understand your audience, track click-through rates, and measure the success of your promotions. Link Pro provides
          robust analytics to optimize your event marketing efforts and drive real conversions.
        </p>
      </section>

      <section className="text-center">
        <h2 className="text-4xl font-bold mb-8">Ready to Amplify Your Events?</h2>
        <div className="flex justify-center space-x-6">
          <Link href="/auth/signup?plan=link-free" legacyBehavior>
            <a className="inline-block py-3 px-8 rounded-lg font-semibold bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 text-lg">
              Start Free
            </a>
          </Link>
          <Link href="/auth/upgrade?plan=link-pro" legacyBehavior>
            <a className="inline-block py-3 px-8 rounded-lg font-semibold border-2 border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white text-lg">
              Go Pro
            </a>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LinkPage;
