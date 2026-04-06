"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/epl/supabase-admin";

async function callRpc(functionName: string, applicationId: string) {
  const supabase = getSupabaseAdmin();
  const args =
    functionName === "approve_epl_application"
      ? { p_application_id: applicationId, p_approved_by: null }
      : { p_application_id: applicationId, p_reviewed_by: null };

  const { error } = await supabase.rpc(functionName, args);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/epl/admin/season-1");
}

export async function approveApplication(formData: FormData) {
  const applicationId = String(formData.get("applicationId") || "");
  await callRpc("approve_epl_application", applicationId);
}

export async function waitlistApplication(formData: FormData) {
  const applicationId = String(formData.get("applicationId") || "");
  await callRpc("waitlist_epl_application", applicationId);
}

export async function declineApplication(formData: FormData) {
  const applicationId = String(formData.get("applicationId") || "");
  await callRpc("decline_epl_application", applicationId);
}
