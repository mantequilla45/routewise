'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface RecentRoute {
  id: string;
  route_code: string;
  created_at: string;
  distance?: number;
  start_point_name?: string;
  end_point_name?: string;
}

export default function DashboardPage() {
  const [recentRoutes, setRecentRoutes] = useState<RecentRoute[]>([]);
  const [totalRoutes, setTotalRoutes] = useState(0);

  const fetchDashboardData = async () => {
    try {
      const data = await api.routes.list<RecentRoute>();

      if (data.success) {
        setTotalRoutes(data.routes?.length || 0);
        setRecentRoutes(data.routes?.slice(-5).reverse() || []);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>
        <p className="text-gray-400 mt-1">
          Here&apos;s what&apos;s happening with your routes today.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Statistic Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl hover:shadow-2xl transition-shadow duration-200 overflow-hidden">
              <div className="p-6 bg-[#1A1A1A]">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-[#FFCC66]">
                    <svg
                      className="w-6 h-6 text-black"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                      />
                    </svg>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white">{totalRoutes}</h3>
                <p className="text-sm text-gray-400 mt-1">Total Routes</p>
              </div>
              <div className="h-1 bg-gradient-to-r from-transparent via-[#FFCC66] to-transparent"></div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="h-full">
          {/* Recent Routes */}
          <div className="bg-[#1A1A1A] rounded-2xl shadow-sm p-6 h-full">
            <h2 className="text-lg font-semibold text-[#FFCC66] mb-6">Recent Routes</h2>
            <div className="flex flex-col h-full justify-between">
              <div className="space-y-4 max-h-96 flex-1 overflow-y-auto">
                {recentRoutes.length > 0 ? (
                  recentRoutes.map((route, index) => (
                    <div
                      key={route.id || index}
                      className="flex items-start space-x-3 p-2 bg-[#1F1F1F] rounded-lg transition-colors hover:bg-[#252525]"
                    >
                      <div className="w-2 h-2 bg-[#FFCC66] rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0 text-white">
                        <p className="text-sm">
                          Route{' '}
                          <span className="font-semibold text-[#FFCC66]">{route.route_code}</span>
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {route.start_point_name} → {route.end_point_name}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-400 text-sm py-4">No routes added yet</div>
                )}
                {recentRoutes.length > 0 && (
                  <a
                    href="/routes"
                    className="text-sm text-[#FFCC66] hover:text-[#CC9933] font-medium inline-flex items-center mt-auto ml-auto pt-4 transition-colors"
                  >
                    View all routes
                    <svg
                      className="w-4 h-4 ml-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-[#FFCC66] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            href="/routes"
            className="bg-[#1F1F1F] p-4 rounded-xl hover:shadow-md transition-all duration-200 text-center block hover:scale-105"
          >
            <svg
              className="w-8 h-8 mx-auto mb-2 text-[#FFCC66]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            <span className="text-sm font-medium text-white">Add Route</span>
          </a>
          <a
            href="/routes"
            className="bg-[#1F1F1F] p-4 rounded-xl hover:shadow-md transition-all duration-200 text-center block hover:scale-105"
          >
            <svg
              className="w-8 h-8 mx-auto mb-2 text-[#FFCC66]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
            <span className="text-sm font-medium text-white">Manage Routes</span>
          </a>
          <a
            href="/analytics"
            className="bg-[#1F1F1F] p-4 rounded-xl hover:shadow-md transition-all duration-200 text-center block hover:scale-105"
          >
            <svg
              className="w-8 h-8 mx-auto mb-2 text-[#FFCC66]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <span className="text-sm font-medium text-white">View Analytics</span>
          </a>
          <a
            href="/settings"
            className="bg-[#1F1F1F] p-4 rounded-xl hover:shadow-md transition-all duration-200 text-center block hover:scale-105"
          >
            <svg
              className="w-8 h-8 mx-auto mb-2 text-[#FFCC66]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
            </svg>
            <span className="text-sm font-medium text-white">Settings</span>
          </a>
        </div>
      </div>
    </div>
  );
}
