import { notFound } from "next/navigation";
import ScannerConsole from "./ScannerConsole";
import { requireEventScannerAccess } from "@/lib/evntszn";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Params = Promise<{ eventSlug: string }>;

export default async function ScannerPage({ params }: { params: Params }) {
  const { eventSlug } = await params;
  await requireEventScannerAccess(eventSlug);

  const { data: event } = await supabaseAdmin
    .from("evntszn_events")
    .select("id, slug, title, check_in_count")
    .eq("slug", eventSlug)
    .maybeSingle();

  if (!event) {
    notFound();
  }

  const { data: ticketTypes } = await supabaseAdmin
    .from("evntszn_ticket_types")
    .select("id, name, quantity_total, quantity_sold")
    .eq("event_id", event.id);

  const ticketCapacity = (ticketTypes || []).reduce((sum, row) => sum + (row.quantity_total || 0), 0);
  const ticketTypeIds = (ticketTypes || []).map((ticketType) => ticketType.id);
  const { data: checkedTickets } = ticketTypeIds.length
    ? await supabaseAdmin
        .from("evntszn_tickets")
        .select("ticket_type_id")
        .eq("event_id", event.id)
        .eq("status", "checked_in")
        .in("ticket_type_id", ticketTypeIds)
    : { data: [] as { ticket_type_id: string }[] };

  const checkedCounts = new Map<string, number>();
  for (const ticket of checkedTickets || []) {
    checkedCounts.set(ticket.ticket_type_id, (checkedCounts.get(ticket.ticket_type_id) || 0) + 1);
  }

  const ticketBreakdown = (ticketTypes || []).map((ticketType) => {
    const checkedIn = checkedCounts.get(ticketType.id) || 0;
    const sold = ticketType.quantity_sold || 0;
    return {
      id: ticketType.id,
      name: ticketType.name,
      sold,
      checkedIn,
      remainingNotCheckedIn: Math.max(sold - checkedIn, 0),
    };
  });

  return (
    <ScannerConsole
      eventId={event.id}
      eventSlug={event.slug}
      eventTitle={event.title}
      checkedInCount={event.check_in_count || 0}
      ticketCapacity={ticketCapacity}
      ticketBreakdown={ticketBreakdown}
    />
  );
}
