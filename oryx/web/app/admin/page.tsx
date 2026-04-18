export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/client";
import { getOperatorProfile } from "@/lib/getOperator";
import { requireAuth, requireOperator, requireFunction } from "@/lib/routeGuard";

export default async function AdminPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  requireAuth(user);

  const operator = await getOperatorProfile(user!.id);

  requireOperator(operator);
  requireFunction(operator, "platform_admin");

  return (
    <div>
      <h1>Admin Dashboard</h1>
    </div>
  );
}
