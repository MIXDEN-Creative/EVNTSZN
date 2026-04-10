"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";

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
  const [flashState, setFlashState] = useState<"idle" | "success" | "error">("idle");

  const remainingCount = useMemo(() => Math.max(ticketCapacity - count, 0), [count, ticketCapacity]);

  function triggerFlash(state: "success" | "error") {
    setFlashState(state);
    if (state === "success" && typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate?.(60);
    }
    setTimeout(() => setFlashState("idle"), 750);
  }

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
      triggerFlash("error");
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
      setMessage("Check-in complete.");
      triggerFlash("success");
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : "Check-in failed.");
      triggerFlash("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <AnimatePresence>
        {flashState !== "idle" ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`pointer-events-none fixed inset-0 z-30 ${
              flashState === "success" ? "bg-emerald-500/12" : "bg-red-500/12"
            }`}
          />
        ) : null}
      </AnimatePresence>
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
            <motion.div
              key={count}
              initial={{ scale: 0.95, opacity: 0.8 }}
              animate={{ scale: 1, opacity: 1 }}
              className="rounded-full border border-white/10 px-3 py-2"
            >
              Checked in: {count}
            </motion.div>
            <div className="rounded-full border border-white/10 px-3 py-2">
              Remaining: {remainingCount}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
            <div className="text-[11px] uppercase tracking-[0.24em] text-[#A259FF]">Live Pulse</div>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-3xl border border-white/10 bg-black/40 p-5">
                <div className="text-xs text-white/50">Checked in</div>
                <div className="mt-2 text-4xl font-black">{count}</div>
                <div className="mt-1 text-xs text-white/40">Total guests on-site</div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/40 p-5">
                <div className="text-xs text-white/50">Capacity</div>
                <div className="mt-2 text-4xl font-black">{Math.round((count / ticketCapacity) * 100) || 0}%</div>
                <div className="mt-1 text-xs text-white/40">Of {ticketCapacity} tickets</div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="text-xs font-semibold uppercase tracking-widest text-white/40">Ticket Breakdown</div>
              <div className="grid gap-3">
                {breakdown.map((row) => (
                  <div key={row.id} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                    <div>
                      <div className="font-bold text-white/90">{row.name}</div>
                      <div className="text-xs text-white/50">{row.sold} sold</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-white">{row.checkedIn}</div>
                      <div className="text-[10px] uppercase tracking-tighter text-white/40">On-site</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-5">
          <div className="text-xs uppercase tracking-[0.24em] text-[#A259FF]">Guest Recovery</div>
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
              placeholder="Attendee name, code, or email"
              className="h-14 flex-1 rounded-2xl border border-white/20 bg-black/60 px-5 text-lg text-white outline-none focus:border-[#A259FF]/50"
            />
            <button
              onClick={() => searchTickets()}
              disabled={loading}
              className="rounded-2xl bg-white px-6 font-bold text-black active:scale-95 disabled:opacity-50"
            >
              Search
            </button>
          </div>

          <AnimatePresence mode="wait">
            {message ? (
              <motion.div
                key={message}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className={`mt-4 rounded-2xl border p-4 text-sm ${
                  messageTone === "success"
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-100"
                    : messageTone === "error"
                      ? "border-red-500/20 bg-red-500/10 text-red-100"
                      : "border-white/10 bg-black/40 text-white/72"
                }`}
              >
                {messageTone === "success" ? "Checked in. Guest is good to enter." : message}
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="mt-4 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.18em] text-white/45">
            <span>Results</span>
            <span>{results.length}</span>
          </div>

          <div className="mt-5 grid gap-3">
            {loading && !results.length ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={`skeleton-${index}`} className="animate-pulse rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="h-3 w-24 rounded bg-white/10" />
                  <div className="mt-3 h-5 w-40 rounded bg-white/10" />
                  <div className="mt-2 h-4 w-48 rounded bg-white/10" />
                </div>
              ))
            ) : null}

            {results.map((ticket) => (
              <motion.div
                key={ticket.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl border p-4 ${
                  ticket.status === "checked_in"
                    ? "border-emerald-500/20 bg-emerald-500/10"
                    : "border-white/10 bg-black/30"
                }`}
              >
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
              </motion.div>
            ))}

            {!results.length && !loading ? (
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
