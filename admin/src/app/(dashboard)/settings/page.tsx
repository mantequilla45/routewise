'use client';

import { useState } from 'react';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('general');

    const tabs = [
        { id: 'general', label: 'General', icon: '⚙️' },
        { id: 'maps', label: 'Maps', icon: '🗺️' },
        { id: 'notifications', label: 'Notifications', icon: '🔔' },
        { id: 'security', label: 'Security', icon: '🔒' },
        { id: 'api', label: 'API Keys', icon: '🔑' },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-500 mt-2">Manage your application preferences and configuration</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm">
                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6" aria-label="Tabs">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
                    {activeTab === 'general' && (
                        <div className="space-y-6 animate-fade-in">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">General Settings</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Company Name
                                        </label>
                                        <input
                                            type="text"
                                            defaultValue="RouteWise Transport Co."
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Default Language
                                        </label>
                                        <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                            <option>English</option>
                                            <option>Filipino</option>
                                            <option>Cebuano</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Time Zone
                                        </label>
                                        <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                            <option>Asia/Manila (GMT+8)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'maps' && (
                        <div className="space-y-6 animate-fade-in">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Maps Configuration</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Default Map Center
                                        </label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <input
                                                type="text"
                                                placeholder="Latitude"
                                                defaultValue="10.3157"
                                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Longitude"
                                                defaultValue="123.8854"
                                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
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
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="traffic" className="text-sm text-gray-700">
                                            Show traffic layer by default
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="space-y-6 animate-fade-in">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
                                <div className="space-y-4">
                                    {['New route additions', 'Driver registrations', 'System alerts', 'Performance reports'].map((item) => (
                                        <div key={item} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{item}</p>
                                                <p className="text-xs text-gray-500">Receive notifications for {item.toLowerCase()}</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" defaultChecked className="sr-only peer" />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="space-y-6 animate-fade-in">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>
                                <div className="space-y-4">
                                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <div className="flex">
                                            <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            <div>
                                                <p className="text-sm font-medium text-yellow-800">Two-Factor Authentication</p>
                                                <p className="text-xs text-yellow-600 mt-1">Enhance your account security with 2FA</p>
                                            </div>
                                        </div>
                                        <button className="mt-3 text-sm text-yellow-800 font-medium hover:text-yellow-900">
                                            Enable 2FA →
                                        </button>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Session Timeout (minutes)
                                        </label>
                                        <input
                                            type="number"
                                            defaultValue="30"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'api' && (
                        <div className="space-y-6 animate-fade-in">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">API Configuration</h3>
                                <div className="space-y-4">
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">Google Maps API</p>
                                                <p className="text-xs text-gray-500 mt-1">Used for map visualization</p>
                                            </div>
                                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Active</span>
                                        </div>
                                        <div className="mt-3 flex space-x-2">
                                            <input
                                                type="password"
                                                defaultValue="AIzaSy..."
                                                disabled
                                                className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded bg-white"
                                            />
                                            <button className="text-sm text-blue-600 hover:text-blue-700">Edit</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Save Button */}
                <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                    <button className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}