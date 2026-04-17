import { createInternalWorkItem, INTERNAL_DESK_SLUGS } from "@/lib/internal-os";
import { canAccessInternalPulse } from "@/lib/pulse";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  createSystemLogEntry,
  hasSystemLogLedger,
  listSystemLogEntries,
  updateSystemLogEntry,
  type SystemLogRow,
} from "@/lib/system-log-ledger";
import type { getPlatformViewer } from "@/lib/evntszn";

type Viewer = Awaited<ReturnType<typeof getPlatformViewer>>;

type MessageThreadRow = {
  id: string;
  thread_type: "public" | "internal";
  status: "open" | "in_progress" | "resolved" | "closed";
  subject: string;
  created_by_user_id: string | null;
  owner_user_id: string | null;
  assigned_to_user_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type MessageThreadListItem = {
  id: string;
  threadType: "public" | "internal";
  status: string;
  subject: string;
  updatedAt: string;
  preview: string;
  assignedToUserId: string | null;
  isInternal: boolean;
};

export type ThreadMessage = {
  id: string;
  body: string;
  senderLabel: string;
  createdAt: string;
  isInternal: boolean;
};

let messagingTableAvailability: boolean | null = null;

const FALLBACK_THREAD_SOURCE = "messaging_thread";
const FALLBACK_MESSAGE_SOURCE = "messaging_message";

export function canAccessInternalMessaging(viewer: Viewer | null | undefined) {
  return canAccessInternalPulse(viewer);
}

function mapDeskSlug(value: string | null | undefined) {
  switch (value) {
    case "sponsor":
      return INTERNAL_DESK_SLUGS.sponsor;
    case "partner":
      return INTERNAL_DESK_SLUGS.partner;
    case "crew":
      return INTERNAL_DESK_SLUGS.crew;
    case "venue":
      return INTERNAL_DESK_SLUGS.venue;
    case "reserve":
      return INTERNAL_DESK_SLUGS.reserve;
    case "epl-ops":
      return INTERNAL_DESK_SLUGS.eplOps;
    case "host":
      return INTERNAL_DESK_SLUGS.host;
    default:
      return INTERNAL_DESK_SLUGS.organizer;
  }
}

async function hasMessagingTables() {
  if (messagingTableAvailability !== null) {
    return messagingTableAvailability;
  }

  const { error } = await supabaseAdmin.from("evntszn_message_threads").select("id").limit(1);
  messagingTableAvailability = !error;
  return messagingTableAvailability;
}

function parseSystemLogContext(row: SystemLogRow) {
  return row.context && typeof row.context === "object" && !Array.isArray(row.context)
    ? (row.context as Record<string, unknown>)
    : {};
}

function canViewFallbackThread(
  viewer: Viewer,
  scope: "public" | "internal",
  context: Record<string, unknown>,
  threadId: string,
) {
  const ownerUserId = typeof context.ownerUserId === "string" ? context.ownerUserId : null;
  const participantIds = Array.isArray(context.participantUserIds)
    ? context.participantUserIds.filter((value): value is string => typeof value === "string")
    : [];

  if (scope === "internal") {
    return canAccessInternalMessaging(viewer) && (viewer.isPlatformAdmin || ownerUserId === viewer.user?.id || participantIds.includes(viewer.user?.id || "") || threadId.length > 0);
  }

  return ownerUserId === viewer.user?.id || participantIds.includes(viewer.user?.id || "");
}

async function listFallbackThreads(viewer: Viewer, scope: "public" | "internal") {
  if (!(await hasSystemLogLedger()) || !viewer.user) return [];

  const [threadLogs, messageLogs] = await Promise.all([
    listSystemLogEntries([FALLBACK_THREAD_SOURCE], 200),
    listSystemLogEntries([FALLBACK_MESSAGE_SOURCE], 500),
  ]);

  const latestMessageByThread = new Map<string, SystemLogRow>();
  for (const row of messageLogs) {
    const context = parseSystemLogContext(row);
    const threadId = typeof context.threadId === "string" ? context.threadId : null;
    if (threadId && !latestMessageByThread.has(threadId)) {
      latestMessageByThread.set(threadId, row);
    }
  }

  return threadLogs
    .filter((row) => {
      const context = parseSystemLogContext(row);
      return context.scope === scope && canViewFallbackThread(viewer, scope, context, row.id);
    })
    .map((row) => {
      const context = parseSystemLogContext(row);
      const previewContext = latestMessageByThread.get(row.id) ? parseSystemLogContext(latestMessageByThread.get(row.id)!) : {};
      return {
        id: row.id,
        threadType: scope,
        status: String(context.threadStatus || "open"),
        subject: String(context.subject || row.message),
        updatedAt: row.updated_at || row.occurred_at,
        preview: String(previewContext.body || context.initialBody || "No messages yet."),
        assignedToUserId: typeof context.assignedToUserId === "string" ? context.assignedToUserId : null,
        isInternal: scope === "internal",
      } satisfies MessageThreadListItem;
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

async function getFallbackThreadDetail(viewer: Viewer, threadId: string) {
  if (!(await hasSystemLogLedger()) || !viewer.user) {
    throw new Error("Authentication required.");
  }

  const threadLogs = await listSystemLogEntries([FALLBACK_THREAD_SOURCE], 200);
  const threadLog = threadLogs.find((row) => row.id === threadId);
  if (!threadLog) throw new Error("Thread not found.");

  const context = parseSystemLogContext(threadLog);
  const scope = context.scope === "internal" ? "internal" : "public";
  if (!canViewFallbackThread(viewer, scope, context, threadId)) {
    throw new Error("Forbidden.");
  }

  const messageLogs = await listSystemLogEntries([FALLBACK_MESSAGE_SOURCE], 500);
  const messages = messageLogs
    .filter((row) => parseSystemLogContext(row).threadId === threadId)
    .sort((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime())
    .map((row) => {
      const messageContext = parseSystemLogContext(row);
      return {
        id: row.id,
        body: String(messageContext.body || row.message),
        senderLabel: String(messageContext.senderLabel || "EVNTSZN"),
        createdAt: row.occurred_at,
        isInternal: Boolean(messageContext.isInternal),
      } satisfies ThreadMessage;
    });

  return {
    thread: {
      id: threadLog.id,
      threadType: scope,
      status: String(context.threadStatus || "open"),
      subject: String(context.subject || threadLog.message),
      updatedAt: threadLog.updated_at || threadLog.occurred_at,
      preview: "",
      assignedToUserId: typeof context.assignedToUserId === "string" ? context.assignedToUserId : null,
      isInternal: scope === "internal",
    } satisfies MessageThreadListItem,
    messages,
  };
}

async function createFallbackThread(
  viewer: Viewer,
  input: { scope: "public" | "internal"; subject: string; body: string; deskSlug?: string | null },
) {
  if (!(await hasSystemLogLedger()) || !viewer.user) {
    throw new Error("Authentication required.");
  }

  const ownerLabel =
    viewer.user.user_metadata?.full_name || viewer.profile?.full_name || viewer.user.email || "EVNTSZN";

  const thread = await createSystemLogEntry({
    source: FALLBACK_THREAD_SOURCE,
    severity: input.scope === "internal" ? "warning" : "info",
    status: "open",
    message: input.subject,
    context: {
      scope: input.scope,
      subject: input.subject,
      initialBody: input.body,
      ownerUserId: viewer.user.id,
      participantUserIds: [viewer.user.id],
      assignedToUserId: input.scope === "internal" && viewer.isPlatformAdmin ? viewer.user.id : null,
      deskSlug: input.deskSlug || null,
      threadStatus: "open",
      createdFrom: input.scope === "internal" ? "internal_messaging" : "member_messaging",
    },
  });

  await createSystemLogEntry({
    source: FALLBACK_MESSAGE_SOURCE,
    severity: input.scope === "internal" ? "warning" : "info",
    status: "open",
    message: input.body,
    context: {
      threadId: thread.id,
      scope: input.scope,
      body: input.body,
      senderUserId: viewer.user.id,
      senderLabel: ownerLabel,
      isInternal: input.scope === "internal",
    },
  });

  if (input.scope === "internal") {
    await createInternalWorkItem({
      deskSlug: mapDeskSlug(input.deskSlug),
      title: input.subject,
      description: input.body,
      priority: "medium",
      payload: { source: "internal_messaging", threadId: thread.id, persistence: "system_log" },
    }).catch(() => undefined);
  }

  return thread.id;
}

async function appendFallbackMessage(viewer: Viewer, threadId: string, body: string) {
  const detail = await getFallbackThreadDetail(viewer, threadId);
  await createSystemLogEntry({
    source: FALLBACK_MESSAGE_SOURCE,
    severity: detail.thread.threadType === "internal" ? "warning" : "info",
    status: "open",
    message: body,
    context: {
      threadId,
      scope: detail.thread.threadType,
      body,
      senderUserId: viewer.user?.id || null,
      senderLabel: viewer.user?.user_metadata?.full_name || viewer.profile?.full_name || viewer.user?.email || "EVNTSZN",
      isInternal: detail.thread.threadType === "internal",
    },
  });

  await updateSystemLogEntry(threadId, {
    status: detail.thread.threadType === "internal" ? "monitoring" : "open",
    context: { threadStatus: detail.thread.status === "resolved" ? "in_progress" : detail.thread.status },
  });
}

async function updateFallbackThreadStatus(viewer: Viewer, threadId: string, status: string) {
  if (!viewer.user || !canAccessInternalMessaging(viewer)) {
    throw new Error("Forbidden.");
  }

  const detail = await getFallbackThreadDetail(viewer, threadId);
  if (detail.thread.threadType !== "internal") {
    throw new Error("Forbidden.");
  }

  await updateSystemLogEntry(threadId, {
    status: ["resolved", "closed"].includes(status) ? "resolved" : status === "in_progress" ? "monitoring" : "open",
    context: { threadStatus: status },
    resolvedAt: ["resolved", "closed"].includes(status) ? new Date().toISOString() : null,
  });
}

async function loadParticipants(userId: string | null | undefined) {
  if (!userId) return [];
  const { data, error } = await supabaseAdmin
    .from("evntszn_thread_participants")
    .select("thread_id")
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  return (data || []).map((row) => row.thread_id);
}

export async function listMessageThreads(viewer: Viewer, scope: "public" | "internal") {
  if (!viewer.user) return [];

  const wantsInternal = scope === "internal";
  if (wantsInternal && !canAccessInternalMessaging(viewer)) {
    return [];
  }

  if (!(await hasMessagingTables())) {
    return listFallbackThreads(viewer, scope);
  }

  try {
    const [threadsRes, participantIds] = await Promise.all([
      supabaseAdmin
        .from("evntszn_message_threads")
        .select("*")
        .eq("thread_type", scope)
        .order("updated_at", { ascending: false })
        .limit(100),
      loadParticipants(viewer.user.id),
    ]);

    if (threadsRes.error) throw new Error(threadsRes.error.message);

    const eligibleThreads = ((threadsRes.data || []) as MessageThreadRow[]).filter((thread) => {
      if (viewer.isPlatformAdmin && wantsInternal) return true;
      return (
        thread.created_by_user_id === viewer.user?.id ||
        thread.owner_user_id === viewer.user?.id ||
        participantIds.includes(thread.id)
      );
    });

    const threadIds = eligibleThreads.map((thread) => thread.id);
    if (!threadIds.length) return [];

    const { data: messages, error: messagesError } = await supabaseAdmin
      .from("evntszn_thread_messages")
      .select("id, thread_id, body, sender_label, created_at, is_internal")
      .in("thread_id", threadIds)
      .order("created_at", { ascending: false });

    if (messagesError) throw new Error(messagesError.message);

    const latestByThread = new Map<string, { body: string }>();
    for (const message of messages || []) {
      if (!latestByThread.has(message.thread_id)) {
        latestByThread.set(message.thread_id, { body: message.body });
      }
    }

    return eligibleThreads.map((thread) => ({
      id: thread.id,
      threadType: thread.thread_type,
      status: thread.status,
      subject: thread.subject,
      updatedAt: thread.updated_at,
      preview: latestByThread.get(thread.id)?.body || "No messages yet.",
      assignedToUserId: thread.assigned_to_user_id,
      isInternal: thread.thread_type === "internal",
    }));
  } catch {
    return [];
  }
}

export async function getThreadDetail(viewer: Viewer, threadId: string) {
  if (!viewer.user) {
    throw new Error("Authentication required.");
  }

  if (!(await hasMessagingTables())) {
    return getFallbackThreadDetail(viewer, threadId);
  }

  const { data: thread, error: threadError } = await supabaseAdmin
    .from("evntszn_message_threads")
    .select("*")
    .eq("id", threadId)
    .maybeSingle();

  if (threadError) throw new Error(threadError.message);
  if (!thread) throw new Error("Thread not found.");

  const participantIds = await loadParticipants(viewer.user.id);
  const ownsThread =
    thread.created_by_user_id === viewer.user.id ||
    thread.owner_user_id === viewer.user.id ||
    participantIds.includes(thread.id);

  if (thread.thread_type === "internal") {
    if (!canAccessInternalMessaging(viewer) || (!viewer.isPlatformAdmin && !ownsThread)) {
      throw new Error("Forbidden.");
    }
  } else if (!ownsThread) {
    throw new Error("Forbidden.");
  }

  const { data: messages, error: messagesError } = await supabaseAdmin
    .from("evntszn_thread_messages")
    .select("id, body, sender_label, created_at, is_internal")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (messagesError) throw new Error(messagesError.message);

  return {
    thread: {
      id: thread.id,
      threadType: thread.thread_type,
      status: thread.status,
      subject: thread.subject,
      updatedAt: thread.updated_at,
      preview: "",
      assignedToUserId: thread.assigned_to_user_id,
      isInternal: thread.thread_type === "internal",
    } satisfies MessageThreadListItem,
    messages: ((messages || []) as Array<{ id: string; body: string; sender_label: string | null; created_at: string; is_internal: boolean }>).map(
      (message) => ({
        id: message.id,
        body: message.body,
        senderLabel: message.sender_label || "EVNTSZN",
        createdAt: message.created_at,
        isInternal: message.is_internal,
      }),
    ),
  };
}

export async function createMessageThread(
  viewer: Viewer,
  input: {
    scope: "public" | "internal";
    subject: string;
    body: string;
    deskSlug?: string | null;
  },
) {
  if (!viewer.user) {
    throw new Error("Authentication required.");
  }

  if (input.scope === "internal" && !canAccessInternalMessaging(viewer)) {
    throw new Error("Forbidden.");
  }

  if (!(await hasMessagingTables())) {
    return createFallbackThread(viewer, input);
  }

  const metadata: Record<string, unknown> = {
    deskSlug: input.deskSlug || null,
    createdFrom: input.scope === "internal" ? "internal_messaging" : "member_messaging",
  };

  const { data: thread, error: threadError } = await supabaseAdmin
    .from("evntszn_message_threads")
    .insert({
      thread_type: input.scope,
      status: "open",
      subject: input.subject,
      created_by_user_id: viewer.user.id,
      owner_user_id: viewer.user.id,
      metadata,
    })
    .select("*")
    .single();

  if (threadError) throw new Error(threadError.message);

  const participants = [
    {
      thread_id: thread.id,
      user_id: viewer.user.id,
      role_label: input.scope === "internal" ? "internal_owner" : "member",
      is_internal: input.scope === "internal",
    },
  ];

  const { error: participantError } = await supabaseAdmin.from("evntszn_thread_participants").upsert(participants);
  if (participantError) throw new Error(participantError.message);

  const { error: messageError } = await supabaseAdmin.from("evntszn_thread_messages").insert({
    thread_id: thread.id,
    sender_user_id: viewer.user.id,
    sender_label:
      viewer.user.user_metadata?.full_name || viewer.profile?.full_name || viewer.user.email || "EVNTSZN",
    body: input.body,
    is_internal: input.scope === "internal",
  });
  if (messageError) throw new Error(messageError.message);

  if (input.scope === "internal") {
    await createInternalWorkItem({
      deskSlug: mapDeskSlug(input.deskSlug),
      title: input.subject,
      description: input.body,
      priority: "medium",
      payload: {
        source: "internal_messaging",
        threadId: thread.id,
      },
    }).catch(() => undefined);
  }

  return thread.id;
}

export async function appendMessageToThread(viewer: Viewer, threadId: string, body: string) {
  if (!viewer.user) throw new Error("Authentication required.");
  const detail = await getThreadDetail(viewer, threadId);

  if (!(await hasMessagingTables())) {
    await appendFallbackMessage(viewer, threadId, body);
    return;
  }

  const { error: messageError } = await supabaseAdmin.from("evntszn_thread_messages").insert({
    thread_id: threadId,
    sender_user_id: viewer.user.id,
    sender_label:
      viewer.user.user_metadata?.full_name || viewer.profile?.full_name || viewer.user.email || "EVNTSZN",
    body,
    is_internal: detail.thread.threadType === "internal",
  });
  if (messageError) throw new Error(messageError.message);

  const { error: updateError } = await supabaseAdmin
    .from("evntszn_message_threads")
    .update({
      status: detail.thread.status === "resolved" ? "in_progress" : detail.thread.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", threadId);
  if (updateError) throw new Error(updateError.message);
}

export async function updateThreadStatus(viewer: Viewer, threadId: string, status: string) {
  if (!viewer.user || !canAccessInternalMessaging(viewer)) {
    throw new Error("Forbidden.");
  }

  if (!(await hasMessagingTables())) {
    await updateFallbackThreadStatus(viewer, threadId, status);
    return;
  }

  const { error } = await supabaseAdmin
    .from("evntszn_message_threads")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", threadId)
    .eq("thread_type", "internal");

  if (error) throw new Error(error.message);
}
