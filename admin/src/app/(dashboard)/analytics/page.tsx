"use client";

export default function AnalyticsPage() {
  const metrics = [
    { label: "Average Trip Duration", value: "32 min", trend: "+2.5%" },
    { label: "Peak Hours", value: "7-9 AM", trend: "Consistent" },
    { label: "Route Efficiency", value: "87%", trend: "+5%" },
    { label: "Customer Satisfaction", value: "4.6/5", trend: "+0.3" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white">Analytics</h1>
        <p className="text-white mt-1">
          Track performance metrics and route efficiency
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className="bg-[#3A3A3A] rounded-xl p-6 transition-all border-2 border-[#CC9933]"
          >
            <h3 className="text-sm font-medium text-gray-300 mb-2">
              {metric.label}
            </h3>
            <p className="text-2xl font-bold text-white">{metric.value}</p>
            <p className="text-sm text-[#FFCC66] mt-2">{metric.trend}</p>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6">
        {/* Route Performance Chart */}
        <div className="bg-[#3A3A3A] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Route Performance
          </h2>
          <div className="h-64 flex items-center justify-center text-white">
            <svg
              className="w-16 h-16"
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
          </div>
        </div>

        {/* Driver Performance
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Top Performing Drivers
          </h2>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Driver {i}
                    </p>
                    <p className="text-xs text-gray-500">Route {10 + i}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-green-600">
                  {95 - i * 2}%
                </span>
              </div>
            ))}
          </div>
        </div> */}
      </div>
    </div>
  );
}
