import Link from "next/link";

export default function CheckoutSuccessPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-black p-6 text-white">
      <div className="w-full max-w-2xl rounded-[40px] border border-white/10 bg-[#0d0f17] p-8 text-center shadow-[0_30px_100px_rgba(0,0,0,0.45)] md:p-12">
        <div className="mx-auto inline-flex rounded-full border border-[#A259FF]/25 bg-[#A259FF]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#eadcff]">
          Official EVNTSZN Ticket
        </div>
        <h1 className="mt-5 text-4xl font-black tracking-tight md:text-5xl">Payment successful</h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-white/68">
          Your order is confirmed. Secure entry is powered by EVNTSZN and your ticket wallet updates automatically.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/account/tickets"
            className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90"
          >
            Open my tickets
          </Link>
          <Link
            href="/events"
            className="inline-flex rounded-full border border-white/12 bg-white/6 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white hover:text-black"
          >
            Back to events
          </Link>
        </div>
      </div>
    </main>
  );
}
