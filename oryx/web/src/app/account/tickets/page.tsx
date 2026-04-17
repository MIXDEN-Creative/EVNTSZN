import type { Metadata } from "next";
import Link from "next/link";
import OfficialTicketPass from "@/components/tickets/OfficialTicketPass";
import { requirePlatformUser } from "@/lib/evntszn";
import { getAppOrigin } from "@/lib/domains";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Tickets | EVNTSZN",
  description: "Open your official EVNTSZN tickets, entry status, and event access in one place.",
  alternates: {
    canonical: `${getAppOrigin()}/account/tickets`,
  },
};

type TicketRow = {
  id: string;
  ticket_code: string;
  attendee_name: string | null;
  attendee_email: string | null;
  status: string;
  checked_in_at: string | null;
  created_at: string;
  evntszn_ticket_types?: { name?: string | null }[] | { name?: string | null } | null;
  evntszn_events?: {
    title?: string | null;
    slug?: string | null;
    start_at?: string | null;
    evntszn_venues?: { name?: string | null }[] | { name?: string | null } | null;
  }[] | {
    title?: string | null;
    slug?: string | null;
    start_at?: string | null;
    evntszn_venues?: { name?: string | null }[] | { name?: string | null } | null;
  } | null;
};

function firstRelation<T>(value: T[] | T | null | undefined) {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

export default async function AccountTicketsPage() {
  const viewer = await requirePlatformUser("/account/tickets");
  const isFounderOverride = viewer.user?.id?.startsWith("founder:");

  const { data, error } = isFounderOverride
    ? { data: [] as TicketRow[], error: null }
    : await supabaseAdmin
        .from("evntszn_tickets")
        .select(`
          id,
          ticket_code,
          attendee_name,
          attendee_email,
          status,
          checked_in_at,
          created_at,
          evntszn_ticket_types(name),
          evntszn_events(
            title,
            slug,
            start_at,
            evntszn_venues(name)
          )
        `)
        .eq("purchaser_user_id", viewer.user!.id)
        .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const tickets = ((data || []) as TicketRow[]).map((ticket) => {
    const event = firstRelation(ticket.evntszn_events);
    const ticketType = firstRelation(ticket.evntszn_ticket_types);
    const venue = firstRelation(event?.evntszn_venues);

    return {
      id: ticket.id,
      ticketCode: ticket.ticket_code,
      holderName: ticket.attendee_name || ticket.attendee_email || viewer.user?.email || "EVNTSZN Guest",
      status: ticket.status,
      checkedInAt: ticket.checked_in_at,
      eventName: event?.title || "EVNTSZN Event",
      eventSlug: event?.slug || null,
      eventStartAt: event?.start_at || null,
      venueName: venue?.name || null,
      ticketTypeName: ticketType?.name || null,
    };
  });

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white md:px-6 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <div className="inline-flex rounded-full border border-[#A259FF]/25 bg-[#A259FF]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#eadcff]">
            Ticket Wallet
          </div>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">Your official EVNTSZN tickets</h1>
          <p className="mt-4 text-base leading-7 text-white/62">
            Every pass stays in one place with live entry status, event details, and secure scan access.
          </p>
        </div>

        {tickets.length ? (
          <div className="mt-8 grid gap-6">
            {tickets.map((ticket) => (
              <OfficialTicketPass
                key={ticket.id}
                eventName={ticket.eventName}
                eventSlug={ticket.eventSlug}
                eventStartAt={ticket.eventStartAt}
                venueName={ticket.venueName}
                holderName={ticket.holderName}
                ticketCode={ticket.ticketCode}
                ticketTypeName={ticket.ticketTypeName}
                status={ticket.status}
                checkedInAt={ticket.checkedInAt}
              />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-[32px] border border-dashed border-white/12 bg-white/[0.03] p-8 text-white/62">
            <p className="text-lg font-semibold text-white">No tickets yet.</p>
            <p className="mt-3 text-sm leading-6">
              {isFounderOverride
                ? "Founder override is active. Member-issued tickets appear here for standard attendee accounts."
                : "Once you check out on an EVNTSZN event, your official ticket will appear here automatically."}
            </p>
            <Link
              href="/events"
              className="mt-5 inline-flex rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white hover:text-black"
            >
              Browse events
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
