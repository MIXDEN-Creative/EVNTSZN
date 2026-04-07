"use client";

import FadeIn from "@/components/motion/FadeIn";
import HoverLift from "@/components/motion/HoverLift";

const pulseItems = [
  {
    label: "Tonight",
    title: "City demand is up",
    value: "High intent",
  },
  {
    label: "Music",
    title: "Concert + DJ searches climbing",
    value: "+28%",
  },
  {
    label: "Nightlife",
    title: "Late-night discovery accelerating",
    value: "Peak window",
  },
  {
    label: "Sports",
    title: "Fan and league energy rising",
    value: "Weekend pull",
  },
];

export default function PulseStrip() {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {pulseItems.map((item, index) => (
        <FadeIn key={item.title} delay={0.08 * index}>
          <HoverLift>
            <div className="ev-panel ev-metal-border rounded-[24px] p-5 text-white">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/55">
                {item.label}
              </div>
              <div className="mt-3 text-xl font-bold leading-tight">{item.title}</div>
              <div className="mt-4 text-sm text-white/65">{item.value}</div>
            </div>
          </HoverLift>
        </FadeIn>
      ))}
    </section>
  );
}
