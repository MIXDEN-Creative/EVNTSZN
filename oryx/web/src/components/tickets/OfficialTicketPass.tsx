import Image from "next/image";
import Link from "next/link";

type OfficialTicketPassProps = {
  eventName: string;
  eventSlug?: string | null;
  eventStartAt?: string | null;
  venueName?: string | null;
  holderName?: string | null;
  ticketCode: string;
  ticketTypeName?: string | null;
  status: string;
  checkedInAt?: string | null;
};

function formatEventDate(value?: string | null) {
  if (!value) return "Date pending";
  return new Date(value).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatStatus(status: string, checkedInAt?: string | null) {
  if (status === "checked_in") {
    return {
      label: "Checked In",
      tone: "border-emerald-400/30 bg-emerald-500/12 text-emerald-100",
      note: checkedInAt
        ? `Entered ${new Date(checkedInAt).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}`
        : "Entry confirmed",
    };
  }

  if (status === "voided") {
    return {
      label: "Invalid",
      tone: "border-red-400/30 bg-red-500/12 text-red-100",
      note: "Ticket is no longer valid for entry",
    };
  }

  return {
    label: "Valid",
    tone: "border-[#A259FF]/30 bg-[#A259FF]/14 text-[#f2e9ff]",
    note: "Official EVNTSZN Ticket",
  };
}

export default function OfficialTicketPass({
  eventName,
  eventSlug,
  eventStartAt,
  venueName,
  holderName,
  ticketCode,
  ticketTypeName,
  status,
  checkedInAt,
}: OfficialTicketPassProps) {
  const statusMeta = formatStatus(status, checkedInAt);
  const qrUrl = `https://www.google.com/chart?cht=qr&chs=220x220&chl=${encodeURIComponent(ticketCode)}`;

  return (
    <article className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,#11131d_0%,#09090f_100%)] text-white shadow-[0_32px_90px_rgba(0,0,0,0.45)]">
      <div className="border-b border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(162,89,255,0.32),transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.01))] p-6 md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="inline-flex rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/78">
              Official EVNTSZN Ticket
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight md:text-3xl">{eventName}</h2>
              <p className="mt-2 text-sm text-white/62">{formatEventDate(eventStartAt)}</p>
            </div>
          </div>
          <div className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] ${statusMeta.tone}`}>
            {statusMeta.label}
          </div>
        </div>
      </div>

      <div className="grid gap-6 p-6 md:grid-cols-[1.05fr_0.95fr] md:p-7">
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-white/45">Venue</div>
              <div className="mt-2 text-base font-semibold text-white/90">{venueName || "Venue access active"}</div>
            </div>
            <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-white/45">Ticket</div>
              <div className="mt-2 text-base font-semibold text-white/90">{ticketTypeName || "General Access"}</div>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
            <div className="text-[11px] uppercase tracking-[0.22em] text-white/45">Ticket holder</div>
            <div className="mt-2 text-xl font-semibold text-white">{holderName || "EVNTSZN Guest"}</div>
            <div className="mt-3 text-[11px] uppercase tracking-[0.22em] text-[#caa7ff]">Secure entry powered by EVNTSZN</div>
          </div>

          <div className="rounded-[24px] border border-white/8 bg-black/40 p-4">
            <div className="text-[11px] uppercase tracking-[0.22em] text-white/45">Entry code</div>
            <div className="mt-2 text-2xl font-black tracking-[0.28em] text-white">{ticketCode}</div>
            <p className="mt-2 text-sm text-white/55">{statusMeta.note}</p>
          </div>

          {eventSlug ? (
            <Link
              href={`/events/${eventSlug}`}
              className="inline-flex rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white hover:text-black"
            >
              Back to event
            </Link>
          ) : null}
        </div>

        <div className="flex flex-col items-center justify-center rounded-[28px] border border-white/8 bg-white/[0.03] p-5">
          <div className="w-full max-w-[220px] rounded-[24px] bg-white p-4">
            <Image
              src={qrUrl}
              alt={`QR code for ${ticketCode}`}
              width={220}
              height={220}
              unoptimized
              className="h-auto w-full"
            />
          </div>
          <div className="mt-4 text-center">
            <div className="text-[11px] uppercase tracking-[0.24em] text-white/45">Secure entry scan</div>
            <div className="mt-2 text-sm text-white/62">
              Present this pass at entry for fast verification.
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
