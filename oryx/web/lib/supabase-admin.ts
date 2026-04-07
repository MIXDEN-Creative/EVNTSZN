import { createClient } from "@supabase/supabase-js";
import { requireSupabaseRuntimeConfig } from "@/lib/runtime-env";

const config = requireSupabaseRuntimeConfig("server-admin", "legacy.supabase.admin");

export const supabaseAdmin = createClient(
  config.url!,
  config.serviceRoleKey!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
