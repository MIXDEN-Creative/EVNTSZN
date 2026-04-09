import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseRuntimeConfig } from "@/lib/runtime-env";

let publicServerClient: SupabaseClient | null = null;

export function getSupabasePublicServerClient() {
  if (publicServerClient) {
    return publicServerClient;
  }

  const config = requireSupabaseRuntimeConfig("server-auth", "supabase.public-server");

  publicServerClient = createClient(config.url!, config.anonKey!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return publicServerClient;
}

export const supabasePublicServer = new Proxy({} as SupabaseClient, {
  get(_target, property, receiver) {
    const client = getSupabasePublicServerClient() as unknown as Record<PropertyKey, unknown>;
    const value = Reflect.get(client, property, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
}) as SupabaseClient;
