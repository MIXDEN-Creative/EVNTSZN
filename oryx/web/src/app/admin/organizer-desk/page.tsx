// src/app/admin/organizer-desk/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';

// Placeholder interfaces for organizer applications and statuses
interface OrganizerApplication {
  id: string;
  organizerName: string;
  contactName: string;
  contactEmail: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing';
  appliedAt: string;
  tier: 'free' | 'pro';
}

// Mock data for organizer applications
const MOCK_ORGANIZER_APPLICATIONS: OrganizerApplication[] = [
  { id: 'org-1', organizerName: 'City Nights Events', contactName: 'Alice Johnson', contactEmail: 'alice@citynights.com', status: 'pending', appliedAt: '2024-05-10', tier: 'pro' },
  { id: 'org-2', organizerName: 'Local Vibes Group', contactName: 'Bob Williams', contactEmail: 'bob@localvibes.com', status: 'approved', appliedAt: '2024-05-09', tier: 'free' },
  { id: 'org-3', organizerName: 'Party Planners Inc.', contactName: 'Charlie Brown', contactEmail: 'charlie@partyplanners.com', status: 'rejected', appliedAt: '2024-05-08', tier: 'pro' },
  { id: 'org-4', organizerName: 'Weekend Warriors', contactName: 'Diana Miller', contactEmail: 'diana@weekendwarriors.com', status: 'processing', appliedAt: '2024-05-07', tier: 'free' },
  { id: 'org-5', organizerName: 'Event Masters Co.', contactName: 'Ethan Davis', contactEmail: 'ethan@eventmasters.com', status: 'pending', appliedAt: '2024-05-06', tier: 'pro' },
];

const OrganizerDeskPage = () => {
  const [applications, setApplications] = useState<OrganizerApplication[]>(MOCK_ORGANIZER_APPLICATIONS);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'processing'>('all');

  const filteredApplications = applications.filter(app => {
    if (filterStatus === 'all') return true;
    return app.status === filterStatus;
  });

  const getStatusBadgeClass = (status: OrganizerApplication['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'approved': return 'bg-green-500/20 text-green-400';
      case 'rejected': return 'bg-red-500/20 text-red-400';
      case 'processing': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const handleStatusChange = (status: 'all' | 'pending' | 'approved' | 'rejected' | 'processing') => {
    setFilterStatus(status);
  };

  // Placeholder functions for actions
  const handleApprove = (id: string) => {
    console.log(`Approving application ${id}`);
    // In a real app, this would trigger an API call and update state
    setApplications(apps => apps.map(app => app.id === id ? { ...app, status: 'approved' } : app));
  };

  const handleReject = (id: string) => {
    console.log(`Rejecting application ${id}`);
    setApplications(apps => apps.map(app => app.id === id ? { ...app, status: 'rejected' } : app));
  };

  const handleProcess = (id: string) => {
    console.log(`Marking application ${id} as processing`);
    setApplications(apps => apps.map(app => app.id === id ? { ...app, status: 'processing' } : app));
  };

  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <h1 className="text-4xl font-bold mb-6 text-purple-400">Organizer Desk</h1>
      <p className="text-lg text-gray-300 mb-8">
        Review and manage incoming applications from Independent Organizers.
      </p>

      {/* Filter Buttons */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button onClick={() => handleStatusChange('all')} className={`px-4 py-2 rounded-md font-semibold text-sm transition-colors ${filterStatus === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>All</button>
        <button onClick={() => handleStatusChange('pending')} className={`px-4 py-2 rounded-md font-semibold text-sm transition-colors ${filterStatus === 'pending' ? 'bg-yellow-500/30 text-yellow-400' : 'bg-gray-700 hover:bg-gray-600'}`}>Pending</button>
        <button onClick={() => handleStatusChange('approved')} className={`px-4 py-2 rounded-md font-semibold text-sm transition-colors ${filterStatus === 'approved' ? 'bg-green-500/30 text-green-400' : 'bg-gray-700 hover:bg-gray-600'}`}>Approved</button>
        <button onClick={() => handleStatusChange('rejected')} className={`px-4 py-2 rounded-md font-semibold text-sm transition-colors ${filterStatus === 'rejected' ? 'bg-red-500/30 text-red-400' : 'bg-gray-700 hover:bg-gray-600'}`}>Rejected</button>
        <button onClick={() => handleStatusChange('processing')} className={`px-4 py-2 rounded-md font-semibold text-sm transition-colors ${filterStatus === 'processing' ? 'bg-blue-500/30 text-blue-400' : 'bg-gray-700 hover:bg-gray-600'}`}>Processing</button>
      </div>

      {/* Applications Table */}
      <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Organizer Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Contact Email</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Tier</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Applied</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {filteredApplications.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-400">No applications found for the selected filter.</td>
              </tr>
            ) : (
              filteredApplications.map((app) => (
                <tr key={app.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{app.organizerName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{app.contactEmail}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{app.tier === 'pro' ? 'Pro' : 'Free'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{new Date(app.appliedAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(app.status)}`}>
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {app.status === 'pending' && (
                      <>
                        <button onClick={() => handleApprove(app.id)} className="text-green-400 hover:text-green-300">Approve</button>
                        <button onClick={() => handleReject(app.id)} className="text-red-400 hover:text-red-300">Reject</button>
                        <button onClick={() => handleProcess(app.id)} className="text-blue-400 hover:text-blue-300">Processing</button>
                      </>
                    )}
                    {app.status === 'processing' && (
                      <>
                        <button onClick={() => handleApprove(app.id)} className="text-green-400 hover:text-green-300">Approve</button>
                        <button onClick={() => handleReject(app.id)} className="text-red-400 hover:text-red-300">Reject</button>
                      </>
                    )}
                    {(app.status === 'approved' || app.status === 'rejected') && (
                      <button onClick={() => handleReject(app.id)} className="text-red-400 hover:text-red-300">Remove</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrganizerDeskPage;
