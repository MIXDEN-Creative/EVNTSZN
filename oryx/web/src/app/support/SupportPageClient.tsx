"use client";

import { useEffect, useMemo, useState } from "react";

type SupportEvent = {
  id: string;
  title: string;
  city: string | null;
  start_at: string | null;
  slug: string;
};

export default function SupportPageClient({
  signedIn,
  defaultName,
  defaultEmail,
  defaultRole,
}: {
  signedIn: boolean;
  defaultName: string;
  defaultEmail: string;
  defaultRole: string;
}) {
  const [events, setEvents] = useState<SupportEvent[]>([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    name: defaultName,
    email: defaultEmail,
    roleLabelOverride: defaultRole || "guest",
    issueType: "website_issue",
    issueSubtype: "",
    relatedEventId: "",
    relatedOrderCode: "",
    occurredOn: "",
    occurredAtLabel: "",
    severity: "normal",
    description: "",
    pagePath: "",
    pageUrl: "",
    sourceSurface: "",
    referrer: "",
  });

  useEffect(() => {
    async function loadEvents() {
      try {
        const response = await fetch("/api/support/tickets", { cache: "no-store" });
        const json = (await response.json()) as { events?: SupportEvent[] };
        setEvents(json.events || []);
      } catch {
        setEvents([]);
      }
    }

    void loadEvents();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const referrer = document.referrer || "";
    const reportedUrl = referrer || window.location.href;
    let sourceSurface = "web";
    try {
      const reported = new URL(reportedUrl);
      sourceSurface = reported.host.split(".")[0] || "web";
      setForm((current) => ({
        ...current,
        pagePath: `${reported.pathname}${reported.search}`,
        pageUrl: reportedUrl,
        sourceSurface,
        referrer,
      }));
    } catch {
      setForm((current) => ({
        ...current,
        pagePath: window.location.pathname,
        pageUrl: window.location.href,
        sourceSurface: window.location.host.split(".")[0] || "web",
        referrer,
      }));
    }
  }, []);

  const eventOptions = useMemo(
    () =>
      events.map((event) => ({
        value: event.id,
        label: `${event.title}${event.city ? ` • ${event.city}` : ""}`,
      })),
    [events],
  );

  async function submitTicket(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);
    setMessage("");

    const response = await fetch("/api/support/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        roleLabelOverride: form.roleLabelOverride,
        subdomain: typeof window !== "undefined" ? window.location.host : "",
        reportedFrom: form.pageUrl || form.pagePath,
      }),
    });

    const json = (await response.json()) as { error?: string; ticketCode?: string };
    setSending(false);

    if (!response.ok) {
      setMessage(json.error || "Could not send your support request.");
      return;
    }

    setMessage(`Support request submitted. Reference ${json.ticketCode || "created"}.`);
    setForm((current) => ({
      ...current,
      issueSubtype: "",
      relatedEventId: "",
      relatedOrderCode: "",
      occurredOn: "",
      occurredAtLabel: "",
      severity: "normal",
      description: "",
    }));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="ev-panel p-6">
        <div className="ev-section-kicker">Support</div>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-white">Get help without guessing where it goes.</h2>
        <p className="mt-4 text-sm leading-7 text-white/72">
          Use this desk for ticket issues, login trouble, scanner problems, event questions, sponsor requests, staff issues, or anything on the platform that needs attention.
        </p>
        <div className="mt-6 space-y-3 text-sm text-white/65">
          <div>Pick the issue category that best matches what broke or stalled.</div>
          <div>Add the event, route, date, and time if the issue happened during a live flow.</div>
          <div>Signed-in users keep their account context attached automatically.</div>
        </div>
        <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4 text-xs leading-6 text-white/54">
          Route captured: {form.pagePath || "Current page"}<br />
          Source: {form.sourceSurface || "web"}
        </div>
      </section>

      <section className="ev-panel p-6">
        <div className="ev-section-kicker">Open a ticket</div>
        <form onSubmit={submitTicket} className="mt-4 grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <input
              className="ev-field"
              placeholder="Name"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              required={!signedIn}
            />
            <input
              className="ev-field"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              required={!signedIn}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <select className="ev-field" value={form.roleLabelOverride} onChange={(event) => setForm((current) => ({ ...current, roleLabelOverride: event.target.value }))}>
              <option value="guest">I am a guest or supporter</option>
              <option value="player">I am a player</option>
              <option value="attendee">I am an attendee</option>
              <option value="organizer">I am an organizer</option>
              <option value="host">I am an EVNTSZN Curator</option>
              <option value="scanner">I work scanner</option>
              <option value="ops">I work ops</option>
              <option value="sponsor">I am a sponsor</option>
              <option value="staff">I am staff</option>
            </select>
            <select className="ev-field" value={form.issueType} onChange={(event) => setForm((current) => ({ ...current, issueType: event.target.value }))}>
              <option value="website_issue">Website issue</option>
              <option value="scanning_issue">Scanning issue</option>
              <option value="ticket_issue">Ticket issue</option>
              <option value="login_issue">Login issue</option>
              <option value="dashboard_issue">Dashboard issue</option>
              <option value="event_issue">Event issue</option>
              <option value="sponsor_issue">Sponsor issue</option>
              <option value="staffing_issue">Staffing issue</option>
              <option value="office_issue">Office issue</option>
              <option value="payment_issue">Payment issue</option>
              <option value="other">Other</option>
            </select>
            <input
              className="ev-field"
              placeholder="Issue subtype"
              value={form.issueSubtype}
              onChange={(event) => setForm((current) => ({ ...current, issueSubtype: event.target.value }))}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <select className="ev-field" value={form.relatedEventId} onChange={(event) => setForm((current) => ({ ...current, relatedEventId: event.target.value }))}>
              <option value="">Related event if applicable</option>
              {eventOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <input
              className="ev-field"
              placeholder="Order code or ticket reference"
              value={form.relatedOrderCode}
              onChange={(event) => setForm((current) => ({ ...current, relatedOrderCode: event.target.value }))}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <input className="ev-field" type="date" value={form.occurredOn} onChange={(event) => setForm((current) => ({ ...current, occurredOn: event.target.value }))} />
            <input className="ev-field" placeholder="Time happened" value={form.occurredAtLabel} onChange={(event) => setForm((current) => ({ ...current, occurredAtLabel: event.target.value }))} />
            <select className="ev-field" value={form.severity} onChange={(event) => setForm((current) => ({ ...current, severity: event.target.value }))}>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <textarea
            className="ev-textarea"
            rows={6}
            placeholder="Describe what happened, what you expected, where it broke, and what you need next."
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            required
          />

          <button type="submit" className="ev-button-primary" disabled={sending}>
            {sending ? "Sending request..." : "Submit support request"}
          </button>
        </form>

        {message ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/78">{message}</div>
        ) : null}
      </section>
    </div>
  );
}
