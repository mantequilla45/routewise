'use client';

interface DatabaseHeaderProps {
  onExportAll: () => void;
  onRefresh: () => void;
}

export default function DatabaseHeader({ onExportAll, onRefresh }: DatabaseHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-white">Database Management</h1>
        <p className="text-gray-400 mt-1">Complete database overview and management</p>
      </div>
      <div className="flex space-x-3">
        <button
          onClick={onExportAll}
          className="px-4 py-2 bg-[#FFCC66] text-black font-semibold rounded-xl hover:bg-[#CC9933] transition-colors flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          <span>Export All</span>
        </button>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-[#4C4C4C] text-white border border-[#404040] rounded-xl hover:bg-[#404040] transition-colors flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span>Refresh</span>
        </button>
      </div>
    </div>
  );
}
