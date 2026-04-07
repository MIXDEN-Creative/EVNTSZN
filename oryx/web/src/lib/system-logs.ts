import { supabaseAdmin } from "@/lib/supabase-admin";

export async function logSystemIssue(input: {
  source: string;
  severity?: "info" | "warning" | "error" | "critical";
  code?: string;
  message: string;
  context?: Record<string, unknown>;
}) {
  try {
    await supabaseAdmin.from("evntszn_system_logs").insert({
      source: input.source,
      severity: input.severity || "error",
      code: input.code || null,
      message: input.message,
      context: input.context || {},
    });
  } catch {
    // Avoid turning monitoring into a user-facing failure path.
  }
}
