import ReserveDeskClient from "@/components/admin/ReserveDeskClient";
import { requireAdminPermission } from "@/lib/admin-auth";

export default async function AdminReserveDeskPage() {
  await requireAdminPermission("admin.manage", "/admin/reserve-desk");
  return <ReserveDeskClient />;
}
