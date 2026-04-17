"use client";

import Image from "next/image";
import Link from "next/link";
import HoverLift from "@/components/motion/HoverLift";

type EventCardVenue = {
  name?: string | null;
  city?: { name?: string | null } | null;
};

type EventCardImage = {
  url?: string | null;
};

type EventCardEvent = {
  name: string;
  sourceLabel?: string | null;
  venue?: string | null;
  city?: string | null;
  slug?: string | null;
  images?: EventCardImage[] | null;
  _embedded?: {
    venues?: EventCardVenue[] | null;
  } | null;
};

export default function EventCard({ event }: { event: EventCardEvent }) {
  const image =
    event.images?.[0]?.url ||
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80";

  return (
    <HoverLift>
      <article className="group relative overflow-hidden rounded-[26px] ev-panel ev-metal-border min-h-[420px]">
        <div className="absolute inset-0">
          <Image
            src={image}
            alt={event.name}
            fill
            className="object-cover transition duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/10" />
        </div>

        <div className="relative z-10 flex min-h-[420px] flex-col justify-end p-5 text-white">
          <div className="mb-3 inline-flex w-fit ev-chip text-[11px] font-semibold uppercase tracking-[0.22em] text-white/85">
            {event.sourceLabel || "Event discovery"}
          </div>

          <h3 className="max-w-[90%] text-2xl font-black leading-tight">
            {event.name}
          </h3>

          <div className="mt-3 space-y-1 text-sm text-white/75">
            <p>{event.venue || event._embedded?.venues?.[0]?.name || "Live Event"}</p>
            <p>{event.city || event._embedded?.venues?.[0]?.city?.name || "City TBA"}</p>
          </div>

          <div className="mt-5">
            <Link
              href={event.slug ? `/events/${event.slug}` : "/events"}
              className="inline-flex rounded-full border border-white/14 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white hover:text-black"
            >
              View event
            </Link>
          </div>
        </div>
      </article>
    </HoverLift>
  );
}
