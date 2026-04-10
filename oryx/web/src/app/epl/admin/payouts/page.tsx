import { requireAdminPermission } from "@/lib/admin-auth";
import PayoutsAdminClient from "./PayoutsAdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPayoutsPage() {
  await requireAdminPermission("admin.manage", "/epl/admin/payouts");
  return <PayoutsAdminClient />;
}
