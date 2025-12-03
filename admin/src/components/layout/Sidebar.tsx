"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactElement, useState, useEffect } from "react";
import {
  Home,
  MapPin,
  Database,
  BarChart3,
  Settings,
  LogOut,
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
  const [pathname, setPathname] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPathname(window.location.pathname);
    }

    const handlePopState = () => {
      setPathname(window.location.pathname);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleLogout = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("authToken");
    }

    try {
      // 1. Call the API route to clear the secure Supabase cookies on the server.
      const response = await fetch("/api/logout", {
        method: "POST",
      });

      if (response.ok) {
        // 2. CRITICAL FIX: Use window.location.href for a full, hard reload.
        // This is the most reliable way to force the middleware to re-run
        // with the session cleared.
        if (typeof window !== "undefined") {
          window.location.href = "/";
        }
      } else {
        console.error("Logout failed on server:", response.statusText);
        // Fallback: Still attempt to reload
        if (typeof window !== "undefined") {
          window.location.href = "/";
        }
      }
    } catch (error) {
      console.error("Error during logout API call:", error);
      // Fallback hard navigation if API fails
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
  };

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
      } transition-all duration-300 bg-[#2D2D2D] h-screen sticky top-0 left-0 flex flex-col`}
    >
      {/* Logo Section */}
      <div className="flex items-center justify-between p-6 h-[72px] border-none border-gray-100">
        <div
          className={`flex items-center space-x-3 mt-1
                ${isCollapsed ? "justify-start w-full" : ""}`}
        >
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-10 h-10 min-w-10 min-h-10 flex items-center justify-center border-none transition-all duration-300 cursor-pointer focus:outline-none shadow-none bg-transparent active:scale-100"
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
              <h1 className="text-xl font-bold text-white">RouteWise</h1>
              <p className="text-xs text-white">Admin Panel</p>
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
              className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group relative ${
                isActive
                  ? "bg-[#3A3A3A] text-white shadow-sm"
                  : "hover:bg-[#404040] text-gray-600 hover:text-[#CC9933]"
              }`}
            >
              <div className="flex items-start space-x-3">
                <span
                  className={`${
                    isActive
                      ? "text-[#FFCC66]"
                      : "text-gray-600 group-hover:text-[#CC9933]"
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
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#FFCC66] to-[#CC9933] rounded-r-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-2 border-t">
        <div
          className={`flex items-center space-x-3 p-3 rounded-xl transition-all group ${
            isCollapsed ? "justify-start w-full" : ""
          }`}
        >
          <div className="w-10 h-10 min-w-10 min-h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-md">
            <span className="text-white font-semibold text-sm">A</span>
          </div>

          {!isCollapsed && (
            <div className="flex-1">
              <p className="text-sm font-medium text-white flex justify-start">
                Admin
              </p>
              <p className="text-xs text-gray-400 flex justify-start">
                admin@routewise.com
              </p>
            </div>
          )}
          <button onClick={handleLogout}>
            {!isCollapsed && (
              <LogOut className="w-4 h-4 text-gray-400 hover:text-gray-900 transition-colors cursor-pointer" />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
