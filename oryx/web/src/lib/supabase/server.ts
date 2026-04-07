import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireSupabaseRuntimeConfig } from "@/lib/runtime-env";

export async function createClient() {
  const cookieStore = await cookies();
  const config = requireSupabaseRuntimeConfig("server-auth", "supabase.server");

  return createServerClient(
    config.url!,
    config.anonKey!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server components may not always be able to write cookies.
          }
        },
      },
    }
  );
}
