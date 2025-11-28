'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactElement, useState } from 'react';

interface NavItem {
    label: string;
    href: string;
    icon: ReactElement;
    badge?: number;
}

export default function Sidebar() {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const navItems: NavItem[] = [
        {
            label: 'Dashboard',
            href: '/dashboard',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            )
        },
        {
            label: 'Routes Management',
            href: '/routes',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
            )
        },
        {
            label: 'Database',
            href: '/database',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
            )
        },
        {
            label: 'Analytics',
            href: '/analytics',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            )
        },
        {
            label: 'Settings',
            href: '/settings',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            )
        }
    ];

    return (
        <aside className={`${isCollapsed ? 'w-20' : 'w-64'} transition-all duration-300 bg-white border-r border-gray-100 min-h-screen flex flex-col`}>
            {/* Logo Section */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div className={`flex items-center space-x-3 ${isCollapsed ? 'justify-center' : ''}`}>
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </div>
                    {!isCollapsed && (
                        <div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">RouteWise</h1>
                            <p className="text-xs text-gray-500">Admin Panel</p>
                        </div>
                    )}
                </div>
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={`p-1.5 hover:bg-gray-50 rounded-lg transition-all ${isCollapsed ? 'mx-auto' : ''}`}
                >
                    <svg className={`w-5 h-5 text-gray-400 hover:text-gray-600 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                                isActive 
                                    ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600 shadow-sm' 
                                    : 'hover:bg-gray-50 text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <div className="flex items-center space-x-3">
                                <span className={`${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'} transition-colors`}>
                                    {item.icon}
                                </span>
                                {!isCollapsed && (
                                    <span className="font-medium text-sm">{item.label}</span>
                                )}
                            </div>
                            {item.badge && !isCollapsed && (
                                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                    {item.badge}
                                </span>
                            )}
                            {isActive && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-blue-600 rounded-r-full" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User Section */}
            <div className="p-4 border-t border-gray-100 bg-gray-50">
                <div className={`flex items-center space-x-3 p-3 rounded-xl hover:bg-white cursor-pointer transition-all group ${isCollapsed ? 'justify-center' : ''}`}>
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-md">
                        <span className="text-white font-semibold text-sm">A</span>
                    </div>
                    {!isCollapsed && (
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">Admin User</p>
                            <p className="text-xs text-gray-500">admin@routewise.com</p>
                        </div>
                    )}
                    {!isCollapsed && (
                        <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    )}
                </div>
            </div>
        </aside>
    );
}