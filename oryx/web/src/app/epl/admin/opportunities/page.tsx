import { requireAdminPermission } from "@/lib/admin-auth";
import OpportunitiesAdminClient from "./OpportunitiesAdminClient";

export default async function AdminOpportunitiesPage() {
  await requireAdminPermission("opportunities.manage", "/epl/admin/opportunities");
  return <OpportunitiesAdminClient />;
}
