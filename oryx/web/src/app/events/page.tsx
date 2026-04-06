import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-admin";

export default async function EventsPage() {
  const { data: events } = await supabaseAdmin
    .from("evntszn_events")
    .select("id, title, slug, subtitle, description, city, state, start_at, end_at, hero_note, scanner_status")
    .eq("visibility", "published")
    .order("start_at", { ascending: true });

  return (
    <main className="min-h-screen bg-black px-6 py-12 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.28em] text-[#A259FF]">EVNTSZN live inventory</p>
          <h1 className="mt-3 text-5xl font-black tracking-tight">Events and ticket drops</h1>
          <p className="mt-4 text-lg text-white/66">
            Browse published EVNTSZN experiences, purchase branded access, and move into
            a clean attendee flow with share-ready tickets.
          </p>
        </div>

        <div className="mt-10 grid gap-6">
          {(events || []).map((event) => (
            <article
              key={event.id}
              className="grid gap-5 rounded-[32px] border border-white/10 bg-white/[0.03] p-6 lg:grid-cols-[1.2fr_0.8fr]"
            >
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-white/45">
                  {event.city}, {event.state}
                </div>
                <h2 className="mt-3 text-3xl font-semibold">{event.title}</h2>
                <p className="mt-3 text-white/62">{event.subtitle || event.description}</p>
                {event.hero_note ? (
                  <div className="mt-5 rounded-2xl border border-[#A259FF]/25 bg-[#A259FF]/10 px-4 py-3 text-sm text-[#dfd0ff]">
                    {event.hero_note}
                  </div>
                ) : null}
              </div>

              <div className="rounded-[28px] border border-white/10 bg-black/30 p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">Run of show</p>
                <div className="mt-4 space-y-2 text-sm text-white/72">
                  <div>Doors: {new Date(event.start_at).toLocaleString()}</div>
                  <div>Wrap: {new Date(event.end_at).toLocaleString()}</div>
                  <div>Scanner state: {event.scanner_status}</div>
                </div>
                <Link
                  href={`/events/${event.slug}`}
                  className="mt-6 inline-flex rounded-2xl bg-white px-4 py-3 font-semibold text-black"
                >
                  Open event
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
