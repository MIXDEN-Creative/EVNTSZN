import PublicPageFrame from "@/components/public/PublicPageFrame";
import CrewMarketplaceClient from "./CrewMarketplaceClient";

export const dynamic = "force-dynamic";

export default function CrewMarketplacePage() {
  return (
    <PublicPageFrame>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(162,89,255,0.22),transparent_35%),linear-gradient(180deg,#09090c_0%,#050507_100%)]" />
        <div className="relative mx-auto max-w-[1500px] px-4 py-14 md:px-6 lg:px-8 lg:py-20">
          <div className="ev-kicker">EVNTSZN Crew</div>
          <h1 className="ev-title max-w-5xl">Book real event talent without leaving the EVNTSZN operating lane.</h1>
          <p className="ev-subtitle max-w-3xl">
            EVNTSZN Crew is a booking marketplace for DJs, music producers, photographers, videographers, bartenders, dancers, comedians, food vendors, content creators, and hosts. Hosts and Independent Organizers can source talent here without bouncing into disconnected contact flows.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-4 py-10 md:px-6 lg:px-8 lg:py-14">
        <CrewMarketplaceClient />
      </section>
    </PublicPageFrame>
  );
}
