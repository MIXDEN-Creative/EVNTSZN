import { notFound } from "next/navigation";
import PublicPageFrame from "@/components/public/PublicPageFrame";
import PublicReserveBookingClient from "@/components/reserve/PublicReserveBookingClient";
import { getReserveVenueBySlug, normalizeReserveSettings, unwrapVenue } from "@/lib/reserve";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function ReserveVenuePage({ params }: { params: Promise<{ venueSlug: string }> }) {
  const { venueSlug } = await params;
  const reserveVenue = await getReserveVenueBySlug(venueSlug);
  if (!reserveVenue) notFound();

  const venue = unwrapVenue(reserveVenue);
  const settings = normalizeReserveSettings((reserveVenue.settings || {}) as Record<string, unknown>);
  const { data: slots } = await supabaseAdmin
    .from("evntszn_reserve_slots")
    .select("id, reserve_venue_id, day_of_week, start_time, end_time, capacity_limit, is_active")
    .eq("reserve_venue_id", reserveVenue.id)
    .eq("is_active", true)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  return (
    <PublicPageFrame
      title={`${venue?.name || "Reserve"} reservations`}
      description={`Book dining and nightlife flow for ${venue?.name || "this venue"} with EVNTSZN Reserve.`}
      heroImage="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1800&q=80"
      seo={{
        title: `${venue?.name || "Reserve"} | EVNTSZN Reserve`,
        description: `Reserve bookings, nightlife tables, and waitlist management for ${venue?.name || "this venue"}.`,
      }}
    >
      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="ev-panel p-8">
            <div className="ev-section-kicker">Reserve venue</div>
            <h1 className="mt-3 text-5xl font-black tracking-tight text-white">{venue?.name || "Reserve"}</h1>
            <div className="mt-4 text-sm text-white/58">{venue?.city}, {venue?.state}</div>
            <p className="mt-5 text-base leading-7 text-white/68">
              Reserve handles dining reservations, nightlife tables, and guest flow for venues that need more than a static booking link.
            </p>
          </div>

          <PublicReserveBookingClient
            venue={{
              id: reserveVenue.id,
              venueId: reserveVenue.venue_id,
              isActive: reserveVenue.is_active,
              settings,
              venue,
            }}
            slots={slots || []}
          />
        </div>
      </section>
    </PublicPageFrame>
  );
}
