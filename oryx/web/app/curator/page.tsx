export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/client";
import { getOperatorProfile } from "@/lib/getOperator";
import { requireAuth, requireOperator, requireFunction } from "@/lib/routeGuard";

export default async function CuratorPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  requireAuth(user);

  const operator = await getOperatorProfile(user!.id);

  requireOperator(operator);
  requireFunction(operator, "event_creation");

  return (
    <div>
      <h1>Curator Dashboard</h1>
    </div>
  );
}
