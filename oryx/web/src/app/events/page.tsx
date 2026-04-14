import Image from "next/image";
import Link from "next/link";
import SurfaceShell from "@/components/shells/SurfaceShell";
import { supabaseAdmin } from "@/lib/supabase-admin";

const FALLBACK_EVENT_IMAGE = "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=80";

export default async function EventsPage() {
  const { data: events } = await supabaseAdmin
    .from("evntszn_events")
    .select("id, title, slug, subtitle, description, city, state, start_at, end_at, hero_note, scanner_status, banner_image_url")
    .eq("visibility", "published")
    .order("start_at", { ascending: true });

  return (
    <SurfaceShell
      surface="web"
      eyebrow="Public events"
      title="The city is currently in motion."
      description="Official ticket drops, hosted nights, and the moves actually worth being at. One clean feed for real-time discovery."
    >
      <div className="grid gap-10 md:grid-cols-2">
          {(events || []).map((event) => (
            <article
              key={event.id}
              className="group overflow-hidden rounded-[40px] border border-white/10 bg-[#0c0c15] shadow-[0_24px_60px_rgba(0,0,0,0.35)] transition-all hover:-translate-y-1 hover:border-white/20"
            >
              <Link href={`/events/${event.slug}`} className="block relative h-64 overflow-hidden">
                <Image 
                    src={event.banner_image_url || FALLBACK_EVENT_IMAGE} 
                    alt={event.title} 
                    fill 
                    unoptimized
                    className="object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                    <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/60">
                        {event.city}, {event.state}
                    </div>
                    <h2 className="mt-2 text-3xl font-black text-white leading-tight tracking-tight">{event.title}</h2>
                </div>
              </Link>

              <div className="p-8">
                <div className="flex flex-wrap items-center gap-6 text-sm">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Doors</span>
                        <span className="mt-1 font-semibold text-white/70">{new Date(event.start_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Status</span>
                        <span className="mt-1 font-semibold text-[#caa7ff] uppercase tracking-widest text-xs">Live Access</span>
                    </div>
                </div>

                <p className="mt-6 text-white/50 leading-relaxed line-clamp-2">{event.subtitle || event.description}</p>
                
                {event.hero_note ? (
                  <div className="mt-6 rounded-2xl border border-[#A259FF]/25 bg-[#A259FF]/5 px-5 py-4 text-sm text-[#dfd0ff] italic">
                    {event.hero_note}
                  </div>
                ) : null}

                <Link
                  href={`/events/${event.slug}`}
                  className="mt-8 ev-button-primary w-full py-4 text-xs font-black uppercase tracking-widest"
                >
                  Get Access
                </Link>
              </div>
            </article>
          ))}
      </div>
    </SurfaceShell>
  );
}
