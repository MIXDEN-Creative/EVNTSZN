import { supabaseAdmin } from "@/lib/supabase-admin";

export type SystemLogRow = {
  id: string;
  source: string;
  severity: "info" | "warning" | "error" | "critical";
  code: string | null;
  status: "open" | "monitoring" | "resolved";
  message: string;
  context: Record<string, unknown> | null;
  occurred_at: string;
  updated_at?: string;
  resolved_at?: string | null;
};

let systemLogAvailable: boolean | null = null;

export async function hasSystemLogLedger() {
  if (systemLogAvailable !== null) return systemLogAvailable;
  const { error } = await supabaseAdmin.from("evntszn_system_logs").select("id").limit(1);
  systemLogAvailable = !error;
  return systemLogAvailable;
}

export async function listSystemLogEntries(sources: string[], limit = 200) {
  if (!(await hasSystemLogLedger())) return [];
  const { data, error } = await supabaseAdmin
    .from("evntszn_system_logs")
    .select("id, source, severity, code, status, message, context, occurred_at, updated_at, resolved_at")
    .in("source", sources)
    .order("occurred_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data || []) as SystemLogRow[];
}

export async function createSystemLogEntry(input: {
  source: string;
  severity?: "info" | "warning" | "error" | "critical";
  code?: string | null;
  status?: "open" | "monitoring" | "resolved";
  message: string;
  context?: Record<string, unknown>;
  occurredAt?: string;
  resolvedAt?: string | null;
}) {
  if (!(await hasSystemLogLedger())) {
    throw new Error("System log ledger is unavailable.");
  }

  const { data, error } = await supabaseAdmin
    .from("evntszn_system_logs")
    .insert({
      source: input.source,
      severity: input.severity || "info",
      code: input.code || null,
      status: input.status || "open",
      message: input.message,
      context: input.context || {},
      occurred_at: input.occurredAt || new Date().toISOString(),
      resolved_at: input.resolvedAt || null,
    })
    .select("id, source, severity, code, status, message, context, occurred_at, updated_at, resolved_at")
    .single();

  if (error || !data) throw new Error(error?.message || "Could not create system log entry.");
  return data as SystemLogRow;
}

export async function updateSystemLogEntry(
  id: string,
  input: {
    severity?: "info" | "warning" | "error" | "critical";
    status?: "open" | "monitoring" | "resolved";
    message?: string;
    context?: Record<string, unknown>;
    resolvedAt?: string | null;
  },
) {
  if (!(await hasSystemLogLedger())) {
    throw new Error("System log ledger is unavailable.");
  }

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("evntszn_system_logs")
    .select("id, context")
    .eq("id", id)
    .maybeSingle();

  if (existingError || !existing) {
    throw new Error(existingError?.message || "System log entry not found.");
  }

  const nextContext = input.context
    ? {
        ...((existing.context && typeof existing.context === "object" && !Array.isArray(existing.context))
          ? (existing.context as Record<string, unknown>)
          : {}),
        ...input.context,
      }
    : existing.context;

  const { error } = await supabaseAdmin
    .from("evntszn_system_logs")
    .update({
      severity: input.severity,
      status: input.status,
      message: input.message,
      context: nextContext,
      resolved_at: input.resolvedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
}
