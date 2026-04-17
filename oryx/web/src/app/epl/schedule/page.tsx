import Link from 'next/link';
import { getTeamsByConference } from '@/lib/epl-teams';

const SchedulePage = () => {
  const baltimoreDraftDate = "June 20";
  const coastalDraftDate = "June 27";
  const trainingCampStart = "June 29";
  const trainingCampEnd = "July 10";
  const seasonKickoff = "July 11";
  const championshipBlockStart = "August 20"; // Placeholder for playoff start
  const primeBowlDate = "August 30"; // Placeholder for championship date

  const baltimoreTeams = getTeamsByConference('Baltimore');
  const coastalTeams = getTeamsByConference('Coastal');

  const renderTeamList = (teams: ReturnType<typeof getTeamsByConference>) => (
    <ul className="list-disc list-inside space-y-1">
      {teams.map((team) => (
        <li key={team.name}>
          <Link href={`/epl/teams/${team.slug}`} className="hover:underline text-blue-400">
            {team.name}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="container mx-auto px-4 py-12">
      <header className="text-center mb-16">
        <h1 className="text-5xl font-bold mb-4">EPL Season 1 Schedule: The Road to the Prime Bowl</h1>
        <p className="text-xl text-gray-400">Coed Adult Flag Football - Where Rivalries are Forged.</p>
      </header>

      {/* Draft Nights Section */}
      <section className="mb-16">
        <h2 className="text-4xl font-bold text-center mb-8">Draft Nights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="bg-white/5 p-8 rounded-2xl border border-white/10 shadow-xl backdrop-blur-xl">
            <h3 className="text-3xl font-bold mb-4 text-purple-400">Baltimore Draft Night</h3>
            <p className="text-lg mb-3 text-gray-300">Date: {baltimoreDraftDate}</p>
            <p className="text-lg mb-5 text-gray-300">
              The official start to Season 1, focusing on player selection for the Baltimore market teams.
            </p>
            <h4 className="text-2xl font-semibold mb-3 text-white">Teams Involved:</h4>
            {renderTeamList(baltimoreTeams)}
          </div>

          <div className="bg-white/5 p-8 rounded-2xl border border-white/10 shadow-xl backdrop-blur-xl">
            <h3 className="text-3xl font-bold mb-4 text-blue-400">Coastal Draft Night</h3>
            <p className="text-lg mb-3 text-gray-300">Date: {coastalDraftDate}</p>
            <p className="text-lg mb-5 text-gray-300">
              Covering Rehoboth Beach, Bethany Beach, and Ocean City, this draft closes the coastal side of the league.
            </p>
            <h4 className="text-2xl font-semibold mb-3 text-white">Teams Involved:</h4>
            {renderTeamList(coastalTeams)}
          </div>
        </div>
      </section>

      {/* Training Camp & Season Kickoff */}
      <section className="mb-16">
        <h2 className="text-4xl font-bold text-center mb-8">Pre-Season & Season Start</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="bg-white/5 p-8 rounded-2xl border border-white/10 shadow-xl backdrop-blur-xl">
            <h3 className="text-3xl font-bold mb-4 text-green-400">Training Camp</h3>
            <p className="text-lg mb-3 text-gray-300">Dates: {trainingCampStart} - {trainingCampEnd}</p>
            <p className="text-lg text-gray-300">
              An intensive period for players to hone their skills, build team chemistry, and prepare for the competitive season ahead.
            </p>
          </div>
          <div className="bg-white/5 p-8 rounded-2xl border border-white/10 shadow-xl backdrop-blur-xl">
            <h3 className="text-3xl font-bold mb-4 text-yellow-400">Season Kickoff</h3>
            <p className="text-lg mb-3 text-gray-300">Date: {seasonKickoff}</p>
            <p className="text-lg text-gray-300">
              The regular season begins! Expect intense matchups as Baltimore and Coastal conferences battle it out.
            </p>
          </div>
        </div>
      </section>

      {/* Regular Season Framework */}
      <section className="mb-16">
        <h2 className="text-4xl font-bold text-center mb-8">Regular Season Framework</h2>
        <div className="bg-white/5 p-8 rounded-2xl border border-white/10 shadow-xl backdrop-blur-xl">
          <p className="text-lg mb-5 text-gray-300">
            The regular season will feature a balanced schedule with inter-conference play, leading up to crucial divisional games. Teams will compete weekly to secure their spot in the postseason. Specific weekly matchups and game times will be announced closer to the kickoff.
          </p>
          <h4 className="text-2xl font-semibold mb-3 text-white">Key Dates:</h4>
          <ul className="list-disc list-inside text-gray-300 space-y-1">
            <li>Weekly Games: {seasonKickoff} - {championshipBlockStart}</li>
            <li>Postseason: Starting {championshipBlockStart}</li>
          </ul>
        </div>
      </section>

      {/* Playoffs and Championship */}
      <section className="mb-16">
        <h2 className="text-4xl font-bold text-center mb-8">Postseason & Championship</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="bg-white/5 p-8 rounded-2xl border border-white/10 shadow-xl backdrop-blur-xl">
            <h3 className="text-3xl font-bold mb-4 text-red-400">Playoff Progression</h3>
            <p className="text-lg mb-3 text-gray-300">Commencing: {championshipBlockStart}</p>
            <p className="text-lg text-gray-300">
              The top teams from both the Baltimore and Coastal conferences will advance to a thrilling playoff bracket. Expect high-stakes games as teams vie for conference supremacy.
            </p>
          </div>
          <div className="bg-white/5 p-8 rounded-2xl border border-white/10 shadow-xl backdrop-blur-xl">
            <h3 className="text-3xl font-bold mb-4 text-orange-400">Prime Bowl</h3>
            <p className="text-lg mb-3 text-gray-300">Date: {primeBowlDate}</p>
            <p className="text-lg text-gray-300">
              The ultimate showdown. The champions of the Baltimore and Coastal conferences clash for the prestigious Prime Bowl title.
            </p>
          </div>
        </div>
      </section>

      {/* Placeholder for detailed weekly schedule */}
      <section className="mb-16 text-center">
        <h2 className="text-4xl font-bold mb-8">Detailed Weekly Schedule</h2>
        <p className="text-lg text-gray-400 max-w-3xl mx-auto">
          Detailed weekly game schedules, including matchups, times, and locations, will be published here as the season approaches.
        </p>
        {/* TODO: Implement dynamic schedule display */}
      </section>
    </div>
  );
};

export default SchedulePage;
