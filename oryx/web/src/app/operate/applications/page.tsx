import Link from "next/link";
import SurfaceShell from "@/components/shells/SurfaceShell";
import OperateApplicationsClient from "@/components/admin/OperateApplicationsClient";
import { requireAdminPermission } from "@/lib/admin-auth";
import { estimateSponsorBudgetUsd, estimateStayOpsValueUsd, normalizePipelineStatus } from "@/lib/pipeline-value";
import { supabaseAdmin } from "@/lib/supabase-admin";

type StayOpsApplicationRow = {
  id: string;
  full_name: string | null;
  company_name: string | null;
  city: string | null;
  status: string | null;
  created_at: string | null;
  metadata: {
    serviceTier?: string | null;
    location?: string | null;
    expectedRevenue?: string | null;
    estimatedValueUsd?: number | null;
  } | null;
};

type SponsorInquiryRow = {
  id: string;
  company_name: string | null;
  contact_name: string | null;
  status: string | null;
  created_at: string | null;
  metadata: {
    budgetRange?: string | null;
    targetCity?: string | null;
    estimatedBudgetUsd?: number | null;
  } | null;
};

export default async function OperateApplicationsPage() {
  await requireAdminPermission("admin.manage", "/operate/applications");

  const [stayOpsRes, sponsorRes] = await Promise.all([
    supabaseAdmin
      .from("evntszn_applications")
      .select("id, full_name, company_name, city, status, created_at, metadata")
      .eq("application_type", "stayops_intake")
      .order("created_at", { ascending: false })
      .limit(100),
    supabaseAdmin
      .from("evntszn_sponsor_package_orders")
      .select("id, company_name, contact_name, status, created_at, metadata")
      .eq("order_type", "inquiry")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  if (stayOpsRes.error) {
    throw new Error(stayOpsRes.error.message);
  }
  if (sponsorRes.error) {
    throw new Error(sponsorRes.error.message);
  }

  const stayOpsApplications = (stayOpsRes.data || []) as StayOpsApplicationRow[];
  const sponsorApplications = (sponsorRes.data || []) as SponsorInquiryRow[];

  const stayOpsRows = stayOpsApplications.map((row) => {
    const estimatedValueUsd =
      Number(row.metadata?.estimatedValueUsd || 0) ||
      Number(estimateStayOpsValueUsd(
        String(row.metadata?.expectedRevenue || ""),
        String(row.metadata?.serviceTier || ""),
      ) || 0);

    return {
      id: row.id,
      kind: "stayops" as const,
      name: row.full_name || "Unnamed applicant",
      company: row.company_name,
      valueLabel: row.metadata?.serviceTier ? `${row.metadata.serviceTier}% tier` : "Tier not set",
      estimatedValueUsd,
      city: row.metadata?.location || row.city || "No city",
      status: normalizePipelineStatus(row.status),
      createdAt: row.created_at,
    };
  });

  const sponsorRows = sponsorApplications.map((row) => {
    const estimatedValueUsd =
      Number(row.metadata?.estimatedBudgetUsd || 0) ||
      Number(estimateSponsorBudgetUsd(String(row.metadata?.budgetRange || "")) || 0);

    return {
      id: row.id,
      kind: "sponsor" as const,
      name: row.company_name || row.contact_name || "Unnamed sponsor",
      company: row.contact_name ? `Primary contact: ${row.contact_name}` : null,
      valueLabel: row.metadata?.budgetRange || "Budget not set",
      estimatedValueUsd,
      city: row.metadata?.targetCity || "No city",
      status: normalizePipelineStatus(row.status),
      createdAt: row.created_at,
    };
  });

  return (
    <SurfaceShell
      surface="ops"
      eyebrow="Applications"
      title="StayOps and sponsor intake in one operational list."
      description="This surface pulls the live StayOps applications and sponsor inquiries into one internal view so ops can review commercial and onboarding demand without switching lanes."
      actions={
        <>
          <Link href="/operate" className="ev-button-secondary">
            Back to operate
          </Link>
          <Link href="/sponsors/packages" className="ev-button-secondary">
            Sponsor packages
          </Link>
          <Link href="/stayops" className="ev-button-secondary">
            StayOps
          </Link>
        </>
      }
      meta={
        <>
          <div className="ev-meta-card">
            <div className="ev-meta-label">StayOps applications</div>
            <div className="ev-meta-value">{stayOpsRows.length}</div>
          </div>
          <div className="ev-meta-card">
            <div className="ev-meta-label">Sponsor applications</div>
            <div className="ev-meta-value">{sponsorRows.length}</div>
          </div>
        </>
      }
    >
      <OperateApplicationsClient initialStayOps={stayOpsRows} initialSponsors={sponsorRows} />
    </SurfaceShell>
  );
}
