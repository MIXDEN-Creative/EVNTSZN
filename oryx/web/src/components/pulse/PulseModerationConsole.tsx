"use client";

import { useEffect, useState } from "react";

type ModerationUser = {
  userId: string;
  fullName: string;
  city: string | null;
  roleKey: string | null;
};

type ModeratorRecord = {
  userId: string;
  fullName: string;
  cityScope: string[];
  scopeType: string;
  source: string;
};

type QueueItem = {
  id: string;
  title: string;
  city: string | null;
  moderationState: string;
  createdAt: string;
};

type ActionLog = {
  id: string;
  actionType: string;
  reason: string | null;
  note: string | null;
  createdAt: string;
};

type UserControl = {
  userId: string;
  fullName: string;
  isMuted: boolean;
  isSuspended: boolean;
};

type Context = {
  canModerate: boolean;
  canAssign: boolean;
  canOverride: boolean;
  scopeType: string;
  cityScope: string[];
};

export default function PulseModerationConsole() {
  const [users, setUsers] = useState<ModerationUser[]>([]);
  const [moderators, setModerators] = useState<ModeratorRecord[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [actions, setActions] = useState<ActionLog[]>([]);
  const [controls, setControls] = useState<UserControl[]>([]);
  const [context, setContext] = useState<Context | null>(null);
  const [message, setMessage] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [scopeType, setScopeType] = useState("city");
  const [cityScope, setCityScope] = useState("");
  const [note, setNote] = useState("");

  async function load() {
    const response = await fetch("/api/pulse/moderation", { cache: "no-store" });
    const payload = (await response.json().catch(() => ({}))) as {
      users?: ModerationUser[];
      moderators?: ModeratorRecord[];
      queue?: QueueItem[];
      actions?: ActionLog[];
      controls?: UserControl[];
      context?: Context;
      error?: string;
    };
    if (!response.ok) throw new Error(payload.error || "Could not load moderation console.");
    setUsers(payload.users || []);
    setModerators(payload.moderators || []);
    setQueue(payload.queue || []);
    setActions(payload.actions || []);
    setControls(payload.controls || []);
    setContext(payload.context || null);
    setSelectedUserId((current) => current || payload.users?.[0]?.userId || "");
  }

  useEffect(() => {
    let active = true;

    async function boot() {
      try {
        await load();
      } catch (error) {
        if (active) {
          setMessage(error instanceof Error ? error.message : "Could not load moderation console.");
        }
      }
    }

    void boot();

    return () => {
      active = false;
    };
  }, []);

  async function submit(action: string, payload: Record<string, unknown>) {
    setMessage("");
    const response = await fetch("/api/pulse/moderation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) throw new Error(data.error || "Moderation action failed.");
    await load();
  }

  const selectedUser = users.find((user) => user.userId === selectedUserId) || null;

  return (
    <div className="space-y-6">
      {message ? <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/75">{message}</div> : null}

      <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
        <div className="ev-section-kicker">Moderator authority</div>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-white/45">Scope</div>
            <div className="mt-2 text-lg font-bold text-white">{context?.scopeType || "none"}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-white/45">Assign rights</div>
            <div className="mt-2 text-lg font-bold text-white">{context?.canAssign ? "Yes" : "No"}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-white/45">Override</div>
            <div className="mt-2 text-lg font-bold text-white">{context?.canOverride ? "Yes" : "No"}</div>
          </div>
        </div>
      </section>

      {context?.canAssign ? (
        <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
          <div className="ev-section-kicker">Moderator assignments</div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)} className="ev-field">
              {users.map((user) => (
                <option key={user.userId} value={user.userId}>
                  {user.fullName} {user.city ? `· ${user.city}` : ""}
                </option>
              ))}
            </select>
            <select value={scopeType} onChange={(event) => setScopeType(event.target.value)} className="ev-field">
              <option value="city">City scope</option>
              <option value="custom">Custom scope</option>
              <option value="global">Global</option>
            </select>
            <input className="ev-field" placeholder="City scope, comma separated" value={cityScope} onChange={(event) => setCityScope(event.target.value)} />
            <input className="ev-field" placeholder="Moderator note" value={note} onChange={(event) => setNote(event.target.value)} />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                submit("assign_moderator", {
                  targetUserId: selectedUserId,
                  scopeType,
                  cityScope,
                  note,
                }).catch((error) => setMessage(error.message))
              }
              className="ev-button-primary"
            >
              Assign moderator
            </button>
            <button
              type="button"
              onClick={() =>
                submit("remove_moderator", {
                  targetUserId: selectedUserId,
                  note,
                }).catch((error) => setMessage(error.message))
              }
              className="ev-button-secondary"
            >
              Remove moderator
            </button>
          </div>
          <div className="mt-6 grid gap-3">
            {moderators.map((moderator) => (
              <div key={moderator.userId} className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/72">
                <div className="font-semibold text-white">{moderator.fullName}</div>
                <div className="mt-1">{moderator.source} · {moderator.scopeType}</div>
                <div className="mt-1">{moderator.cityScope.length ? moderator.cityScope.join(", ") : "Global"}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
        <div className="ev-section-kicker">Flagged queue</div>
        <div className="mt-4 space-y-3">
          {queue.map((item) => (
            <div key={item.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-lg font-bold text-white">{item.title}</div>
                  <div className="mt-1 text-sm text-white/55">{item.city || "No city"} · {item.moderationState}</div>
                </div>
                <div className="text-xs text-white/45">{new Date(item.createdAt).toLocaleString()}</div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  ["review_flag", "Review"],
                  ["hide_post", "Hide"],
                  ["remove_post", "Remove"],
                  ["restore_post", "Restore"],
                  ["escalate_post", "Escalate"],
                ].map(([action, label]) => (
                  <button
                    key={action}
                    type="button"
                    onClick={() =>
                      submit(action, {
                        pulsePostId: item.id,
                        reason: `${label} from moderation queue`,
                        note: context?.canOverride ? "Founder/HQ override available." : null,
                      }).catch((error) => setMessage(error.message))
                    }
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/75"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {!queue.length ? <div className="text-sm text-white/60">No flagged Pulse content right now.</div> : null}
        </div>
      </section>

      <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
        <div className="ev-section-kicker">User controls</div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="text-sm font-semibold text-white">{selectedUser?.fullName || "Select a user"}</div>
            <div className="mt-1 text-xs text-white/55">{selectedUser?.city || "No city"} · {selectedUser?.roleKey || "No role"}</div>
          </div>
          <button type="button" onClick={() => submit("mute_user", { targetUserId: selectedUserId, note: "Muted from Pulse interactions." }).catch((error) => setMessage(error.message))} className="ev-button-secondary">
            Mute user
          </button>
          <button type="button" onClick={() => submit("suspend_user", { targetUserId: selectedUserId, note: "Suspended from Pulse posting." }).catch((error) => setMessage(error.message))} className="ev-button-secondary">
            Suspend posting
          </button>
          <button type="button" onClick={() => submit("restore_user", { targetUserId: selectedUserId, note: "Pulse access restored." }).catch((error) => setMessage(error.message))} className="ev-button-secondary">
            Restore access
          </button>
        </div>
        <div className="mt-6 grid gap-3">
          {controls.map((control) => (
            <div key={control.userId} className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/72">
              <div className="font-semibold text-white">{control.fullName}</div>
              <div className="mt-1">Muted: {control.isMuted ? "Yes" : "No"} · Suspended: {control.isSuspended ? "Yes" : "No"}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
        <div className="ev-section-kicker">Audit trail</div>
        <div className="mt-4 space-y-3">
          {actions.map((action) => (
            <div key={action.id} className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/72">
              <div className="font-semibold text-white">{action.actionType.replace(/_/g, " ")}</div>
              <div className="mt-1">{action.reason || "No reason logged."}</div>
              {action.note ? <div className="mt-1 text-white/55">{action.note}</div> : null}
              <div className="mt-1 text-xs text-white/45">{new Date(action.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
