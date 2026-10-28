'use client';

import type { DatabaseViewMode } from '@/hooks/useDatabaseTables';

interface TableControlsProps {
  selectedTable: string;
  viewMode: DatabaseViewMode;
  onViewModeChange: (mode: DatabaseViewMode) => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  onExport: () => void;
}

const VIEW_MODES: { mode: DatabaseViewMode; label: string }[] = [
  { mode: 'table', label: 'Table' },
  { mode: 'schema', label: 'Schema' },
  { mode: 'raw', label: 'JSON' },
];

export default function TableControls({
  selectedTable,
  viewMode,
  onViewModeChange,
  searchTerm,
  onSearchTermChange,
  onExport,
}: TableControlsProps) {
  return (
    <div className="rounded-xl p-4 mb-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-between space-x-4">
          <h3 className="font-semibold text-[#FFCC66]">{selectedTable}</h3>
          <div className="flex space-x-2">
            {VIEW_MODES.map(({ mode, label }) => (
              <button
                key={mode}
                onClick={() => onViewModeChange(mode)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  viewMode === mode
                    ? 'bg-[#3A3A3A] text-white'
                    : 'text-gray-400 hover:bg-[#3A3A3A] hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="text"
            placeholder="Search in table..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="px-4 py-2 bg-[#2D2D2D] border border-[#4C4C4C] text-white rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFCC66] focus:border-[#FFCC66]"
          />
          <button
            onClick={onExport}
            className="px-3 py-2 bg-[#4C4C4C] hover:bg-[#404040] text-white rounded-lg transition-colors cursor-pointer"
            title="Export this table"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
