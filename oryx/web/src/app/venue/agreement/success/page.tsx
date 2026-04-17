// src/app/venue/agreement/success/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import PublicPageFrame from '@/components/public/PublicPageFrame';

const VenueAgreementSuccessPage = () => {
  return (
    <PublicPageFrame
      title="Agreement Submitted"
      description="Your venue agreement has been successfully submitted."
      seo={{
        title: "Venue Agreement Submitted | EVNTSZN",
        description: "Thank you for submitting your venue agreement. Your submission has been received.",
      }}
    >
      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:px-8 text-center">
        <div className="ev-panel p-8">
          <h2 className="text-3xl font-bold mb-4 text-green-400">Agreement Submitted Successfully!</h2>
          <p className="text-lg text-white/70 mb-6 max-w-2xl mx-auto">
            Thank you for submitting your venue agreement. Our team will review it shortly and be in touch regarding the next steps.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/venue" className="ev-button-primary px-6 py-3 text-lg">
              Explore Venues
            </Link>
            <Link href="/" className="ev-button-secondary px-6 py-3 text-lg">
              Go to Homepage
            </Link>
          </div>
        </div>
      </section>
    </PublicPageFrame>
  );
};

export default VenueAgreementSuccessPage;
