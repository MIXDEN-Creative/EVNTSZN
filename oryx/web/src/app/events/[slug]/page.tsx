import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
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
    .select("id, name, description, price_cents, quantity_total, quantity_sold, max_per_order")
    .eq("event_id", event.id)
    .eq("is_active", true)
    .order("price_cents", { ascending: true });

  return (
    <main className="min-h-screen bg-black px-6 py-12 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section>
            <p className="text-xs uppercase tracking-[0.28em] text-[#A259FF]">
              {event.city}, {event.state}
            </p>
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
          </section>

          <TicketPurchaseCard
            eventId={event.id}
            eventTitle={event.title}
            eventSlug={event.slug}
            ticketTypes={ticketTypes || []}
          />
        </div>
      </div>
    </main>
  );
}
