import SurfaceShell from "@/components/shells/SurfaceShell";
import PerformanceScorePanel from "@/components/performance/PerformanceScorePanel";
import ReserveDashboardClient from "@/components/reserve/ReserveDashboardClient";
import { requirePlatformUser } from "@/lib/evntszn";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function AccountReservePage() {
  const viewer = await requirePlatformUser("/account/reserve");

  const { data: venues } = await supabaseAdmin
    .from("evntszn_reserve_venues")
    .select("id, venue_id, is_active, settings, evntszn_venues!inner(id, slug, name, city, state, timezone, owner_user_id)")
    .eq("evntszn_venues.owner_user_id", viewer.user!.id);

  const reserveVenueIds = (venues || []).map((row) => row.id);
  const [{ data: bookings }, { data: slots }] = await Promise.all([
    reserveVenueIds.length
      ? supabaseAdmin
          .from("evntszn_reserve_bookings")
          .select("id, reserve_venue_id, status, booking_date, booking_time, party_size, guest_name, guest_email, guest_phone")
          .in("reserve_venue_id", reserveVenueIds)
          .order("booking_date", { ascending: true })
      : Promise.resolve({ data: [] as any[] }),
    reserveVenueIds.length
      ? supabaseAdmin
          .from("evntszn_reserve_slots")
          .select("id, reserve_venue_id, day_of_week, start_time, end_time, capacity_limit, is_active")
          .in("reserve_venue_id", reserveVenueIds)
          .order("day_of_week", { ascending: true })
          .order("start_time", { ascending: true })
      : Promise.resolve({ data: [] as any[] }),
  ]);

  return (
    <SurfaceShell
      surface="app"
      eyebrow="Reserve dashboard"
      title="Own launch, slot pressure, and guest flow"
      description="Reserve venues, bookings, and waitlist pressure stay visible here for the operator who owns the booking workflow."
    >
      <div className="space-y-8">
        <PerformanceScorePanel scope="reserve" title="R-Score" />

        <ReserveDashboardClient
          initialVenues={(venues || []).map((row) => ({
            id: row.id,
            venueId: row.venue_id,
            isActive: row.is_active,
            settings: (row.settings as Record<string, unknown> | null) || {},
            venue: Array.isArray(row.evntszn_venues) ? row.evntszn_venues[0] || null : row.evntszn_venues,
          }))}
          initialSlots={slots || []}
          initialBookings={bookings || []}
        />
      </div>
    </SurfaceShell>
  );
}
