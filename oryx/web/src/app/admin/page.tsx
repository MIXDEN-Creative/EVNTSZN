// src/app/admin/page.tsx
import Link from 'next/link';
import { requireAdminPermission } from '@/lib/admin-auth';

export default async function AdminDashboardPage() {
  await requireAdminPermission("admin.manage", "/admin");

  return (
    <main className="min-h-screen bg-[#07070b] text-white p-6 md:p-10 lg:p-16">
      <div className="mx-auto max-w-[1600px]">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="max-w-3xl">
            <div className="text-xs font-bold uppercase tracking-[0.24em] text-[#caa7ff]">HQ Command</div>
            <h1 className="mt-4 text-5xl font-black tracking-tight md:text-7xl leading-[0.9]">
              Platform operations.
            </h1>
            <p className="mt-8 text-lg md:text-xl leading-relaxed text-white/60">
              Manage the EVNTSZN network from a single lane. Desks route specific work items while entity management handles the core platform records.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/epl/admin" className="ev-button-secondary border-white/10 bg-white/5 px-6">EPL Admin</Link>
            <Link href="/" className="ev-button-secondary border-white/10 bg-white/5 px-6">Public Site</Link>
          </div>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-[1fr_0.4fr]">
          <div className="grid gap-8 md:grid-cols-2">
            {/* Operations Desks */}
            <section className="rounded-[40px] border border-white/10 bg-[#0c0c15] p-8 md:p-10">
              <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#A259FF]">Operations</div>
              <h2 className="mt-6 text-3xl font-black">Active Desks</h2>
              <div className="mt-10 grid gap-4">
                {[
                  { label: "Organizer Desk", href: "/admin/organizer-desk", desc: "Manage independent operator applications and events." },
                  { label: "Venue Desk", href: "/admin/venue-desk", desc: "Review venue activations and Pro upgrades." },
                  { label: "Host Desk", href: "/admin/host-desk", desc: "Network staff oversight and marketplace assignments." },
                  { label: "Partner Desk", href: "/admin/partners-desk", desc: "Coordinate sponsorship deliverables and logos." },
                  { label: "Reserve Desk", href: "/admin/reserve-desk", desc: "High-pressure nightlife and dining ops." },
                ].map((desk) => (
                  <Link 
                    key={desk.label}
                    href={desk.href}
                    className="group rounded-3xl border border-white/5 bg-white/[0.02] p-6 transition-all hover:bg-white/[0.05] hover:border-white/15"
                  >
                    <div className="text-lg font-bold text-white group-hover:text-[#caa7ff] transition-colors">{desk.label}</div>
                    <div className="mt-2 text-sm text-white/50">{desk.desc}</div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Entity Management */}
            <section className="rounded-[40px] border border-white/10 bg-[#0c0c15] p-8 md:p-10">
              <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/40">Records</div>
              <h2 className="mt-6 text-3xl font-black">Entity Control</h2>
              <div className="mt-10 grid gap-4">
                {[
                  { label: "Event Management", href: "/admin/event-management", desc: "Global event visibility and ticket overrides." },
                  { label: "Venue Management", href: "/admin/venue-management", desc: "Direct venue profile and capacity control." },
                  { label: "Partner Management", href: "/admin/partner-management", desc: "Manage partner profiles and logo uploads." },
                  { label: "User Management", href: "/admin/user-management", desc: "Review member accounts and platform roles." },
                ].map((item) => (
                  <Link 
                    key={item.label}
                    href={item.href}
                    className="group rounded-3xl border border-white/5 bg-white/[0.02] p-6 transition-all hover:bg-white/[0.05] hover:border-white/15"
                  >
                    <div className="text-lg font-bold text-white group-hover:text-white transition-colors">{item.label}</div>
                    <div className="mt-2 text-sm text-white/50">{item.desc}</div>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-8">
            {/* System Health / Founder */}
            <section className="rounded-[40px] border border-[#A259FF]/20 bg-[#A259FF]/5 p-8">
              <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#caa7ff]">Founder</div>
              <h2 className="mt-6 text-2xl font-black">System Override</h2>
              <div className="mt-8 space-y-4">
                <Link href="/admin/founder/global-settings" className="block text-sm font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors">Global Settings →</Link>
                <Link href="/admin/founder/system-health" className="block text-sm font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors">System Health →</Link>
                <Link href="/admin/founder/override-log" className="block text-sm font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors">Override Log →</Link>
              </div>
            </section>

            <section className="rounded-[40px] border border-white/10 bg-white/[0.02] p-8">
              <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/40">Quick Stats</div>
              <div className="mt-8 space-y-6">
                <div>
                  <div className="text-sm font-medium text-white/50">Active Partners</div>
                  <div className="mt-1 text-3xl font-black">24</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-white/50">Venues Pro</div>
                  <div className="mt-1 text-3xl font-black">12</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-white/50">Open Tickets</div>
                  <div className="mt-1 text-3xl font-black">1,420</div>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
