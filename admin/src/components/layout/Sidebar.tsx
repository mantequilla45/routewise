"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactElement } from "react";
import { 
  Home, 
  MapPin, 
  Database, 
  BarChart3, 
  Settings,
  LogOut 
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: ReactElement;
  badge?: number;
}

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export default function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <Home className="w-5 h-5" />,
    },
    {
      label: "Routes Management",
      href: "/routes",
      icon: <MapPin className="w-5 h-5" />,
    },
    {
      label: "Database",
      href: "/database",
      icon: <Database className="w-5 h-5" />,
    },
    {
      label: "Analytics",
      href: "/analytics",
      icon: <BarChart3 className="w-5 h-5" />,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  return (
    <aside
      className={`${
        isCollapsed ? "w-22" : "w-65"
      } fixed left-0 top-0 h-screen transition-all duration-300 border-r border-gray-100 flex flex-col bg-white z-30`}
    >
      {/* Logo Section */}
      <div className="flex items-center justify-between p-6 h-[72px] border-none border-gray-100">
        <div
          className={`flex items-center space-x-3 
                ${isCollapsed ? "justify-left w-full" : ""}`}
        >
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-10 h-10 min-w-10 min-h-10 flex items-center justify-center border-none transition-all duration-200 cursor-pointer focus:outline-none shadow-none bg-transparent active:scale-100"
          >
            <Image
              src="/icon.svg"
              alt="Routewise Icon"
              width={40}
              height={40}
              priority
            />
          </button>
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-bold text-[#3A3A3A]">RouteWise</h1>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          )}
        </div>

        {/* {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="hover:bg-gray-50 transition-all focus:outline-none shadow-none"
          >
            <svg
              className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
          </button>
        )} */}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 flex flex-col justify-start">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                isActive
                  ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600 shadow-sm"
                  : "hover:bg-gray-50 text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-left space-x-3">
                <span
                  className={`${
                    isActive
                      ? "text-blue-600"
                      : "text-gray-400 group-hover:text-gray-600"
                  } transition-colors`}
                >
                  {item.icon}
                </span>
                {!isCollapsed && (
                  <span className="font-medium text-sm w-[250px]">
                    {item.label}
                  </span>
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
        <div
          className={`flex items-center space-x-3 p-3 rounded-xl hover:bg-white cursor-pointer transition-all group ${
            isCollapsed ? "justify-center" : ""
          }`}
        >
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
            <LogOut className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
          )}
        </div>
      </div>
    </aside>
  );
}
