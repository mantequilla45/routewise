'use client';

interface RoutesToolbarProps {
  totalCount: number;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

/** Heading, total route count badge and the search box above the routes table. */
export default function RoutesToolbar({
  totalCount,
  searchTerm,
  onSearchChange,
}: RoutesToolbarProps) {
  return (
    <div className="flex justify-between items-center px-3">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-white">Existing Routes</h2>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#2A2A2A] border border-[#333] text-sm text-gray-400 font-medium">
          {totalCount}
        </span>
      </div>
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search routes..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-[#FFCC66] focus:border-[#FFCC66] text-sm w-52"
        />
      </div>
    </div>
  );
}
