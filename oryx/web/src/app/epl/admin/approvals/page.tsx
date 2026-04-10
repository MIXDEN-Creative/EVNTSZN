import { requireAdminPermission } from "@/lib/admin-auth";
import ApprovalsAdminClient from "./ApprovalsAdminClient";

export default async function AdminApprovalsPage() {
  await requireAdminPermission("approvals.manage", "/epl/admin/approvals");
  return <ApprovalsAdminClient />;
}
