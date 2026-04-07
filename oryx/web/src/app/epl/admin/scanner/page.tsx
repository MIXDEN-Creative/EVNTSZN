import { requireAdminPermission } from "@/lib/admin-auth";
import ScannerAdminClient from "./ScannerAdminClient";

export default async function ScannerAdminPage() {
  await requireAdminPermission("admin.manage", "/epl/admin/scanner");
  return <ScannerAdminClient />;
}
