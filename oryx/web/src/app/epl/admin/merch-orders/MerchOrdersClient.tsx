"use client";

import { useState } from "react";

type Order = {
  id: string;
  created_at: string;
  customer_name: string | null;
  customer_email: string | null;
  product_name: string | null;
  amount_total: number | null;
  quantity: number | null;
  status: string | null;
  fulfillment_status: string | null;
  fulfillment_attempts: number | null;
  printful_order_id: number | null;
};

type Props = {
  initialOrders: Order[];
  initialError?: string;
  initialPage: number;
  initialPageSize: number;
  initialTotal: number;
};

export default function MerchOrdersClient({
  initialOrders,
  initialError = "",
  initialPage,
  initialPageSize,
  initialTotal,
}: Props) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [status, setStatus] = useState("");
  const [fulfillmentStatus, setFulfillmentStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(initialError);
  const [page, setPage] = useState(initialPage);
  const [pageSize] = useState(initialPageSize);
  const [total, setTotal] = useState(initialTotal);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailOrder, setDetailOrder] = useState<any>(null);

  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  async function loadOrders(nextPage = page, nextStatus = status, nextFulfillmentStatus = fulfillmentStatus) {
    setLoading(true);
    setErrorMessage("");

    try {
      const params = new URLSearchParams();
      params.set("page", String(nextPage));
      params.set("pageSize", String(pageSize));
      if (nextStatus) params.set("status", nextStatus);
      if (nextFulfillmentStatus) params.set("fulfillment_status", nextFulfillmentStatus);

      const res = await fetch(`/api/admin/merch-orders?${params.toString()}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to load orders");

      setOrders(data.orders || []);
      setPage(data.page || nextPage);
      setTotal(data.total || 0);
    } catch (error) {
      setOrders([]);
      setErrorMessage(error instanceof Error ? error.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  async function openDetail(orderId: string) {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError("");
    setDetailOrder(null);

    try {
      const res = await fetch(`/api/admin/merch-orders/${orderId}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to load order detail");

      setDetailOrder(data.order || null);
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : "Failed to load order detail");
    } finally {
      setDetailLoading(false);
    }
  }

  async function runAction(url: string, orderId: string) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");

      await loadOrders();
      if (detailOpen && detailOrder?.id === orderId) {
        await openDetail(orderId);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Action failed");
    }
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-4xl font-black">Merch Orders</h1>

          <div className="flex gap-3">
            <form action="/account/logout" method="POST">
              <button className="rounded-xl border border-white/15 px-4 py-2 hover:bg-white/10">
                Logout
              </button>
            </form>
            <button
              onClick={() => loadOrders(1)}
              className="rounded-xl border border-white/15 px-4 py-2 hover:bg-white/10"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <select
            value={status}
            onChange={async (e) => {
              const v = e.target.value;
              setStatus(v);
              await loadOrders(1, v, fulfillmentStatus);
            }}
            className="rounded-xl border border-white/10 bg-[#111] px-4 py-3"
          >
            <option value="">All payment statuses</option>
            <option value="paid">Paid</option>
            <option value="refunded">Refunded</option>
            <option value="canceled">Canceled</option>
          </select>

          <select
            value={fulfillmentStatus}
            onChange={async (e) => {
              const v = e.target.value;
              setFulfillmentStatus(v);
              await loadOrders(1, status, v);
            }}
            className="rounded-xl border border-white/10 bg-[#111] px-4 py-3"
          >
            <option value="">All fulfillment statuses</option>
            <option value="not_sent">Not Sent</option>
            <option value="sending">Sending</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>

        {loading ? (
          <div className="text-white/60">Refreshing orders...</div>
        ) : errorMessage ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-200">
            {errorMessage}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-white/50">No merch orders found.</div>
        ) : (
          <>
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="text-sm uppercase tracking-[0.2em] text-[#A259FF]">
                        {order.status || "unknown"} • {order.fulfillment_status || "unknown"}
                      </div>
                      <h2 className="mt-2 text-xl font-bold">
                        {order.product_name || "Unnamed product"}
                      </h2>
                      <p className="mt-1 text-white/70">{order.customer_name || "No customer name"}</p>
                      <p className="text-white/50">{order.customer_email || "No email"}</p>
                      <div className="mt-3 grid gap-1 text-sm text-white/60">
                        <div>Qty: {order.quantity ?? 1}</div>
                        <div>Total: ${(((order.amount_total ?? 0) / 100)).toFixed(2)}</div>
                        <div>Printful Order ID: {order.printful_order_id ?? "Not assigned"}</div>
                        <div>Fulfillment Attempts: {order.fulfillment_attempts ?? 0}</div>
                        <div>
                          Created: {order.created_at ? new Date(order.created_at).toLocaleString() : "Unknown"}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => openDetail(order.id)}
                        className="rounded-xl border border-white/15 px-4 py-2 hover:bg-white/10"
                      >
                        View
                      </button>
                      <button
                        onClick={() => runAction("/api/admin/merch-orders/resend", order.id)}
                        className="rounded-xl border border-white/15 px-4 py-2 hover:bg-white/10"
                      >
                        Resend
                      </button>
                      <button
                        onClick={() => runAction("/api/admin/merch-orders/refund", order.id)}
                        className="rounded-xl border border-yellow-500/30 px-4 py-2 text-yellow-300 hover:bg-yellow-500/10"
                      >
                        Refund
                      </button>
                      <button
                        onClick={() => runAction("/api/admin/merch-orders/cancel", order.id)}
                        className="rounded-xl border border-red-500/30 px-4 py-2 text-red-300 hover:bg-red-500/10"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-white/60">
                Page {page} of {totalPages} • {total} total orders
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => loadOrders(Math.max(page - 1, 1))}
                  disabled={page <= 1 || loading}
                  className="rounded-xl border border-white/15 px-4 py-2 hover:bg-white/10 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => loadOrders(Math.min(page + 1, totalPages))}
                  disabled={page >= totalPages || loading}
                  className="rounded-xl border border-white/15 px-4 py-2 hover:bg-white/10 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {detailOpen ? (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-black/60"
            onClick={() => setDetailOpen(false)}
          />
          <div className="w-full max-w-2xl overflow-y-auto border-l border-white/10 bg-[#0b0b0c] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-black">Order Detail</h2>
              <button
                onClick={() => setDetailOpen(false)}
                className="rounded-xl border border-white/15 px-4 py-2 hover:bg-white/10"
              >
                Close
              </button>
            </div>

            {detailLoading ? (
              <div className="text-white/60">Loading order detail...</div>
            ) : detailError ? (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-200">
                {detailError}
              </div>
            ) : detailOrder ? (
              <div className="space-y-6">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-sm uppercase tracking-[0.2em] text-[#A259FF]">
                    {detailOrder.status} • {detailOrder.fulfillment_status}
                  </div>
                  <h3 className="mt-2 text-xl font-bold">{detailOrder.product_name}</h3>
                  <div className="mt-3 grid gap-2 text-sm text-white/70">
                    <div>Customer: {detailOrder.customer_name}</div>
                    <div>Email: {detailOrder.customer_email}</div>
                    <div>Stripe Session: {detailOrder.stripe_session_id || "N/A"}</div>
                    <div>Payment Intent: {detailOrder.stripe_payment_intent_id || "N/A"}</div>
                    <div>Printful Order ID: {detailOrder.printful_order_id || "N/A"}</div>
                    <div>Quantity: {detailOrder.quantity}</div>
                    <div>Base Amount: ${(((detailOrder.base_amount ?? 0) / 100)).toFixed(2)}</div>
                    <div>Markup Amount: ${(((detailOrder.markup_amount ?? 0) / 100)).toFixed(2)}</div>
                    <div>Total: ${(((detailOrder.amount_total ?? 0) / 100)).toFixed(2)}</div>
                    <div>Email Sent: {detailOrder.email_sent ? "Yes" : "No"}</div>
                    <div>Attempts: {detailOrder.fulfillment_attempts ?? 0}</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <h4 className="text-lg font-bold">Shipping</h4>
                  <div className="mt-3 grid gap-2 text-sm text-white/70">
                    <div>{detailOrder.recipient_name || "N/A"}</div>
                    <div>{detailOrder.address1 || ""}</div>
                    <div>{detailOrder.address2 || ""}</div>
                    <div>
                      {[detailOrder.city, detailOrder.state_code, detailOrder.zip]
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                    <div>{detailOrder.country_code || ""}</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <h4 className="text-lg font-bold">Notes</h4>
                  <div className="mt-3 text-sm text-white/70 whitespace-pre-wrap">
                    {detailOrder.notes || "No notes"}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-white/60">No detail found.</div>
            )}
          </div>
        </div>
      ) : null}
    </main>
  );
}
