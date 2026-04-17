import PublicPageFrame from "@/components/public/PublicPageFrame";
import PulseFeedClient from "@/components/pulse/PulseFeedClient";
import { getPlatformViewer, requirePlatformUser } from "@/lib/evntszn";
import { getPublicPulseFeed } from "@/lib/pulse";

export const dynamic = "force-dynamic";

export default async function AccountPulsePage() {
  await requirePlatformUser("/account/pulse");
  const [viewer, items] = await Promise.all([getPlatformViewer(), getPublicPulseFeed()]);

  return (
    <PublicPageFrame>
      <section className="ev-public-section py-8 md:py-10">
        <div className="rounded-[36px] border border-white/10 bg-white/[0.03] p-8 md:p-10">
          <div className="ev-kicker">Account Pulse</div>
          <h1 className="mt-3 text-5xl font-black tracking-tight text-white">Public Pulse, inside your account.</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/65">
            {viewer.user?.email || "Your account"} can follow public-safe event, venue, and reserve movement here while internal ops stays separated.
          </p>
        </div>
        <div className="mt-8">
          <PulseFeedClient scope="public" initialItems={items} canFlag />
        </div>
      </section>
    </PublicPageFrame>
  );
}
