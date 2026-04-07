import { requireAdminPermission } from "@/lib/admin-auth";
import ControlCenterClient from "./ControlCenterClient";

export default async function ControlCenterPage() {
  await requireAdminPermission("admin.manage", "/epl/admin/control-center");
  return <ControlCenterClient />;
}
