import { requireAdmin } from "@/lib/admin-auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin("/admin");

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <aside className="w-64 bg-gray-800 p-4 flex flex-col justify-between">
        <div>
          <div className="mb-8 text-2xl font-bold text-purple-400">Admin Dashboard</div>
          <nav className="space-y-2">
            <a href="/admin/overview" className="block py-2 px-3 rounded-md hover:bg-gray-700">Overview</a>
            <a href="/admin/organizer-desk" className="block py-2 px-3 rounded-md hover:bg-gray-700">Organizer Desk</a>
            <a href="/admin/venue-desk" className="block py-2 px-3 rounded-md hover:bg-gray-700">Venue Desk</a>
            <a href="/admin/host-desk" className="block py-2 px-3 rounded-md hover:bg-gray-700">Host Desk</a>
            <a href="/admin/reserve-desk" className="block py-2 px-3 rounded-md hover:bg-gray-700">Reserve Desk</a>
            <a href="/admin/epl-operations" className="block py-2 px-3 rounded-md hover:bg-gray-700">EPL Operations</a>
            <a href="/admin/partners-desk" className="block py-2 px-3 rounded-md hover:bg-gray-700">Partners Desk</a>
          </nav>
        </div>
        <div className="mt-auto">
          <a href="/auth/logout" className="block py-2 px-3 rounded-md hover:bg-gray-700 text-red-400">Logout</a>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  );
}
