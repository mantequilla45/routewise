'use client';

import type { RouteManagementTab } from '@/lib/routes/types';

interface RouteManagementTabsProps {
  activeTab: RouteManagementTab;
  pendingCount: number;
  onSelectTab: (tab: RouteManagementTab) => void;
}

const TABS: { id: RouteManagementTab; label: string }[] = [
  { id: 'add', label: 'Add New Route' },
  { id: 'list', label: 'View All Routes' },
  { id: 'review', label: 'Review Contributions' },
];

export default function RouteManagementTabs({
  activeTab,
  pendingCount,
  onSelectTab,
}: RouteManagementTabsProps) {
  return (
    <div className="border-b border-[#222222]">
      <div className="flex px-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`px-6 py-4 font-medium transition-colors relative ${
              activeTab === tab.id ? 'text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
            {tab.id === 'review' && pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {pendingCount}
              </span>
            )}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FFCC66] rounded-t-full" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
