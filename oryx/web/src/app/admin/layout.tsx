import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin("/admin");

  return (
    <div className="min-h-screen bg-[#06070b] text-white">
      <div className="mx-auto grid min-h-screen max-w-[1720px] gap-6 px-4 py-4 md:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <aside className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02)),rgba(6,7,11,0.88)] p-5 backdrop-blur-2xl">
          <Link href="/admin" className="block rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-4">
            <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#caa7ff]">HQ Admin</div>
            <div className="mt-2 text-2xl font-black tracking-tight text-white">EVNTSZN</div>
          </Link>

          <nav className="mt-6 space-y-2">
            {[
              { href: "/admin", label: "Overview" },
              { href: "/admin/organizer-desk", label: "Organizer Desk" },
              { href: "/admin/host-desk", label: "Curator Desk" },
              { href: "/admin/venue-desk", label: "Venue Desk" },
              { href: "/admin/reserve-desk", label: "Reserve Desk" },
              { href: "/admin/partners-desk", label: "Sponsor Desk" },
              { href: "/admin/partner-management", label: "Sponsor Records" },
              { href: "/epl/admin", label: "EPL Admin" },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="block rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-white/74 transition hover:border-white/16 hover:bg-white/[0.06] hover:text-white">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-6 rounded-[24px] border border-white/10 bg-black/30 px-4 py-4 text-sm leading-6 text-white/58">
            Founder and sponsorship queues now route to real desk pages instead of dead admin paths.
          </div>
        </aside>

        <main className="min-w-0 rounded-[32px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015)),rgba(4,5,9,0.72)] p-4 backdrop-blur-xl md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
