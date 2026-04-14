"use client";

import Image from "next/image";
import FadeIn from "@/components/motion/FadeIn";

const CITY_BACKGROUNDS: Record<string, string> = {
  baltimore:
    "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1600&q=80",
  newyork:
    "https://images.unsplash.com/photo-1499092346589-b9b6be3e94b2?auto=format&fit=crop&w=1600&q=80",
  atlanta:
    "https://images.unsplash.com/photo-1577648188599-291bb8b831c3?auto=format&fit=crop&w=1600&q=80",
  miami:
    "https://images.unsplash.com/photo-1535498730771-e735b998cd64?auto=format&fit=crop&w=1600&q=80",
  default:
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=80",
};

function getCityImage(city?: string) {
  if (!city) return CITY_BACKGROUNDS.default;
  const key = city.toLowerCase().replace(/\s+/g, "");
  return CITY_BACKGROUNDS[key] || CITY_BACKGROUNDS.default;
}

type DiscoveryHeroProps = {
  city?: string;
};

export default function DiscoveryHero({ city }: DiscoveryHeroProps) {
  const image = getCityImage(city);

  return (
    <section className="relative overflow-hidden rounded-[32px] ev-panel ev-metal-border min-h-[72vh]">
      <div className="absolute inset-0">
        <Image
          src={image}
          alt={city ? `${city} event discovery` : "EVNTSZN event discovery"}
          fill
          priority
          className="object-cover scale-105"
        />
        <div className="absolute inset-0 ev-hero-overlay" />
        <div className="absolute inset-0 ev-subtle-grid opacity-30" />
      </div>

      <div className="relative z-10 flex min-h-[72vh] items-end px-6 py-8 md:px-10 md:py-10 lg:px-14">
        <div className="grid w-full gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
          <div className="max-w-4xl">
            <FadeIn delay={0.05}>
              <div className="mb-4 inline-flex ev-chip text-xs font-semibold uppercase tracking-[0.24em] text-white/90">
                EVNTSZN Discovery
              </div>
            </FadeIn>

            <FadeIn delay={0.12}>
              <h1 className="ev-headline max-w-4xl text-5xl font-black text-white md:text-6xl lg:text-7xl">
                The move before you make it.
              </h1>
            </FadeIn>

            <FadeIn delay={0.2}>
              <p className="mt-5 max-w-2xl text-base text-white/80 md:text-lg italic">
                EVNTSZN surfaces the nightlife, music, sports, and city energy actually worth your time. One clean read on what’s next.
              </p>
            </FadeIn>
          </div>

          <FadeIn delay={0.28}>
            <div className="ev-glass rounded-[28px] p-5 text-white">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/65">
                Live crowd energy
              </div>
              <div className="mt-4 space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm text-white/70">
                    <span>Nightlife pulse</span>
                    <span>92</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[92%] rounded-full bg-white" />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-sm text-white/70">
                    <span>Music demand</span>
                    <span>88</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[88%] rounded-full bg-[#A259FF]" />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-sm text-white/70">
                    <span>Weekend momentum</span>
                    <span>95</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[95%] rounded-full bg-white/80" />
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
