import { createBrowserClient } from "@supabase/ssr";
import { requireSupabaseRuntimeConfig } from "@/lib/runtime-env";

export function createClient() {
  const config = requireSupabaseRuntimeConfig("public-browser", "supabase.browser");

  return createBrowserClient(
    config.url!,
    config.anonKey!,
  );
}
