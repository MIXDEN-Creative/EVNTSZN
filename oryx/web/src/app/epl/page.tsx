import type { Metadata } from "next";
import Link from "next/link";
import { getEplOrigin } from "@/lib/domains";
import { getEplPublicContent } from "@/lib/site-content";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getEplPublicContent();
  const title = "EPL | Coed league competition, draft night, schedule, teams, standings, and league merch";
  const description =
    "Explore EVNTSZN Prime League: register for Season 1, follow teams, watch the standings tighten, and move through a premium city-built sports-entertainment league experience.";

  return {
    title,
    description,
    alternates: {
      canonical: `${getEplOrigin()}/`,
    },
    openGraph: {
      title: `EVNTSZN | ${title}`,
      description,
      url: `${getEplOrigin()}/`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `EVNTSZN | ${title}`,
      description,
    },
    keywords: [
      "EPL",
      "EVNTSZN Prime League",
      "coed league",
      "draft night",
      "standings",
      "schedule",
      "Baltimore sports entertainment",
    ],
  };
}

export default async function EplPublicPage() {
  const content = await getEplPublicContent();

  const menuItems = [
    content.menu.showRegister && { label: "Register", href: content.hero.primaryCtaHref },
    content.menu.showSchedule && { label: "Schedule", href: "#schedule" },
    content.menu.showTeams && { label: "Teams", href: "#teams" },
    content.menu.showStandings && { label: "Standings", href: "#standings" },
    content.menu.showStore && { label: "Store", href: "/epl/store" },
  ].filter(Boolean) as Array<{ label: string; href: string }>;

  const teamCards = [
    "Canton Chargers",
    "Federal Hill Sentinels",
    "Fells Point Raiders",
    "Hampden Rebels",
    "Harbor Titans",
    "Mount Vernon Royals",
  ];

  return (
    <main className="ev-surface ev-surface--epl">
      <div className="ev-shell">
        <section className="ev-shell-hero">
          <div className="ev-shell-hero-grid">
            <div>
              <div className="ev-kicker">{content.hero.eyebrow}</div>
              <h1 className="ev-title">{content.hero.title}</h1>
              <p className="ev-subtitle">{content.hero.description}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={content.hero.primaryCtaHref} className="ev-button-primary">
                  {content.hero.primaryCtaLabel}
                </Link>
                <Link href={content.hero.secondaryCtaHref} className="ev-button-secondary">
                  {content.hero.secondaryCtaLabel}
                </Link>
                <Link href="/epl/draft/season-1" className="ev-button-secondary">
                  Draft Night
                </Link>
              </div>
            </div>
            <div className="ev-hero-meta">
              <div className="ev-meta-card">
                <div className="ev-meta-label">League shape</div>
                <div className="ev-meta-value">Registration, player review, draft-night energy, team identity, standings pressure, and premium league presentation.</div>
              </div>
              <div className="ev-meta-card">
                <div className="ev-meta-label">Menu</div>
                <div className="flex flex-wrap gap-2">
                  {menuItems.map((item) => (
                    <Link key={item.label} href={item.href} className="ev-chip">
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 ev-panel ev-metal-border">
          <div className="ev-section-kicker">Season overview</div>
          <h2 className="ev-panel-title mt-3">{content.sections.seasonHeadline}</h2>
          <p className="ev-panel-copy mt-3">{content.sections.seasonBody}</p>
        </section>

        {content.menu.showSchedule ? (
          <section id="schedule" className="mt-8 ev-panel ev-metal-border">
            <div className="ev-section-kicker">Schedule</div>
            <h2 className="ev-panel-title mt-3">{content.sections.scheduleHeadline}</h2>
            <p className="ev-panel-copy mt-3">{content.sections.scheduleBody}</p>
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {[
                "Season openers and statement nights",
                "Mid-table pressure and rivalry fixtures",
                "Stretch-run matchups that move the standings",
              ].map((item) => (
                <div key={item} className="ev-meta-card">
                  <div className="ev-meta-label">League rhythm</div>
                  <div className="ev-meta-value">{item}</div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {content.menu.showTeams ? (
          <section id="teams" className="mt-8">
            <div className="ev-kicker">Teams</div>
            <h2 className="ev-panel-title mt-2">{content.sections.teamsHeadline}</h2>
            <p className="mt-3 max-w-3xl text-white/68">{content.sections.teamsBody}</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {teamCards.map((team) => (
                <div key={team} className="ev-panel ev-metal-border">
                  <div className="ev-section-kicker">Season 1 club</div>
                  <div className="mt-3 text-2xl font-semibold text-white">{team}</div>
                  <p className="mt-3 text-white/66">
                    Team identity, draft-night momentum, and a city-rooted table race held inside the EVNTSZN league layer.
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {content.menu.showStandings ? (
          <section id="standings" className="mt-8 ev-panel ev-metal-border">
            <div className="ev-section-kicker">Standings</div>
            <h2 className="ev-panel-title mt-3">{content.sections.standingsHeadline}</h2>
            <p className="ev-panel-copy mt-3">{content.sections.standingsBody}</p>
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {[
                "Wins, goal difference, and table movement stay visible as the season tightens.",
                "Standings are designed to give fans and players a clean weekly read on league pressure.",
                "The public league site is ready for a real table, not a throwaway placeholder block.",
              ].map((item) => (
                <div key={item} className="ev-meta-card">
                  <div className="ev-meta-label">Table pressure</div>
                  <div className="ev-meta-value">{item}</div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {content.menu.showStore ? (
          <section id="store" className="mt-8 ev-panel ev-metal-border">
            <div className="ev-section-kicker">Store</div>
            <h2 className="ev-panel-title mt-3">{content.sections.storeHeadline}</h2>
            <p className="ev-panel-copy mt-3">{content.sections.storeBody}</p>
            <div className="mt-6">
              <Link href="/epl/store" className="ev-button-primary">
                Shop EPL merch
              </Link>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
