import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseRuntimeConfig } from "@/lib/runtime-env";

let adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (adminClient) {
    return adminClient;
  }

  const config = requireSupabaseRuntimeConfig("server-admin", "epl.supabase.admin");

  adminClient = createClient(
    config.url!,
    config.serviceRoleKey!,
    {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    },
  );

  return adminClient;
}
