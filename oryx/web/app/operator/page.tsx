export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/client";
import { getOperatorProfile } from "@/lib/getOperator";
import { requireAuth, requireOperator } from "@/lib/routeGuard";

export default async function OperatorPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  requireAuth(user);

  const operator = await getOperatorProfile(user!.id);

  requireOperator(operator);

  return (
    <div>
      <h1>Operator Dashboard</h1>
    </div>
  );
}
