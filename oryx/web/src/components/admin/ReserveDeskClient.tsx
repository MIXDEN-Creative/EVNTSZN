"use client";

import { useEffect, useState } from "react";

type WorkItem = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
};

type Booking = {
  id: string;
  guest_name: string;
  booking_date: string;
  booking_time: string;
  party_size: number;
  status: string;
};

export default function ReserveDeskClient() {
  const [items, setItems] = useState<WorkItem[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [message, setMessage] = useState("");

  async function loadData() {
    const [itemsRes, bookingsRes] = await Promise.all([
      fetch("/api/admin/internal-os/work-items?desk=reserve", { cache: "no-store" }),
      fetch("/api/reserve/bookings?desk=1", { cache: "no-store" }),
    ]);
    const itemsJson = (await itemsRes.json()) as { items?: WorkItem[]; error?: string };
    const bookingsJson = (await bookingsRes.json()) as { bookings?: Booking[]; error?: string };
    if (!itemsRes.ok) throw new Error(itemsJson.error || "Could not load Reserve desk.");
    if (!bookingsRes.ok) throw new Error(bookingsJson.error || "Could not load Reserve bookings.");
    setItems(itemsJson.items || []);
    setBookings(bookingsJson.bookings || []);
  }

  useEffect(() => {
    loadData().catch((error) => setMessage(error.message));
  }, []);

  async function updateItem(id: string, status: string, founderOverride = false) {
    try {
      const response = await fetch("/api/admin/internal-os/work-items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, founderOverride }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not update work item.");
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update work item.");
    }
  }

  async function updateBooking(id: string, status: string) {
    try {
      const response = await fetch("/api/reserve/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not update booking.");
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update booking.");
    }
  }

  return (
    <div className="space-y-8">
      {message ? <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">{message}</div> : null}

      <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
        <div className="ev-section-kicker">Reserve desk</div>
        <h1 className="mt-2 text-3xl font-black text-white">Assign launches, resolve waitlist pressure, and force founder overrides without leaving the desk.</h1>
      </section>

      <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
        <div className="ev-section-kicker">Work queue</div>
        <div className="mt-6 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="rounded-[28px] border border-white/10 bg-black/30 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-bold text-white">{item.title}</div>
                  <div className="mt-1 text-sm text-white/55">{item.description || "No description."}</div>
                </div>
                <div className="flex gap-2">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#caa7ff]">{item.priority}</span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">{item.status}</span>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {["open", "in_progress", "completed", "blocked", "cancelled"].map((status) => (
                  <button key={status} type="button" onClick={() => updateItem(item.id, status)} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/72">
                    {status.replace("_", " ")}
                  </button>
                ))}
                <button type="button" onClick={() => updateItem(item.id, item.status, true)} className="rounded-full border border-red-400/30 bg-red-500/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-red-100">
                  Founder override
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
        <div className="ev-section-kicker">Bookings</div>
        <div className="mt-6 space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="rounded-[28px] border border-white/10 bg-black/30 p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-lg font-bold text-white">{booking.guest_name}</div>
                  <div className="mt-1 text-sm text-white/55">{booking.booking_date} · {booking.booking_time.slice(0, 5)} · party of {booking.party_size}</div>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#caa7ff]">{booking.status}</div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {["confirmed", "waitlisted", "checked_in", "no_show", "cancelled"].map((status) => (
                  <button key={status} type="button" onClick={() => updateBooking(booking.id, status)} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/72">
                    {status.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
