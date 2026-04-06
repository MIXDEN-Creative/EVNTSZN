import Link from "next/link";
import SurfaceShell from "@/components/shells/SurfaceShell";

export default function Home() {
  return (
    <SurfaceShell
      surface="web"
      eyebrow="EVNTSZN"
      title="Premium event experiences with a command-center backbone."
      description="A cinematic event platform for ticket drops, live entry, operator control, and branded league experiences across every EVNTSZN surface."
      actions={
        <>
          <Link href="/events" className="ev-button-primary">
            Explore live events
          </Link>
          <Link href="/account/login?next=/account" className="ev-button-secondary">
            Sign in to EVNTSZN
          </Link>
        </>
      }
      meta={
        <>
          <div className="ev-meta-card">
            <div className="ev-meta-label">Experience stack</div>
            <div className="ev-meta-value">
              Premium ticketing, mobile-first scanning, attendee accounts, and multi-surface operations.
            </div>
          </div>
          <div className="ev-meta-card">
            <div className="ev-meta-label">Built for velocity</div>
            <div className="ev-meta-value">
              Run public discovery on EVNTSZN while staff, leagues, admins, and operators work in their own guarded environments.
            </div>
          </div>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="ev-panel">
          <div className="ev-section-kicker">Public web</div>
          <h2 className="ev-panel-title mt-3">Discovery that feels premium at first contact</h2>
          <p className="ev-panel-copy">
            EVNTSZN keeps the public surface elegant, branded, and focused on event conversion instead of exposing operator tooling in the wrong places.
          </p>
        </section>
        <section className="ev-panel">
          <div className="ev-section-kicker">Member portal</div>
          <h2 className="ev-panel-title mt-3">A concierge-grade account experience</h2>
          <p className="ev-panel-copy">
            Tickets, rewards, orders, and account activity live in a dedicated member environment with premium hierarchy and clean navigation.
          </p>
        </section>
        <section className="ev-panel">
          <div className="ev-section-kicker">Operations</div>
          <h2 className="ev-panel-title mt-3">Scanner, ops, league, HQ, and admin with real separation</h2>
          <p className="ev-panel-copy">
            Each EVNTSZN role lands in the right surface with its own cadence, density, and guardrails instead of one generic dashboard shell.
          </p>
        </section>
      </div>
    </SurfaceShell>
  );
}
