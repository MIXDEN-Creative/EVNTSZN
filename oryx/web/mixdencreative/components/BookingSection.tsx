type BookingSectionProps = {
  bookingUrl: string | null;
  hasServerIntegration: boolean;
};

export function BookingSection({
  bookingUrl,
  hasServerIntegration,
}: BookingSectionProps) {
  return (
    <section id="booking" className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-accent)]">
              Booking
            </p>
            <h2 className="mt-4 text-3xl font-bold uppercase leading-tight text-white sm:text-4xl">
              Book Your Creative Strategy Call
            </h2>
          </div>
          <p className="max-w-xl text-base leading-7 text-white/72">
            Choose your package, book a call, and we&apos;ll confirm whether
            MIXDEN Creative is the right fit for your build.
          </p>
          <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white">
              Hapio status
            </p>
            <p className="mt-4 text-sm leading-6 text-white/68">
              {hasServerIntegration
                ? "Server-side Hapio credentials are configured. The API route is ready for direct availability lookups when your endpoint is added."
                : "Add your public Hapio booking URL for a clean booking handoff, or add a Hapio API endpoint to activate server-side availability fetching."}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href={bookingUrl ?? "#"}
                target={bookingUrl ? "_blank" : undefined}
                rel={bookingUrl ? "noreferrer" : undefined}
                className={`inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition ${
                  bookingUrl
                    ? "bg-[var(--color-accent)] text-black hover:bg-white"
                    : "cursor-not-allowed border border-white/12 bg-white/6 text-white/45"
                }`}
              >
                {bookingUrl ? "Open Hapio Booking" : "Add Booking URL To Enable"}
              </a>
              <a
                href="#packages"
                className="inline-flex items-center justify-center rounded-full border border-white/12 bg-transparent px-5 py-3 text-sm font-semibold text-white transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              >
                Review Packages
              </a>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.08),rgba(18,18,18,0.96))] p-2 shadow-[0_30px_90px_rgba(0,0,0,0.34)]">
          {bookingUrl ? (
            <iframe
              src={bookingUrl}
              title="MIXDEN Creative booking"
              className="min-h-[580px] w-full rounded-[1.5rem] bg-white"
            />
          ) : (
            <div className="flex min-h-[580px] flex-col justify-between rounded-[1.5rem] border border-dashed border-white/12 bg-black/60 p-6">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-accent)]">
                  Placeholder
                </p>
                <h3 className="mt-4 text-2xl font-bold uppercase text-white">
                  Hapio embed goes here
                </h3>
                <p className="mt-4 max-w-lg text-sm leading-7 text-white/68">
                  Set `NEXT_PUBLIC_HAPIO_BOOKING_URL` in
                  `mixdencreative/.env.local` to embed or link directly to your
                  Hapio booking page. If you receive an API endpoint from Hapio,
                  set `HAPIO_API_BASE_URL` and the included server route can be
                  extended without exposing your token to the browser.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/72">
                API route: <code>/api/hapio</code>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
