import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseRuntimeConfig } from "@/lib/runtime-env";

let adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (adminClient) {
    return adminClient;
  }

  const config = requireSupabaseRuntimeConfig("server-admin", "supabase.admin");

  adminClient = createClient(
    config.url!,
    config.serviceRoleKey!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

  return adminClient;
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, property, receiver) {
    const client = getSupabaseAdmin() as unknown as Record<PropertyKey, unknown>;
    const value = Reflect.get(client, property, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
}) as SupabaseClient;
