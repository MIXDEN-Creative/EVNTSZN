import PublicPageFrame from "@/components/public/PublicPageFrame";
import PulseFeedClient from "@/components/pulse/PulseFeedClient";
import { getPublicPulseFeed } from "@/lib/pulse";

export const dynamic = "force-dynamic";

export default async function PublicPulsePage() {
  const items = await getPublicPulseFeed();

  return (
    <PublicPageFrame>
      <section className="mx-auto max-w-7xl px-4 py-14 md:px-6 lg:px-8">
        <div className="ev-kicker">EVNTSZN Pulse</div>
        <h1 className="ev-title max-w-5xl">Live city movement, event energy, venues, and reserve signals.</h1>
        <p className="ev-subtitle max-w-3xl">
          Public Pulse stays discovery-first. Events, venues, live energy, reserve movement, and public-safe sponsor visibility surface here without exposing internal ops.
        </p>
        <div className="mt-10">
          <PulseFeedClient scope="public" initialItems={items} />
        </div>
      </section>
    </PublicPageFrame>
  );
}
