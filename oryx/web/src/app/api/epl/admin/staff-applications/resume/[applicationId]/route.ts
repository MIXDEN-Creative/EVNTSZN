import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/epl/supabase-admin";

type RouteProps = {
  params: Promise<{ applicationId: string }>;
};

export async function GET(_: Request, { params }: RouteProps) {
  await requireAdminPermission("admin.manage", "/epl/admin/hiring");
  const { applicationId } = await params;
  const supabase = getSupabaseAdmin();

  const { data: application, error } = await supabase
    .schema("epl")
    .from("staff_applications")
    .select("source_metadata")
    .eq("id", applicationId)
    .maybeSingle();

  if (error || !application) {
    return NextResponse.json({ error: error?.message || "Application not found." }, { status: 404 });
  }

  const sourceMetadata = (application.source_metadata as Record<string, unknown> | null) || null;
  const path = typeof sourceMetadata?.resumeStoragePath === "string" ? sourceMetadata.resumeStoragePath : "";

  if (!path) {
    return NextResponse.json({ error: "No uploaded resume is attached to this application." }, { status: 404 });
  }

  const { data: signed, error: signedError } = await supabase.storage
    .from("epl-staff-resumes")
    .createSignedUrl(path, 60 * 10);

  if (signedError || !signed?.signedUrl) {
    return NextResponse.json({ error: signedError?.message || "Could not create a resume download link." }, { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
