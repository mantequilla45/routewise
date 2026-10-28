'use client';

import type { ReactNode } from 'react';

interface DatabaseStatsProps {
  totalTables: number;
  totalRows: number;
  totalColumns: number;
}

interface StatCardProps {
  label: string;
  value: ReactNode;
  iconPath: string;
}

function StatCard({ label, value, iconPath }: StatCardProps) {
  return (
    <div className="bg-[#3A3A3A] rounded-xl p-6 border-2 border-[#FFCC66]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">{label}</p>
          {value}
        </div>
        <div className="p-3 bg-[#FFCC66] rounded-lg">
          <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default function DatabaseStats({
  totalTables,
  totalRows,
  totalColumns,
}: DatabaseStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatCard
        label="Total Tables"
        value={<p className="text-2xl font-bold text-white mt-1">{totalTables}</p>}
        iconPath="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
      />
      <StatCard
        label="Total Rows"
        value={<p className="text-2xl font-bold text-white mt-1">{totalRows.toLocaleString()}</p>}
        iconPath="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
      <StatCard
        label="Total Columns"
        value={<p className="text-2xl font-bold text-white mt-1">{totalColumns}</p>}
        iconPath="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
      />
      <StatCard
        label="Database"
        value={<p className="text-sm font-semibold text-[#FFCC66] mt-1">PostgreSQL + PostGIS</p>}
        iconPath="M5 13l4 4L19 7"
      />
    </div>
  );
}
