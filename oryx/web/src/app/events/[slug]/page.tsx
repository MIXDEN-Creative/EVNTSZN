import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getTicketAvailabilityState, type TicketAvailabilityState } from "@/lib/ticketing";
import TicketPurchaseCard from "./TicketPurchaseCard";

type Params = Promise<{ slug: string }>;
type EventVenue = {
  name: string;
};

export default async function EventDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const { data: event } = await supabaseAdmin
    .from("evntszn_events")
    .select(`
      id,
      title,
      slug,
      subtitle,
      description,
      hero_note,
      city,
      state,
      start_at,
      end_at,
      scanner_status,
      event_class,
      event_vertical,
      evntszn_venues (
        name
      )
    `)
    .eq("slug", slug)
    .eq("visibility", "published")
    .maybeSingle();

  if (!event) {
    notFound();
  }

  const { data: ticketTypes } = await supabaseAdmin
    .from("evntszn_ticket_types")
    .select("id, name, description, price_cents, quantity_total, quantity_sold, max_per_order, sales_start_at, sales_end_at, is_active, visibility_mode, sort_order")
    .eq("event_id", event.id)
    .order("sort_order", { ascending: true });

  const { data: operations } = await supabaseAdmin
    .from("evntszn_event_operations")
    .select("objective, run_of_show")
    .eq("event_id", event.id)
    .maybeSingle();

  const visibleTicketTypes = ((ticketTypes || [])
    .map((ticket) => ({ ...ticket, availability_state: getTicketAvailabilityState(ticket) }))
    .filter((ticket) => ticket.visibility_mode === "visible" || ticket.availability_state === "active")) as Array<
    {
      id: string;
      name: string;
      description: string | null;
      price_cents: number;
      quantity_total: number;
      quantity_sold: number;
      max_per_order: number;
      sales_start_at?: string | null;
      sales_end_at?: string | null;
      is_active?: boolean;
      visibility_mode?: "visible" | "hidden";
      availability_state: TicketAvailabilityState;
    }
  >;

  return (
    <main className="min-h-screen bg-black px-6 py-12 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section>
            <p className="text-xs uppercase tracking-[0.28em] text-[#A259FF]">
              {event.city}, {event.state}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/70">
                {event.event_vertical === "epl" ? "EPL" : "EVNTSZN"}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/70">
                {String(event.event_class || "evntszn").replace(/_/g, " ")}
              </span>
            </div>
            <h1 className="mt-3 text-5xl font-black tracking-tight">{event.title}</h1>
            <p className="mt-5 max-w-3xl text-lg text-white/68">
              {event.description || event.subtitle}
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">Venue</p>
                <p className="mt-3 text-xl font-semibold">
                  {Array.isArray(event.evntszn_venues)
                    ? (event.evntszn_venues[0] as EventVenue | undefined)?.name
                    : (event.evntszn_venues as EventVenue | null)?.name || "EVNTSZN venue"}
                </p>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">Doors</p>
                <p className="mt-3 text-xl font-semibold">
                  {new Date(event.start_at).toLocaleString()}
                </p>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">Scanner</p>
                <p className="mt-3 text-xl font-semibold">{event.scanner_status}</p>
              </div>
            </div>

            {event.hero_note ? (
              <div className="mt-8 rounded-[30px] border border-[#A259FF]/25 bg-[#A259FF]/10 p-6 text-[#e4d8ff]">
                {event.hero_note}
              </div>
            ) : null}

            {operations?.objective || operations?.run_of_show ? (
              <div className="mt-8 rounded-[30px] border border-white/10 bg-white/[0.03] p-6">
                <p className="text-xs uppercase tracking-[0.22em] text-[#A259FF]">Event operations</p>
                {operations.objective ? (
                  <p className="mt-4 text-base leading-7 text-white/76">{operations.objective}</p>
                ) : null}
                {operations.run_of_show ? (
                  <pre className="mt-5 whitespace-pre-wrap text-sm leading-7 text-white/68">{operations.run_of_show}</pre>
                ) : null}
              </div>
            ) : null}
          </section>

          <TicketPurchaseCard
            eventId={event.id}
            eventTitle={event.title}
            eventSlug={event.slug}
            ticketTypes={visibleTicketTypes}
          />
        </div>
      </div>
    </main>
  );
}
