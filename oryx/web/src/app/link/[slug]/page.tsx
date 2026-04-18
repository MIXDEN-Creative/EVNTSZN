import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
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
    <main className="ev-public-page">
      <section className="ev-public-section py-8">
        <Badge>{isPro ? "Link Pro" : "Link"}</Badge>
        <h1 className="ev-title max-w-5xl">{snapshot.page.display_name || snapshot.page.slug}</h1>
        <p className="ev-subtitle max-w-3xl">
          {snapshot.page.headline || snapshot.page.intro || "A public EVNTSZN identity layer for partners, venues, and curators."}
        </p>
      </section>

      <section className="ev-public-section grid gap-6 pb-14 xl:grid-cols-[1.04fr_0.96fr]">
        <Card className="space-y-4">
          <CardTitle>Upcoming events</CardTitle>
          {snapshot.upcomingEvents.length ? (
            snapshot.upcomingEvents.map((event: any) => (
              <Link key={event.id} href={`/events/${event.slug}`} className="block rounded-2xl border border-white/10 bg-black/20 p-4 hover:border-white/20">
                <div className="text-lg font-black text-white">{event.title}</div>
                <CardDescription className="mt-2">
                  {event.city}, {event.state} · {new Date(event.start_at).toLocaleString()}
                </CardDescription>
              </Link>
            ))
          ) : (
            <CardDescription>No upcoming events pinned yet.</CardDescription>
          )}
        </Card>

        <div className="space-y-6">
          <Card className="space-y-4">
            <CardTitle>Reserve links</CardTitle>
            {snapshot.reserveLinks.length ? (
              snapshot.reserveLinks.map((link) => (
                <Link key={link.id} href={link.href} className="block rounded-2xl border border-white/10 bg-black/20 p-4 hover:border-white/20">
                  <div className="text-lg font-black text-white">{link.label}</div>
                </Link>
              ))
            ) : (
              <CardDescription>No reserve lanes attached yet.</CardDescription>
            )}
          </Card>

          <Card className="space-y-4">
            <CardTitle>External links</CardTitle>
            {snapshot.socialLinks.length ? (
              snapshot.socialLinks.map((link: any) => (
                <a key={link.id} href={link.url} className="block rounded-2xl border border-white/10 bg-black/20 p-4 hover:border-white/20">
                  <div className="text-lg font-black text-white">{link.label || link.platform}</div>
                  <CardDescription className="mt-2">{link.url}</CardDescription>
                </a>
              ))
            ) : (
              <CardDescription>No external links attached yet.</CardDescription>
            )}
          </Card>

          {isPro ? (
            <Card>
              <CardTitle>Pro sections enabled</CardTitle>
              <CardDescription className="mt-3">
                Link Pro unlocks expanded sections and higher-signal public identity surfaces for partners, venues, and future curator tiers.
              </CardDescription>
            </Card>
          ) : null}
        </div>
      </section>
    </main>
  );
}
