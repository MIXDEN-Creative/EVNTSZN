import { BookingSection } from "@/components/BookingSection";
import { DepositInfo } from "@/components/DepositInfo";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Navbar } from "@/components/Navbar";
import { PackageCard } from "@/components/PackageCard";
import { getHapioStatus } from "@/lib/hapio";

const packages = [
  {
    name: "Foundation Build",
    price: "$500",
    deposit: "$250",
    balance: "$250 before final delivery",
    turnaround: "3–5 days",
    bestFor: "Beginners who need a polished starting point",
    ctaLabel: "Book Foundation Build",
    features: [
      "Brand Identity Starter Kit",
      "Color and font direction",
      "Bio and brand messaging, 3 variations",
      "10 plug-and-post social captions",
      "5 Canva content templates",
      "AI prompt pack for their niche",
      "Delivery as PDF/Google Doc/Canva links",
    ],
  },
  {
    name: "Creator System Build",
    price: "$1,500",
    deposit: "$750",
    balance: "$750 before final delivery",
    turnaround: "5–10 days",
    bestFor: "Creators and entrepreneurs who need a full content and offer system",
    ctaLabel: "Book Creator System",
    featured: true,
    features: [
      "Everything in Foundation Build",
      "30-day content strategy plan",
      "20 Canva templates",
      "Landing page copy",
      "Offer structure and positioning",
      "10 TikTok/Reel scripts",
      "Simple funnel map",
      "Launch checklist",
    ],
  },
  {
    name: "Done-For-You Creative Build",
    price: "$3,000",
    deposit: "$1,500",
    balance: "$1,500 before final delivery",
    turnaround: "10–14 days",
    bestFor: "Serious creators, brands, and entrepreneurs ready for a complete creative build",
    ctaLabel: "Apply for Done-For-You Build",
    features: [
      "Everything in Creator System Build",
      "Full brand direction deck",
      "Website layout and page copy",
      "Full content system setup",
      "Digital product or offer buildout",
      "Launch plan",
      "60-minute strategy call",
      "Final delivery package with organized assets",
    ],
  },
] as const;

const whyMixden = [
  "Built for modern creators and small brands",
  "Premium strategy without agency complexity",
  "AI-assisted workflows for faster delivery",
  "Clear deliverables and simple timelines",
  "Designed to help you launch, sell, and show up professionally",
];

export default function HomePage() {
  const hapio = getHapioStatus();

  return (
    <main className="relative overflow-hidden">
      <Navbar />
      <Hero />

      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(46,46,46,0.34),rgba(0,0,0,0.96))] p-6 sm:p-8 lg:p-10">
          <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-accent)]">
            The Problem
          </p>
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-end">
            <h2 className="text-3xl font-bold uppercase leading-tight text-white sm:text-4xl">
              You have the idea, but you need the structure, visuals, messaging,
              and launch plan to make it real.
            </h2>
            <p className="max-w-2xl text-base leading-7 text-white/72">
              MIXDEN Creative gives you a fast, premium creative build without
              hiring a full team.
            </p>
          </div>
        </div>
      </section>

      <section id="packages" className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-accent)]">
              Packages
            </p>
            <h2 className="mt-4 text-3xl font-bold uppercase leading-tight text-white sm:text-4xl">
              Flexible Creative Builds With Clear Scope And Clear Pricing
            </h2>
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {packages.map((pkg) => (
              <PackageCard key={pkg.name} {...pkg} />
            ))}
          </div>
        </div>
      </section>

      <DepositInfo />

      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-accent)]">
              Why MIXDEN Creative
            </p>
            <h2 className="mt-4 text-3xl font-bold uppercase leading-tight text-white sm:text-4xl">
              Creative Direction Meets Fast Execution
            </h2>
          </div>
          <div className="grid gap-4">
            {whyMixden.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-base text-white/76"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-8 sm:px-6 lg:px-8 lg:pb-12">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/8 bg-[linear-gradient(145deg,rgba(162,89,255,0.08),rgba(255,255,255,0.03),rgba(0,0,0,0.9))] p-6 sm:p-8">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-accent)]/90">
              MIXDEN Ecosystem
            </p>
            <h2 className="mt-4 text-2xl font-bold uppercase leading-tight text-white sm:text-3xl">
              Part of the MIXDEN Ecosystem
            </h2>
            <div className="mt-5 space-y-4 text-sm leading-7 text-white/68 sm:text-base">
              <p>
                MIXDEN Creative is part of a larger vision to build the future
                of creative experiences.
              </p>
              <p>
                Our event and experience platform, EVNTSZN, powers real-world
                connections, curated events, and social experiences across
                cities.
              </p>
              <p>
                While MIXDEN Creative focuses on building brands, content
                systems, and digital presence, EVNTSZN focuses on where those
                brands and people show up in real life.
              </p>
              <p>
                Together, they create a full ecosystem: from building your
                presence to placing you in the right rooms.
              </p>
            </div>
            <a
              href="https://evntszn.com"
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center justify-center rounded-full border border-white/12 bg-white/6 px-5 py-3 text-sm font-semibold text-white transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
              Explore EVNTSZN
            </a>
          </div>
        </div>
      </section>

      <BookingSection
        bookingUrl={hapio.bookingUrl}
        hasServerIntegration={hapio.hasApiBaseUrl}
      />

      <Footer />
    </main>
  );
}
