import { requireAdminPermission } from "@/lib/admin-auth";
import UsersAdminClient from "./UsersAdminClient";

export default async function AdminUsersPage() {
  await requireAdminPermission("admin.manage", "/epl/admin/users");
  return <UsersAdminClient />;
}
