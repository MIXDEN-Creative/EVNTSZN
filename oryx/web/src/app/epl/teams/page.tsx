import Link from "next/link";
import Image from "next/image";
import { getTeamsByConference } from "@/lib/epl-teams";
import PublicPageFrame from "@/components/public/PublicPageFrame";

const EPLTeamsPage = () => {
  const baltimoreTeams = getTeamsByConference("Baltimore");
  const coastalTeams = getTeamsByConference("Coastal");

  const renderTeamCard = (team: (typeof baltimoreTeams)[number]) => (
    <Link
      key={team.slug}
      href={`/epl/teams/${team.slug}`}
      className="ev-panel p-6 rounded-2xl hover:border-purple-500 transition-colors duration-300 flex flex-col items-center text-center"
    >
      <div className="w-20 h-20 rounded-2xl border border-white/10 bg-white/[0.04] p-3 mb-4">
        <Image src={team.logoUrl} alt={team.name} width={80} height={80} className="mx-auto h-full w-full rounded-lg object-cover" />
      </div>
      <div className="text-xl font-bold text-white mb-1">{team.name}</div>
      <div className="text-sm font-semibold text-white/70">{team.city}</div>
    </Link>
  );

  return (
    <PublicPageFrame
      title="EVNTSZN EPL Teams"
      description="Meet the 12 clubs competing in the EVNTSZN Premier League Season 1."
      heroImage="https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1800&q=80"
      seo={{
        title: "EVNTSZN EPL Teams | Meet the Clubs",
        description: "Discover the 12 fierce teams of the EVNTSZN Premier League, from Baltimore to the Coast.",
      }}
    >
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 lg:px-8">
        <h1 className="text-5xl font-bold mb-4 text-white text-center">EVNTSZN Premier League Teams</h1>
        <p className="text-xl text-gray-300 text-center max-w-3xl mx-auto mt-6">
          Get to know the 12 clubs battling for supremacy in Season 1. Each team brings unique talent and city pride to the field.
        </p>

        <div className="mt-16">
          <h2 className="text-4xl font-bold text-center mb-8 text-purple-400">Baltimore Conference</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {baltimoreTeams.map(team => renderTeamCard(team))}
          </div>
        </div>

        <div className="mt-16">
          <h2 className="text-4xl font-bold text-center mb-8 text-blue-400">Coastal Conference</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coastalTeams.map(team => renderTeamCard(team))}
          </div>
        </div>
      </section>

      {/* Link to individual team pages would be handled by routing */}
    </PublicPageFrame>
  );
};

export default EPLTeamsPage;
