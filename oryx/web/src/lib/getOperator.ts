import { createClient } from "@/lib/supabase/client";

export async function getOperatorProfile(userId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("evntszn_operator_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) return null;

  return data;
}
