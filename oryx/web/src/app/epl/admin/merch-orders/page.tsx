import MerchOrdersClient from "./MerchOrdersClient";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdminPermission } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function MerchOrdersPage() {
  await requireAdminPermission("orders.view", "/epl/admin/merch-orders");

  let initialOrders: any[] = [];
  let initialError = "";
  const initialPage = 1;
  const initialPageSize = 20;
  let initialTotal = 0;

  try {
    const { data, error, count } = await supabaseAdmin
      .from("merch_orders")
      .select(
        `
        id,
        created_at,
        customer_name,
        customer_email,
        product_name,
        amount_total,
        quantity,
        status,
        fulfillment_status,
        fulfillment_attempts,
        printful_order_id
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(0, initialPageSize - 1);

    if (error) {
      initialError = error.message;
    } else {
      initialOrders = data || [];
      initialTotal = count || 0;
    }
  } catch (error) {
    initialError =
      error instanceof Error ? error.message : "Failed to load orders";
  }

  return (
    <MerchOrdersClient
      initialOrders={initialOrders}
      initialError={initialError}
      initialPage={initialPage}
      initialPageSize={initialPageSize}
      initialTotal={initialTotal}
    />
  );
}
