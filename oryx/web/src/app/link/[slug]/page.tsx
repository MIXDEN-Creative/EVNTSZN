import { notFound } from "next/navigation";
import Link from "next/link";
import PublicPageFrame from "@/components/public/PublicPageFrame";
import { getLinkProfileSnapshot } from "@/lib/evntszn-phase";
import { normalizeLinkPlan } from "@/lib/platform-products";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export default async function LinkPage({ params }: RouteContext) {
  const { slug } = await params;
  const snapshot = await getLinkProfileSnapshot(slug);
  if (!snapshot) notFound();

  const plan = normalizeLinkPlan(snapshot.page.plan_tier);
  const isPro = plan === "pro" || plan === "elite";

  return (
    <PublicPageFrame
      title={snapshot.page.display_name || snapshot.page.slug}
      description={snapshot.page.headline || snapshot.page.intro || "A premium EVNTSZN identity surface for events, reserve, and conversion-ready traffic."}
      heroImage="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1800&q=80"
    >
      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
          <div className="rounded-[34px] border border-white/10 bg-[#0c0c15] p-7 md:p-9">
            <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#caa7ff]">{isPro ? "Link Pro" : "Link"}</div>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-white md:text-5xl">{snapshot.page.display_name || snapshot.page.slug}</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/68">
              {snapshot.page.headline || snapshot.page.intro || "A public EVNTSZN identity layer for partners, venues, and curators."}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {snapshot.upcomingEvents[0] ? (
                <Link href={`/events/${snapshot.upcomingEvents[0].slug}`} className="ev-button-primary">
                  Open featured event
                </Link>
              ) : null}
              {snapshot.reserveLinks[0] ? (
                <Link href={snapshot.reserveLinks[0].href} className="ev-button-secondary">
                  Open Reserve
                </Link>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6">
              <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#caa7ff]">What this page does</div>
              <div className="mt-3 text-2xl font-black text-white">Move traffic into the right room.</div>
              <p className="mt-3 text-sm leading-6 text-white/62">
                Link keeps events, reserve, public identity, and external traffic in one clean conversion lane instead of spreading attention across generic profile pages.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
              {[
                `${snapshot.upcomingEvents.length} upcoming event${snapshot.upcomingEvents.length === 1 ? "" : "s"} live`,
                `${snapshot.reserveLinks.length} reserve lane${snapshot.reserveLinks.length === 1 ? "" : "s"} attached`,
                isPro ? "Pro conversion surface enabled" : "Core link surface active",
              ].map((item) => (
                <div key={item} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5 text-sm text-white/68">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 md:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
          <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#caa7ff]">Upcoming events</div>
            <div className="mt-5 grid gap-4">
              {snapshot.upcomingEvents.length ? (
                snapshot.upcomingEvents.map((event: any) => (
                  <Link key={event.id} href={`/events/${event.slug}`} className="block rounded-2xl border border-white/10 bg-black/20 p-4 hover:border-white/20">
                    <div className="text-lg font-black text-white">{event.title}</div>
                    <div className="mt-2 text-sm text-white/62">
                      {event.city}, {event.state} · {new Date(event.start_at).toLocaleString()}
                    </div>
                  </Link>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-white/58">
                  No upcoming events are pinned yet.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <section className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#caa7ff]">Reserve links</div>
              <div className="mt-5 grid gap-4">
                {snapshot.reserveLinks.length ? (
                  snapshot.reserveLinks.map((link) => (
                    <Link key={link.id} href={link.href} className="block rounded-2xl border border-white/10 bg-black/20 p-4 hover:border-white/20">
                      <div className="text-lg font-black text-white">{link.label}</div>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-white/58">
                    No reserve lanes are attached yet.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#caa7ff]">External links</div>
              <div className="mt-5 grid gap-4">
                {snapshot.socialLinks.length ? (
                  snapshot.socialLinks.map((link: any) => (
                    <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="block rounded-2xl border border-white/10 bg-black/20 p-4 hover:border-white/20">
                      <div className="text-lg font-black text-white">{link.label || link.platform}</div>
                      <div className="mt-2 text-sm text-white/62">{link.url}</div>
                    </a>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-white/58">
                    No external links are attached yet.
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </section>
    </PublicPageFrame>
  );
}
