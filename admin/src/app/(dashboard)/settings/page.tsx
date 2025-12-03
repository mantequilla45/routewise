"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");

  const tabs = [
    { id: "general", label: "General", icon: "⚙️" },
    { id: "maps", label: "Maps", icon: "🗺️" },
    { id: "notifications", label: "Notifications", icon: "🔔" },
    // { id: "security", label: "Security", icon: "🔒" },
    // { id: "api", label: "API Keys", icon: "🔑" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-white mt-1">
          Manage your application preferences and configuration
        </p>
      </div>

      <div className="bg-[#3A3A3A] rounded-2xl">
        {/* Tabs */}
        <div>
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-[#FFCC66] text-[#FFCC66]"
                    : "border-transparent text-gray-400 cursor-pointer"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "general" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-lg font-medium text-white mb-4">
                  General Settings
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Company Name
                    </label>
                    <input
                      type="text"
                      defaultValue="RouteWise Transport Co."
                      className="text-white w-full px-4 py-2 border border-[#CC9933] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CC9933]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Default Language
                    </label>
                    <select className="text-white bg-[#3A3A3A] w-full px-4 py-2 border border-[#CC9933] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CC9933]">
                      <option>English</option>
                      <option>Filipino</option>
                      <option>Cebuano</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Time Zone
                    </label>
                    <select className="text-white bg-[#3A3A3A] w-full px-4 py-2 border border-[#CC9944] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CC9933]">
                      <option>Asia/Manila (GMT+8)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "maps" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-lg font-medium text-white mb-4">
                  Maps Configuration
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Default Map Center
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Latitude"
                        defaultValue="10.3157"
                        className="text-white w-full px-4 py-2 border border-[#CC9933] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CC9933]"
                      />
                      <input
                        type="text"
                        placeholder="Longitude"
                        defaultValue="123.8854"
                        className="text-white w-full px-4 py-2 border border-[#CC9933] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CC9933]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Default Zoom Level
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="20"
                      defaultValue="13"
                      className="w-full"
                    />
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="traffic"
                      defaultChecked
                      className="h-4 w-4 text-[#CCFF66] focus:ring-[#CCFF66] border-gray-300 rounded cursor-pointer"
                    />
                    <label htmlFor="traffic" className="text-sm text-gray-300">
                      Show traffic layer by default
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-lg font-medium text-white mb-4">
                  Notification Preferences
                </h3>
                <div className="space-y-4 text-white">
                  {[
                    "New route additions",
                    "Driver registrations",
                    "System alerts",
                    "Performance reports",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center justify-between p-4 rounded-lg "
                    >
                      <div>
                        <p className="text-sm font-medium text-white">{item}</p>
                        <p className="text-xs text-gray-300">
                          Receive notifications for {item.toLowerCase()}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-500 peer-focus:outline-none peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-lg font-medium text-white mb-4">
                  Security Settings
                </h3>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg">
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 text-yellow-600 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-white">
                          Two-Factor Authentication
                        </p>
                        <p className="text-xs text-white mt-1">
                          Enhance your account security with 2FA
                        </p>
                      </div>
                    </div>
                    <button className="bg-gradient-to-b from-[#FFCC66] to-[#CC9933] p-3 rounded-md mt-3 text-sm text-black font-medium cursor-pointer">
                      Enable 2FA →
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Session Timeout (minutes)
                    </label>
                    <input
                      type="number"
                      defaultValue="30"
                      className="text-white bg-[#3A3A3A] w-full px-4 py-2 border border-[#CC9944] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CC9933]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "api" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-lg font-medium text-white mb-4">
                  API Configuration
                </h3>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg border border-[#CC9933] rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-white">
                          Google Maps API
                        </p>
                        <p className="text-xs text-gray-300 mt-1">
                          Used for map visualization
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        Active
                      </span>
                    </div>
                    <div className="mt-3 flex space-x-2">
                      <input
                        type="password"
                        defaultValue="AIzaSy..."
                        disabled
                        className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded bg-white"
                      />
                      <button className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer">
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="px-6 py-6 border-gray-200 flex justify-end">
          <button className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
