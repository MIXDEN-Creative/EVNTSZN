"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

type SupportTicket = {
  id: string;
  ticket_code: string;
  name: string | null;
  email: string | null;
  role_label: string | null;
  issue_type: string;
  issue_subtype: string | null;
  source_surface: string | null;
  page_path: string | null;
  page_url: string | null;
  related_order_code: string | null;
  occurred_on: string | null;
  occurred_at_label: string | null;
  linked_city?: string | null;
  linked_office_label?: string | null;
  severity: string;
  status: string;
  description: string;
  resolution_notes?: string | null;
  assignee_user_id: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  evntszn_events?: { id: string; title: string; slug: string; city: string | null } | null;
};

type SupportUpdate = {
  id: string;
  ticket_id: string;
  update_type: string;
  status_to: string | null;
  assignee_user_id: string | null;
  assignee_name: string | null;
  note_body: string | null;
  created_at: string;
  author_name: string | null;
};

type Assignee = {
  user_id: string;
  full_name: string;
  city: string | null;
  roles: string[];
};

const queueTabs = [
  { key: "open_now", label: "Open", statuses: ["open", "escalated"] },
  { key: "in_progress", label: "In progress", statuses: ["in_progress"] },
  { key: "waiting", label: "Waiting", statuses: ["waiting"] },
  { key: "resolved", label: "Resolved", statuses: ["resolved"] },
  { key: "archived", label: "Archived", statuses: ["closed"] },
] as const;

type EventOption = {
  id: string;
  title: string;
  city: string | null;
  slug: string;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

export default function SupportDeskClient() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [updates, setUpdates] = useState<SupportUpdate[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"neutral" | "success" | "error">("neutral");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [queueFilter, setQueueFilter] = useState<string>("open_now");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");
  const [internalNote, setInternalNote] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");

  async function load() {
    const res = await fetch("/api/admin/support-tickets", { cache: "no-store" });
    const json = (await res.json()) as {
      tickets?: SupportTicket[];
      updates?: SupportUpdate[];
      assignees?: Assignee[];
      events?: EventOption[];
      error?: string;
    };

    if (!res.ok) {
      setMessageTone("error");
      setMessage(json.error || "Could not load support tickets.");
      return;
    }

    setTickets(json.tickets || []);
    setUpdates(json.updates || []);
    setAssignees(json.assignees || []);
    setEvents(json.events || []);
    if (!selectedId && json.tickets?.[0]?.id) setSelectedId(json.tickets[0].id);
  }

  useEffect(() => {
    load();
  }, []);

  const filteredTickets = useMemo(
    () =>
      tickets.filter((ticket) => {
        const queue = queueTabs.find((tab) => tab.key === queueFilter);
        if (queue && !queue.statuses.some((status) => status === ticket.status)) return false;
        if (statusFilter !== "all" && ticket.status !== statusFilter) return false;
        if (severityFilter !== "all" && ticket.severity !== severityFilter) return false;
        if (typeFilter !== "all" && ticket.issue_type !== typeFilter) return false;
        if (assigneeFilter !== "all" && (ticket.assignee_user_id || "") !== assigneeFilter) return false;
        if (eventFilter !== "all" && (ticket.evntszn_events?.id || "") !== eventFilter) return false;
        return true;
      }),
    [assigneeFilter, eventFilter, queueFilter, severityFilter, statusFilter, tickets, typeFilter],
  );

  useEffect(() => {
    if (!filteredTickets.length) {
      setSelectedId(null);
      return;
    }

    if (!selectedId || !filteredTickets.some((ticket) => ticket.id === selectedId)) {
      setSelectedId(filteredTickets[0].id);
    }
  }, [filteredTickets, selectedId]);

  const selectedTicket = filteredTickets.find((ticket) => ticket.id === selectedId) || tickets.find((ticket) => ticket.id === selectedId) || null;
  const selectedUpdates = updates.filter((update) => update.ticket_id === selectedTicket?.id);

  useEffect(() => {
    setResolutionNotes(selectedTicket?.resolution_notes || "");
  }, [selectedTicket?.id, selectedTicket?.resolution_notes]);

  async function updateTicket(payload: { status?: string; assigneeUserId?: string | null; internalNote?: string; severity?: string; resolutionNotes?: string }) {
    if (!selectedTicket) return;

    const response = await fetch(`/api/admin/support-tickets/${selectedTicket.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessageTone("error");
      setMessage(json.error || "Could not update support ticket.");
      return;
    }

    setMessageTone("success");
    setMessage("Support ticket updated.");
    setInternalNote("");
    if (payload.resolutionNotes) setResolutionNotes(payload.resolutionNotes);
    await load();
  }

  return (
    <main className="mx-auto max-w-7xl">
      <section className="ev-shell-hero">
        <div className="ev-shell-hero-grid">
          <div>
            <div className="ev-kicker">Support desk</div>
            <h1 className="ev-title">Review support tickets, assign owners, and close the loop.</h1>
            <p className="ev-subtitle">
              Work the live queue by status, owner, severity, event, and location. Support stays separate from system-health logging so operators can move requests instead of hunting through noise.
            </p>
          </div>
        </div>
      </section>

      <AnimatePresence mode="wait">
        {message ? (
          <motion.div
            key={message}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`mt-4 rounded-2xl border p-4 text-sm ${
              messageTone === "error"
                ? "border-red-400/20 bg-red-500/10 text-red-100"
                : messageTone === "success"
                  ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
                  : "border-white/10 bg-black/30 text-white/75"
            }`}
          >
            {message}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="mt-6 grid gap-6 xl:grid-cols-[340px_1fr]">
        <section className="ev-panel p-5">
          <div className="ev-section-kicker">Queue</div>
          <div className="mt-4 flex flex-wrap gap-2">
            {queueTabs.map((tab) => {
              const count = tickets.filter((ticket) => tab.statuses.some((status) => status === ticket.status)).length;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setQueueFilter(tab.key)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    queueFilter === tab.key ? "bg-[#A259FF] text-white" : "border border-white/10 bg-black/30 text-white/72"
                  }`}
                >
                  {tab.label} <span className="ml-1 text-white/55">{count}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="text-xs uppercase tracking-[0.22em] text-white/45">Open now</div>
              <div className="mt-2 text-2xl font-black text-white">
                {tickets.filter((ticket) => ["open", "waiting", "in_progress", "escalated"].includes(ticket.status)).length}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="text-xs uppercase tracking-[0.22em] text-white/45">Escalated</div>
              <div className="mt-2 text-2xl font-black text-white">
                {tickets.filter((ticket) => ticket.status === "escalated").length}
              </div>
            </div>
          </div>
          <div className="mt-4 grid gap-3">
            <select className="ev-field" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="waiting">Waiting</option>
              <option value="in_progress">In progress</option>
              <option value="escalated">Escalated</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <select className="ev-field" value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)}>
              <option value="all">All severities</option>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            <select className="ev-field" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              <option value="all">All issue types</option>
              {Array.from(new Set(tickets.map((ticket) => ticket.issue_type))).map((value) => (
                <option key={value} value={value}>
                  {value.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            <select className="ev-field" value={assigneeFilter} onChange={(event) => setAssigneeFilter(event.target.value)}>
              <option value="all">All assignees</option>
              {assignees.map((assignee) => (
                <option key={assignee.user_id} value={assignee.user_id}>
                  {assignee.full_name}
                </option>
              ))}
            </select>
            <select className="ev-field" value={eventFilter} onChange={(event) => setEventFilter(event.target.value)}>
              <option value="all">All events</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 space-y-3">
            {!tickets.length ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div key={`support-skeleton-${index}`} className="animate-pulse rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="h-3 w-24 rounded bg-white/10" />
                  <div className="mt-3 h-5 w-40 rounded bg-white/10" />
                  <div className="mt-2 h-4 w-56 rounded bg-white/10" />
                </div>
              ))
            ) : filteredTickets.length ? (
              filteredTickets.map((ticket) => (
                <motion.button
                  key={ticket.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  type="button"
                  onClick={() => setSelectedId(ticket.id)}
                  className={`w-full rounded-2xl border p-4 text-left ${
                    selectedId === ticket.id ? "border-[#A259FF]/40 bg-[#A259FF]/10" : "border-white/10 bg-black/30"
                  }`}
                >
                  <div className="text-xs uppercase tracking-[0.22em] text-[#caa7ff]">{ticket.ticket_code}</div>
                  <div className="mt-2 text-base font-semibold text-white">{ticket.issue_type.replace(/_/g, " ")}</div>
                  <div className="mt-1 text-sm text-white/58">{ticket.name || ticket.email || "Unknown requester"}</div>
                  <div className="mt-2 text-xs text-white/50">
                    {[
                      ticket.status,
                      ticket.severity,
                      ticket.assignee_user_id ? "assigned" : "unassigned",
                      ticket.linked_city || ticket.evntszn_events?.city,
                      formatDate(ticket.created_at),
                    ]
                      .filter(Boolean)
                      .join(" • ")}
                  </div>
                  <div className="mt-2 text-xs text-white/42">
                    {[ticket.evntszn_events?.title, ticket.linked_office_label].filter(Boolean).join(" • ") || "No event or office linked"}
                  </div>
                </motion.button>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 text-sm text-white/48">
                No support tickets match the current filters.
              </div>
            )}
          </div>
        </section>

        <section className="ev-panel p-6">
          {selectedTicket ? (
            <>
              <div className="ev-section-kicker">Ticket detail</div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold text-white">{selectedTicket.ticket_code}</h2>
                <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-[#caa7ff]">{selectedTicket.status}</span>
                <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white/60">{selectedTicket.severity}</span>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4"><div className="text-xs uppercase tracking-[0.22em] text-white/45">Requester</div><div className="mt-2 text-sm text-white">{selectedTicket.name || "Unknown"}</div><div className="text-sm text-white/58">{selectedTicket.email || "No email"}</div></div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4"><div className="text-xs uppercase tracking-[0.22em] text-white/45">Context</div><div className="mt-2 text-sm text-white">{selectedTicket.role_label || "guest"}</div><div className="text-sm text-white/58">{selectedTicket.source_surface || "web"} {selectedTicket.page_path ? `• ${selectedTicket.page_path}` : ""}</div></div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4"><div className="text-xs uppercase tracking-[0.22em] text-white/45">Event + location</div><div className="mt-2 text-sm text-white">{selectedTicket.evntszn_events?.title || "Not linked"}</div><div className="text-sm text-white/58">{[selectedTicket.evntszn_events?.city, selectedTicket.linked_city, selectedTicket.linked_office_label, selectedTicket.related_order_code].filter(Boolean).join(" • ") || "—"}</div></div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4"><div className="text-xs uppercase tracking-[0.22em] text-white/45">Happened</div><div className="mt-2 text-sm text-white">{selectedTicket.occurred_on || "Not provided"}</div><div className="text-sm text-white/58">{selectedTicket.occurred_at_label || "—"}</div></div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4"><div className="text-xs uppercase tracking-[0.22em] text-white/45">Assignment</div><div className="mt-2 text-sm text-white">{assignees.find((assignee) => assignee.user_id === selectedTicket.assignee_user_id)?.full_name || "Unassigned"}</div><div className="text-sm text-white/58">{selectedTicket.resolved_at ? `Resolved ${formatDate(selectedTicket.resolved_at)}` : `Updated ${formatDate(selectedTicket.updated_at)}`}</div></div>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="text-xs uppercase tracking-[0.22em] text-white/45">Description</div>
                <div className="mt-3 text-sm leading-7 text-white/78">{selectedTicket.description}</div>
              </div>

              {selectedTicket.resolution_notes ? (
                <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-emerald-200/80">Resolution notes</div>
                  <div className="mt-3 text-sm leading-7 text-emerald-50">{selectedTicket.resolution_notes}</div>
                </div>
              ) : null}

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <select className="ev-field" defaultValue={selectedTicket.status} onChange={(event) => updateTicket({ status: event.target.value })}>
                  <option value="open">Open</option>
                  <option value="waiting">Waiting</option>
                  <option value="in_progress">In progress</option>
                  <option value="escalated">Escalated</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <select className="ev-field" defaultValue={selectedTicket.severity} onChange={(event) => updateTicket({ severity: event.target.value })}>
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
                <select className="ev-field" value={selectedTicket.assignee_user_id || ""} onChange={(event) => updateTicket({ assigneeUserId: event.target.value || null })}>
                  <option value="">Unassigned</option>
                  {assignees.map((assignee) => (
                    <option key={assignee.user_id} value={assignee.user_id}>
                      {assignee.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="text-xs uppercase tracking-[0.22em] text-white/45">Internal notes</div>
                <textarea
                  className="ev-textarea mt-3"
                  rows={4}
                  placeholder="Add internal note"
                  value={internalNote}
                  onChange={(event) => setInternalNote(event.target.value)}
                />
                <div className="mt-3 flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="ev-button-primary"
                    disabled={!internalNote.trim()}
                    onClick={() => updateTicket({ internalNote: internalNote.trim() })}
                  >
                    Save note
                  </button>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="text-xs uppercase tracking-[0.22em] text-white/45">Resolution</div>
                <textarea
                  className="ev-textarea mt-3"
                  rows={4}
                  placeholder="Add resolution notes when the ticket is closed or resolved"
                  value={resolutionNotes}
                  onChange={(event) => setResolutionNotes(event.target.value)}
                />
                <div className="mt-3 flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="ev-button-secondary"
                    disabled={!resolutionNotes.trim()}
                    onClick={() => updateTicket({ resolutionNotes: resolutionNotes.trim(), status: selectedTicket.status === "closed" ? "closed" : "resolved" })}
                  >
                    Save resolution
                  </button>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="text-xs uppercase tracking-[0.22em] text-white/45">Activity</div>
                <div className="mt-4 space-y-3">
                  {selectedUpdates.length ? (
                    selectedUpdates.map((update) => (
                      <div key={update.id} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.18em] text-white/45">
                          <span>{update.update_type.replace(/_/g, " ")}</span>
                          <span>{formatDate(update.created_at)}</span>
                        </div>
                        <div className="mt-2 text-sm text-white/78">
                          {[update.author_name, update.assignee_name ? `assigned to ${update.assignee_name}` : null, update.status_to ? `status ${update.status_to}` : null]
                            .filter(Boolean)
                            .join(" • ")}
                        </div>
                        {update.note_body ? <div className="mt-2 text-sm leading-6 text-white/64">{update.note_body}</div> : null}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-white/50">
                      No internal updates yet.
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-sm text-white/48">
              Pick a ticket from the queue to review, assign, or resolve it.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
