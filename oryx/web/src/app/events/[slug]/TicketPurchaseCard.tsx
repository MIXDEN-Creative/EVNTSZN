"use client";

import { useState } from "react";
import { getTicketAvailabilityLabel } from "@/lib/ticketing";

type TicketType = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  quantity_total: number;
  quantity_sold: number;
  max_per_order: number;
  sales_start_at?: string | null;
  sales_end_at?: string | null;
  is_active?: boolean;
  visibility_mode?: "visible" | "hidden";
  availability_state: "active" | "scheduled" | "hidden" | "sold_out" | "ended";
};

type TicketPurchaseCardProps = {
  eventId: string;
  eventTitle: string;
  eventSlug: string;
  ticketTypes: TicketType[];
};

export default function TicketPurchaseCard({
  eventId,
  eventTitle,
  eventSlug,
  ticketTypes,
}: TicketPurchaseCardProps) {
  const [ticketTypeId, setTicketTypeId] = useState(ticketTypes[0]?.id || "");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const selectedTicketType = ticketTypes.find((ticketType) => ticketType.id === ticketTypeId) || ticketTypes[0];
  const isPurchasable = selectedTicketType?.availability_state === "active";
  const maxSelectableQuantity = Math.max(
    1,
    Math.min(
      selectedTicketType?.max_per_order || 1,
      Math.max(
        1,
        (selectedTicketType?.quantity_total || 0) - (selectedTicketType?.quantity_sold || 0),
      ),
    ),
  );

  async function handleCheckout() {
    if (!selectedTicketType) return;

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`/api/evntszn/events/${eventId}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventSlug,
          ticketTypeId: selectedTicketType.id,
          quantity,
        }),
      });

      const data = (await res.json()) as Record<string, any>;

      if (!res.ok) {
        throw new Error(data.error || "Checkout failed.");
      }

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      if (data.redirectTo) {
        window.location.href = data.redirectTo;
        return;
      }

      setMessage("Tickets reserved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Checkout failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6">
      <p className="text-xs uppercase tracking-[0.24em] text-[#A259FF]">Ticketing</p>
      <h2 className="mt-3 text-3xl font-semibold">{eventTitle}</h2>
      <p className="mt-3 text-white/60">
        Branded EVNTSZN ticket checkout with share-ready attendee access and scanner support.
      </p>

      <div className="mt-6 grid gap-4">
        <label className="grid gap-2 text-sm text-white/72">
          Ticket type
          <select
            value={ticketTypeId}
            onChange={(e) => setTicketTypeId(e.target.value)}
            className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none"
          >
            {ticketTypes.map((ticketType) => (
              <option key={ticketType.id} value={ticketType.id}>
                {ticketType.name} · {getTicketAvailabilityLabel(ticketType.availability_state)} · ${(ticketType.price_cents / 100).toFixed(2)}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm text-white/72">
          Quantity
          <select
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-white outline-none"
          >
            {Array.from({ length: maxSelectableQuantity }).map((_, index) => {
              const nextQuantity = index + 1;
              return (
                <option key={nextQuantity} value={nextQuantity}>
                  {nextQuantity}
                </option>
              );
            })}
          </select>
        </label>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/70">
          <div>{selectedTicketType?.description || "Premium EVNTSZN access."}</div>
          <div className="mt-2 text-[#d8c2ff]">
            Status: {selectedTicketType ? getTicketAvailabilityLabel(selectedTicketType.availability_state) : "Unavailable"}
          </div>
          <div className="mt-2">
            Remaining:{" "}
            {Math.max(
              0,
              (selectedTicketType?.quantity_total || 0) - (selectedTicketType?.quantity_sold || 0)
            )}
          </div>
          {selectedTicketType?.sales_start_at && selectedTicketType.availability_state === "scheduled" ? (
            <div className="mt-2">
              On sale: {new Date(selectedTicketType.sales_start_at).toLocaleString()}
            </div>
          ) : null}
        </div>

        <button
          onClick={handleCheckout}
          disabled={!selectedTicketType || loading || !isPurchasable}
          className="ev-button-primary w-full mt-4"
        >
          {loading
            ? "Processing..."
            : !isPurchasable
              ? selectedTicketType?.availability_state === "scheduled"
                ? "Not on sale yet"
                : selectedTicketType?.availability_state === "sold_out"
                  ? "Sold out"
                  : "Unavailable"
            : selectedTicketType?.price_cents
            ? `Checkout · $${((selectedTicketType.price_cents * quantity) / 100).toFixed(2)}`
            : "Reserve complimentary access"}
        </button>

        <div className="rounded-2xl border border-[#A259FF]/25 bg-[#A259FF]/10 p-4 text-sm text-[#dfd0ff]">
          Every issued ticket includes a share code and referral-ready foundation for invite-friend growth.
        </div>

        {message ? (
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/72">
            {message}
          </div>
        ) : null}
      </div>
    </div>
  );
}
