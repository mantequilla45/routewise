"use client";

import { useState, useEffect } from "react";

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
  const [stats, setStats] = useState({
    totalRoutes: 0,
    // activeDrivers: 0,
    todayTrips: 0,
    // revenue: 0,
  });

  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      // Fetch routes from the database
      const response = await fetch("/api/routes/add");
      const data = await response.json();

      if (data.success) {
        setStats((prev) => ({
          ...prev,
          totalRoutes: data.routes?.length || 0,
        }));

        // Get last 5 routes for recent activity
        setRecentRoutes(data.routes?.slice(-5).reverse() || []);
      }

      // Simulate other stats (these would come from their respective APIs)
      setStats((prev) => ({
        ...prev,
        activeDrivers: 156,
        todayTrips: 892,
        revenue: 45230,
      }));
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const statCards = [
    {
      title: "Total Routes",
      value: stats.totalRoutes,
      change: "+12%",
      changeType: "positive",
      icon: (
        <svg
          className="w-6 h-6"
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
      ),
      color: "blue",
    },
    // {
    //     title: 'Active Drivers',
    //     value: stats.activeDrivers,
    //     change: '+5%',
    //     changeType: 'positive',
    //     icon: (
    //         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    //         </svg>
    //     ),
    //     color: 'green'
    // },
    {
      title: "Today's Trips",
      value: stats.todayTrips.toLocaleString(),
      change: "-3%",
      changeType: "negative",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
      ),
      color: "purple",
    },
    // {
    //     title: 'Revenue',
    //     value: `₱${stats.revenue.toLocaleString()}`,
    //     change: '+18%',
    //     changeType: 'positive',
    //     icon: (
    //         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    //         </svg>
    //     ),
    //     color: 'yellow'
    // }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "from-blue-500 to-blue-600",
      green: "from-green-500 to-green-600",
      purple: "from-purple-500 to-purple-600",
      yellow: "from-yellow-500 to-yellow-600",
    };
    return colors[color as keyof typeof colors];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#1f1f1f]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFCC66]"></div>
        <p className="ml-4 text-white">Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>
        <p className="text-white mt-1">
          Here&apos;s what&apos;s happening with your routes today.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-[#CC9933] p-4 rounded-2xl">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Statistic Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {statCards.map((stat, index) => (
              <div
                key={index}
                className="rounded-2xl hover:shadow-2xl transition-shadow duration-200 overflow-hidden"
              >
                <div className="p-6 bg-[#3A3A3A]">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-[#CC9933]`}>
                      <span className="text-white">{stat.icon}</span>
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        stat.changeType === "positive"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {stat.change}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    {stat.value}
                  </h3>
                  <p className="text-sm text-white mt-1">{stat.title}</p>
                </div>
                <div className="h-1 bg-gradient-to-r from-transparent via-[#FFCC66] to-transparent"></div>
              </div>
            ))}
          </div>

          {/* Activity Chart */}
          <div className="bg-[#3A3A3A] rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                Route Activity (Total Fare)
              </h2>
              <select className="text-sm border border-gray-300 bg-white rounded-lg px-3 py-1 focus:outline-none focus:ring-1 focus:ring-[#CC9933]">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 3 months</option>
              </select>
            </div>

            <div className="space-y-3">
              {[
                { day: 1, value: 143, percentage: 81 },
                { day: 2, value: 98, percentage: 76 },
                { day: 3, value: 154, percentage: 85 },
                { day: 4, value: 213, percentage: 93 },
                { day: 5, value: 163, percentage: 89 },
              ].map((item) => (
                <div key={item.day} className="flex items-center space-x-4">
                  <span className="text-sm text-white w-16 flex-shrink-0">
                    Day {item.day}
                  </span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2 text-white">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-white w-12 text-right flex-shrink-0">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="h-full">
          {/* Recent Activity */}
          <div className="bg-[#3A3A3A] rounded-2xl shadow-sm p-6 h-full">
            <h2 className="text-lg font-semibold text-white mb-6">
              Recent Routes
            </h2>
            <div className="flex flex-col h-full justify-between">
              <div className="space-y-4 max-h-96 flex-1 overflow-y-auto">
                {recentRoutes.length > 0 ? (
                  recentRoutes.map((route, index) => (
                    <div
                      key={route.id || index}
                      className="flex items-start space-x-3 p-2 bg-[#404040] rounded-lg transition-colors hover:bg-[#4c4c4c]"
                    >
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0 text-white">
                        <p className="text-sm">
                          Route{" "}
                          <span className="font-semibold text-[#FFCC66]">
                            {route.route_code}
                          </span>
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {route.start_point_name} → {route.end_point_name}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 text-sm py-4">
                    No routes added yet
                  </div>
                )}
                {recentRoutes.length > 0 && (
                  <a
                    href="/routes"
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium inline-flex items-center mt-auto ml-auto pt-4"
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
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            href="/routes"
            className="bg-[#404040] p-4 rounded-xl hover:shadow-md transition-all duration-200 text-center block hover:scale-105"
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
            className="bg-[#404040] p-4 rounded-xl hover:shadow-md transition-all duration-200 text-center block hover:scale-104"
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
            <span className="text-sm font-medium text-white">
              Manage Routes
            </span>
          </a>
          <a
            href="/analytics"
            className="bg-[#404040] p-4 rounded-xl hover:shadow-md transition-all duration-200 text-center block hover:scale-105"
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
            <span className="text-sm font-medium text-white">
              View Analytics
            </span>
          </a>
          <a
            href="/settings"
            className="bg-[#404040] p-4 rounded-xl hover:shadow-md transition-all duration-200 text-center block hover:scale-105"
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
