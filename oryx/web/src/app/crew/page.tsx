import PublicPageFrame from "@/components/public/PublicPageFrame";
import CrewMarketplaceClient from "./CrewMarketplaceClient";
import CrewIntakeForm from "@/components/public/CrewIntakeForm";

type CrewPageProps = {
  searchParams?: Promise<{
    q?: string | string[];
    city?: string | string[];
    category?: string | string[];
    availability?: string | string[];
  }>;
};

export default async function CrewPage({ searchParams }: CrewPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const filters = {
    query: Array.isArray(resolvedSearchParams.q) ? resolvedSearchParams.q[0] || "" : resolvedSearchParams.q || "",
    city: Array.isArray(resolvedSearchParams.city) ? resolvedSearchParams.city[0] || "" : resolvedSearchParams.city || "",
    category: Array.isArray(resolvedSearchParams.category) ? resolvedSearchParams.category[0] || "" : resolvedSearchParams.category || "",
    availability: Array.isArray(resolvedSearchParams.availability)
      ? resolvedSearchParams.availability[0] || ""
      : resolvedSearchParams.availability || "",
  };

  return (
    <PublicPageFrame>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1800&q=80"
            alt="EVNTSZN Crew marketplace"
            className="h-full w-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/60 to-black" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-16 md:px-6 lg:px-8">
          <div className="ev-kicker">EVNTSZN Crew</div>
          <h1 className="ev-title max-w-5xl">Book real nightlife and event talent without fake directories or dead categories.</h1>
          <p className="ev-subtitle max-w-3xl">
            Crew is the live marketplace for DJs, photographers, videographers, security, promoters, brand support, and event-facing specialists. Browse active inventory, then book with the platform fee acknowledged up front.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:px-8">
        <CrewMarketplaceClient initialFilters={filters} />
      </section>

      <section className="mx-auto max-w-5xl px-4 py-4 pb-14 md:px-6 lg:px-8">
        <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <div className="ev-section-kicker">Join the marketplace</div>
          <div className="mt-3 text-3xl font-black text-white">Create your crew profile.</div>
          <div className="mt-3 max-w-3xl text-sm leading-7 text-white/65">
            Publish your role, city, rate, and booking lane. Intake drives the live marketplace and internal routing, not a placeholder listing grid.
          </div>
          <div className="mt-6">
            <CrewIntakeForm />
          </div>
        </div>
      </section>
    </PublicPageFrame>
  );
}
