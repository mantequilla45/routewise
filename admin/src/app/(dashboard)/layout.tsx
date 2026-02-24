"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#111111]">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div
        className={`bg-[#111111] flex-1 flex flex-col overflow-hidden transition-all duration-300`}
      >
        <Header />
        <main className="flex-1 px-10 pb-6 overflow-hidden flex flex-col">
          <div className="animate-fade-in flex-1 min-h-0 flex flex-col">{children}</div>
        </main>
      </div>
    </div>
  );
}
