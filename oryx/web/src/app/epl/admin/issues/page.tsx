import { requireAdminPermission } from "@/lib/admin-auth";
import IssuesAdminClient from "./IssuesAdminClient";

export default async function IssuesPage() {
  await requireAdminPermission("admin.manage", "/epl/admin/issues");
  return <IssuesAdminClient />;
}
