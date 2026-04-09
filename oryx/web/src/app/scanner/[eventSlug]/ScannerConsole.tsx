"use client";

import { useState } from "react";

type ScannerResult = {
  id: string;
  attendee_name: string | null;
  attendee_email: string | null;
  ticket_code: string;
  ticket_type_name?: string | null;
  status: string;
  checked_in_at: string | null;
};

type TicketBreakdownRow = {
  id: string;
  name: string;
  sold: number;
  checkedIn: number;
  remainingNotCheckedIn: number;
};

export default function ScannerConsole({
  eventId,
  eventSlug,
  eventTitle,
  checkedInCount,
  ticketCapacity,
  ticketBreakdown,
}: {
  eventId: string;
  eventSlug: string;
  eventTitle: string;
  checkedInCount: number;
  ticketCapacity: number;
  ticketBreakdown: TicketBreakdownRow[];
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ScannerResult[]>([]);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"neutral" | "success" | "error">("neutral");
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(checkedInCount);
  const [statsOpen, setStatsOpen] = useState(false);
  const [breakdown, setBreakdown] = useState(ticketBreakdown);

  async function searchTickets(nextQuery = query) {
    setLoading(true);
    setMessage("");
    setMessageTone("neutral");

    try {
      const res = await fetch(
        `/api/evntszn/events/${eventId}/scanner/search?q=${encodeURIComponent(nextQuery)}`,
        { cache: "no-store" }
      );
      const data = (await res.json()) as Record<string, any>;
      if (!res.ok) throw new Error(data.error || "Search failed.");
      setResults(data.results || []);
      if ((data.results || []).length === 0) {
        setMessage("No matching ticket was found. Try attendee name, ticket code, or email.");
      }
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : "Search failed.");
    } finally {
      setLoading(false);
    }
  }

  async function checkIn(ticketId: string) {
    setLoading(true);
    setMessage("");
    setMessageTone("neutral");

    try {
      const res = await fetch(`/api/evntszn/events/${eventId}/scanner/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId }),
      });
      const data = (await res.json()) as Record<string, any>;
      if (!res.ok) throw new Error(data.error || "Check-in failed.");

      setCount((value) => value + 1);
      setResults((current) =>
        current.map((ticket) =>
          ticket.id === ticketId
            ? { ...ticket, status: "checked_in", checked_in_at: data.checkedInAt }
            : ticket
        )
      );
      const checkedTicket = results.find((ticket) => ticket.id === ticketId);
      if (checkedTicket?.ticket_type_name) {
        setBreakdown((current) =>
          current.map((row) =>
            row.name === checkedTicket.ticket_type_name
              ? {
                  ...row,
                  checkedIn: row.checkedIn + 1,
                  remainingNotCheckedIn: Math.max(row.remainingNotCheckedIn - 1, 0),
                }
              : row,
          ),
        );
      }
      setMessageTone("success");
      setMessage("Ticket checked in.");
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : "Check-in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="sticky top-0 z-20 border-b border-white/10 bg-black/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.24em] text-[#A259FF]">Scanner</div>
            <div className="text-sm font-semibold">{eventTitle}</div>
          </div>
          <div className="flex gap-2 text-xs text-white/70">
            <button
              type="button"
              onClick={() => setStatsOpen((value) => !value)}
              className="rounded-full border border-white/10 px-3 py-2 hover:bg-white/5"
            >
              {statsOpen ? "Hide ticket stats" : "Show ticket stats"}
            </button>
            <div className="rounded-full border border-white/10 px-3 py-2">Checked in: {count}</div>
            <div className="rounded-full border border-white/10 px-3 py-2">
              Remaining: {Math.max(ticketCapacity - count, 0)}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-4">
          {statsOpen ? (
            <div className="mb-4 rounded-[24px] border border-white/10 bg-black/35 p-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-[#A259FF]">Ticket stats</div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {breakdown.map((row) => (
                  <div key={row.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm">
                    <div className="font-semibold text-white">{row.name}</div>
                    <div className="mt-2 text-white/65">Sold: {row.sold}</div>
                    <div className="text-white/65">Checked in: {row.checkedIn}</div>
                    <div className="text-white/65">Waiting: {row.remainingNotCheckedIn}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(162,89,255,0.18),transparent_35%),linear-gradient(180deg,#060606_0%,#000_100%)]">
            <div className="flex min-h-[420px] items-end justify-between p-5">
              <div className="max-w-sm">
                <div className="text-xs uppercase tracking-[0.24em] text-white/45">Camera lane</div>
                <div className="mt-3 text-2xl font-semibold">Fast check-in, clean lane, no wasted motion.</div>
                <p className="mt-3 text-sm text-white/65">
                  Keep the camera lane unobstructed, recover guests through universal search, and hold the entire front-gate experience inside one tight mobile-first surface.
                </p>
              </div>
              <div className="rounded-3xl border border-[#A259FF]/30 bg-[#A259FF]/10 px-4 py-3 text-xs uppercase tracking-[0.22em] text-[#dfd0ff]">
                {eventSlug}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-5">
          <div className="text-xs uppercase tracking-[0.24em] text-[#A259FF]">Universal search</div>
          <div className="mt-2 text-sm text-white/58">Search by ticket code, attendee, or email. Results stay in-line with direct check-in action.</div>
          <div className="mt-4 flex gap-3">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void searchTickets();
                }
              }}
              placeholder="Ticket code, attendee name, or email"
              className="h-12 flex-1 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none"
            />
            <button
              onClick={() => searchTickets()}
              disabled={loading}
              className="rounded-2xl bg-white px-4 py-3 font-semibold text-black disabled:opacity-50"
            >
              Search
            </button>
          </div>

          {message ? (
            <div
              className={`mt-4 rounded-2xl border p-4 text-sm ${
                messageTone === "success"
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-100"
                  : messageTone === "error"
                    ? "border-red-500/20 bg-red-500/10 text-red-100"
                    : "border-white/10 bg-black/40 text-white/72"
              }`}
            >
              {message}
            </div>
          ) : null}

          <div className="mt-4 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.18em] text-white/45">
            <span>Results</span>
            <span>{results.length}</span>
          </div>

          <div className="mt-5 grid gap-3">
            {results.map((ticket) => (
              <div key={ticket.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-white/45">
                      {ticket.status}
                    </div>
                    <div className="mt-2 text-lg font-semibold">
                      {ticket.attendee_name || "Unnamed attendee"}
                    </div>
                    <div className="text-sm text-white/62">{ticket.attendee_email || "No email"}</div>
                    <div className="mt-2 text-sm text-[#A259FF]">{ticket.ticket_code}</div>
                    {ticket.ticket_type_name ? (
                      <div className="mt-2 text-xs uppercase tracking-[0.18em] text-white/45">
                        {ticket.ticket_type_name}
                      </div>
                    ) : null}
                  </div>
                  <button
                    onClick={() => checkIn(ticket.id)}
                    disabled={loading || ticket.status === "checked_in"}
                    className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black disabled:opacity-40"
                  >
                    {ticket.status === "checked_in" ? "Checked in" : "Check in"}
                  </button>
                </div>
              </div>
            ))}

            {!results.length ? (
              <div className="rounded-2xl border border-dashed border-white/15 bg-black/30 p-4 text-sm text-white/52">
                Search results appear here immediately with direct check-in actions and clear ticket status.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
