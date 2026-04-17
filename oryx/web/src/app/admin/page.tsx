// src/app/admin/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';

const AdminDashboardPage = () => {
  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <h1 className="text-4xl font-bold mb-6 text-purple-400">Welcome to the Admin Dashboard</h1>
      <p className="text-lg text-gray-300 mb-8">
        Manage all aspects of the EVNTSZN platform, from applications and operations to content and settings.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Quick Links to Desks */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-purple-300">Operations Desks</h2>
          <ul className="space-y-3">
            <li><Link href="/admin/organizer-desk" className="text-gray-300 hover:text-white">Organizer Desk</Link></li>
            <li><Link href="/admin/venue-desk" className="text-gray-300 hover:text-white">Venue Desk</Link></li>
            <li><Link href="/admin/host-desk" className="text-gray-300 hover:text-white">Host Desk</Link></li>
            <li><Link href="/admin/partners-desk" className="text-gray-300 hover:text-white">Partner Desk</Link></li>
            <li><Link href="/admin/crew-desk" className="text-gray-300 hover:text-white">Crew Desk</Link></li>
            <li><Link href="/admin/reserve-desk" className="text-gray-300 hover:text-white">Reserve Desk</Link></li>
            <li><Link href="/admin/epl-operations" className="text-gray-300 hover:text-white">EPL Operations</Link></li>
            {/* Add more desks as they are developed */}
          </ul>
        </div>

        {/* Quick Links to Management Areas */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-blue-300">Platform Management</h2>
          <ul className="space-y-3">
            <li><Link href="/admin/content-management" className="text-gray-300 hover:text-white">Content Management</Link></li>
            <li><Link href="/admin/user-management" className="text-gray-300 hover:text-white">User Management</Link></li>
            <li><Link href="/admin/event-management" className="text-gray-300 hover:text-white">Event Management</Link></li>
            <li><Link href="/admin/venue-management" className="text-gray-300 hover:text-white">Venue Management</Link></li>
            <li><Link href="/admin/epl-teams" className="text-gray-300 hover:text-white">EPL Team Management</Link></li>
            {/* Add more management sections */}
          </ul>
        </div>

        {/* Founder Controls - Placeholder */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-red-300">Founder Controls</h2>
          <ul className="space-y-3">
            <li><Link href="/admin/founder/global-settings" className="text-gray-300 hover:text-white">Global Settings</Link></li>
            <li><Link href="/admin/founder/override-log" className="text-gray-300 hover:text-white">Override Log</Link></li>
            <li><Link href="/admin/founder/system-health" className="text-gray-300 hover:text-white">System Health</Link></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
