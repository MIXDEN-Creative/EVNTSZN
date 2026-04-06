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
    .select("quantity_total")
    .eq("event_id", event.id);

  const ticketCapacity = (ticketTypes || []).reduce((sum, row) => sum + (row.quantity_total || 0), 0);

  return (
    <ScannerConsole
      eventId={event.id}
      eventSlug={event.slug}
      eventTitle={event.title}
      checkedInCount={event.check_in_count || 0}
      ticketCapacity={ticketCapacity}
    />
  );
}
