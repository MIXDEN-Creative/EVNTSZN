"use client";

import { useEffect, useState } from "react";
import type { MessageThreadListItem, ThreadMessage } from "@/lib/messaging";

type MessagingClientProps = {
  scope: "public" | "internal";
  initialThreads: MessageThreadListItem[];
  canManage?: boolean;
  defaultDeskSlug?: string;
};

export default function MessagingClient({
  scope,
  initialThreads,
  canManage = false,
  defaultDeskSlug = "organizer",
}: MessagingClientProps) {
  const [threads, setThreads] = useState(initialThreads);
  const [selectedThreadId, setSelectedThreadId] = useState(initialThreads[0]?.id || "");
  const [selectedThread, setSelectedThread] = useState<MessageThreadListItem | null>(initialThreads[0] || null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [reply, setReply] = useState("");
  const [deskSlug, setDeskSlug] = useState(defaultDeskSlug);
  const [feedback, setFeedback] = useState("");
  const selectedThreadStatus = selectedThread?.status.replace(/_/g, " ") || "No thread selected";
  const openCount = threads.filter((thread) => thread.status === "open").length;
  const activeCount = threads.filter((thread) => thread.status === "in_progress").length;
  const resolvedCount = threads.filter((thread) => ["resolved", "closed"].includes(thread.status)).length;
  const latestUpdate = threads[0]?.updatedAt;

  async function loadThreads() {
    const response = await fetch(`/api/messages/threads?scope=${scope}`, { cache: "no-store" });
    const payload = (await response.json().catch(() => ({}))) as { threads?: MessageThreadListItem[]; error?: string };
    if (!response.ok) {
      throw new Error(payload.error || "Could not load threads.");
    }
    const nextThreads = payload.threads || [];
    setThreads(nextThreads);
    if (!selectedThreadId && nextThreads[0]) {
      setSelectedThreadId(nextThreads[0].id);
      setSelectedThread(nextThreads[0]);
    }
  }

  async function loadThread(threadId: string) {
    const response = await fetch(`/api/messages/threads/${threadId}`, { cache: "no-store" });
    const payload = (await response.json().catch(() => ({}))) as {
      thread?: MessageThreadListItem;
      messages?: ThreadMessage[];
      error?: string;
    };
    if (!response.ok) {
      throw new Error(payload.error || "Could not load thread.");
    }
    setSelectedThread(payload.thread || null);
    setMessages(payload.messages || []);
  }

  useEffect(() => {
    if (!selectedThreadId) return;
    loadThread(selectedThreadId).catch((error) => setFeedback(error.message));
  }, [selectedThreadId]);

  async function createThread(event: React.FormEvent) {
    event.preventDefault();
    setFeedback("");
    try {
      const response = await fetch("/api/messages/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope,
          subject,
          body,
          deskSlug: scope === "internal" ? deskSlug : null,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { threadId?: string; error?: string };
      if (!response.ok || !payload.threadId) {
        throw new Error(payload.error || "Could not create thread.");
      }
      setSubject("");
      setBody("");
      await loadThreads();
      setSelectedThreadId(payload.threadId);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Could not create thread.");
    }
  }

  async function sendReply(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedThreadId || !reply.trim()) return;
    setFeedback("");
    try {
      const response = await fetch(`/api/messages/threads/${selectedThreadId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: reply }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not send message.");
      setReply("");
      await Promise.all([loadThreads(), loadThread(selectedThreadId)]);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Could not send message.");
    }
  }

  async function updateStatus(status: string) {
    if (!selectedThreadId) return;
    setFeedback("");
    try {
      const response = await fetch(`/api/messages/threads/${selectedThreadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not update status.");
      await Promise.all([loadThreads(), loadThread(selectedThreadId)]);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Could not update status.");
    }
  }

  return (
    <div className="ev-dashboard-shell xl:grid-cols-[0.92fr_1.08fr] xl:grid">
      <div className="space-y-6">
        <section className="ev-dashboard-metrics">
          {[
            ["Open", String(openCount), scope === "internal" ? "Needs routing or first response." : "Waiting for an EVNTSZN reply."],
            ["Active", String(activeCount), "Currently being worked by an assigned desk."],
            [
              "Resolved",
              String(resolvedCount),
              latestUpdate ? `Latest movement ${new Date(latestUpdate).toLocaleDateString()}.` : "No recent movement yet.",
            ],
          ].map(([label, value, body]) => (
            <div key={label} className="ev-feature-card">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">{label}</div>
              <div className="mt-3 text-3xl font-black text-white">{value}</div>
              <div className="mt-2 text-sm leading-6 text-white/55">{body}</div>
            </div>
          ))}
        </section>

        <form onSubmit={createThread} className="ev-section-frame">
          <div className="ev-dashboard-hero">
          <div className="ev-section-kicker">{scope === "internal" ? "Internal thread" : "Member thread"}</div>
          <div className="mt-2 text-3xl font-black tracking-[-0.04em] text-white">Start a clean conversation.</div>
          <p className="mt-3 text-sm leading-6 text-white/58">
            {scope === "internal"
              ? "Route the thread into the correct desk immediately so reserve pressure, sponsor requests, venue issues, and EPL ops do not get buried."
              : "Keep event, ticketing, reserve, and account questions in one thread so replies stay attached to the right customer context."}
          </p>
          <div className="mt-6 space-y-4">
          <input className="ev-field" placeholder="Subject" value={subject} onChange={(event) => setSubject(event.target.value)} required />
          {scope === "internal" ? (
            <select value={deskSlug} onChange={(event) => setDeskSlug(event.target.value)} className="ev-field">
              <option value="organizer">Organizer desk</option>
              <option value="reserve">Reserve desk</option>
              <option value="venue">Venue desk</option>
              <option value="partner">Sponsor desk</option>
              <option value="crew">Crew desk</option>
              <option value="epl-ops">EPL ops</option>
            </select>
          ) : null}
          <textarea className="ev-textarea" rows={4} placeholder={scope === "internal" ? "What happened, what matters, and who needs to move next?" : "Share the booking, event, or support detail that needs a reply."} value={body} onChange={(event) => setBody(event.target.value)} required />
          <button type="submit" className="ev-button-primary mt-1">
            Create thread
          </button>
          </div>
          </div>
        </form>

        <section className="ev-section-frame ev-section-frame--muted">
          <div className="ev-dashboard-hero">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="ev-section-kicker">Inbox</div>
              <div className="mt-2 text-2xl font-black tracking-[-0.03em] text-white">{threads.length} active threads</div>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/55">
              {scope === "internal" ? "Desk-routed" : "Member-safe"}
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {threads.map((thread) => (
              <button
                key={thread.id}
                type="button"
                onClick={() => setSelectedThreadId(thread.id)}
                className={`w-full rounded-[24px] border p-4 text-left transition ${
                  selectedThreadId === thread.id ? "border-white bg-white text-black shadow-[0_16px_36px_rgba(0,0,0,0.22)]" : "border-white/10 bg-black/30 text-white hover:border-white/16 hover:bg-white/[0.05]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black uppercase tracking-[0.16em]">{thread.status.replace(/_/g, " ")}</div>
                    <div className="mt-2 text-lg font-bold">{thread.subject}</div>
                    <div className={`mt-2 text-sm ${selectedThreadId === thread.id ? "text-black/70" : "text-white/60"}`}>{thread.preview}</div>
                  </div>
                  <div className={`text-xs ${selectedThreadId === thread.id ? "text-black/55" : "text-white/45"}`}>
                    {new Date(thread.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </button>
            ))}
            {!threads.length ? <div className="ev-empty-state text-sm">No threads yet. Start one above and it will land here immediately.</div> : null}
          </div>
          </div>
        </section>
      </div>

      <section className="ev-section-frame">
        <div className="ev-dashboard-hero">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="ev-section-kicker">{scope === "internal" ? "Internal messaging" : "Public-safe messaging"}</div>
            <div className="mt-2 text-3xl font-black tracking-[-0.04em] text-white">{selectedThread?.subject || "Select a thread"}</div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#caa7ff]">
                {selectedThreadStatus}
              </span>
              {selectedThread?.updatedAt ? (
                <span className="text-xs uppercase tracking-[0.16em] text-white/40">
                  Updated {new Date(selectedThread.updatedAt).toLocaleString()}
                </span>
              ) : null}
            </div>
          </div>
          {canManage && selectedThread ? (
            <div className="flex flex-wrap gap-2">
              {["open", "in_progress", "resolved", "closed"].map((status) => (
                <button key={status} type="button" onClick={() => updateStatus(status)} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/75">
                  {status.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {feedback ? <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/75">{feedback}</div> : null}

        <div className="mt-6 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`ev-message-bubble ${message.isInternal ? "ev-message-bubble--internal" : ""}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-bold text-white">{message.senderLabel}</div>
                <div className="text-xs text-white/45">{new Date(message.createdAt).toLocaleString()}</div>
              </div>
              <div className="mt-3 text-sm leading-7 text-white/72">{message.body}</div>
            </div>
          ))}
          {!selectedThread ? (
            <div className="ev-empty-state text-sm leading-6">
              Pick a thread from the inbox to review the conversation, assign status, and send a reply.
            </div>
          ) : null}
          {selectedThread && !messages.length ? (
            <div className="ev-empty-state text-sm leading-6">
              This thread has been created, but no message history has been recorded yet.
            </div>
          ) : null}
        </div>

        {selectedThread ? (
          <form onSubmit={sendReply} className="mt-6">
            <textarea
              className="ev-textarea"
              rows={4}
              placeholder={scope === "internal" ? "Write the next operational update, decision, or handoff." : "Write a clear reply tied to the booking, event, or support issue."}
              value={reply}
              onChange={(event) => setReply(event.target.value)}
              required
            />
            <button type="submit" className="ev-button-primary mt-4">
              Send reply
            </button>
          </form>
        ) : null}
        </div>
      </section>
    </div>
  );
}
