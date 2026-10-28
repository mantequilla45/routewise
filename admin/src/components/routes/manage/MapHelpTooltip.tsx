'use client';

/** "?" button that reveals mapping instructions on hover. */
export default function MapHelpTooltip() {
  return (
    <div className="relative group">
      <button
        type="button"
        className="w-7 h-7 flex items-center justify-center rounded-full bg-[#2A2A2A] border border-[#333] text-gray-400 hover:text-[#FFCC66] hover:border-[#FFCC66]/40 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>
      <div className="absolute right-0 top-9 z-50 w-72 hidden group-hover:block">
        <div className="bg-[#1A1A1A] border border-[#333] rounded-xl p-4 shadow-2xl space-y-3 text-xs text-gray-300">
          <p className="text-[#FFCC66] font-semibold text-sm">How to Map a Route</p>
          <div>
            <p className="font-semibold text-white mb-1">Adding Points:</p>
            <ul className="ml-3 space-y-0.5">
              <li>• Click anywhere on map → Add waypoint at end</li>
              <li>• Click on blue line → Insert between points</li>
              <li>• Minimum 2 points required</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-white mb-1">Editing Points:</p>
            <ul className="ml-3 space-y-0.5">
              <li>• Select point from list → Click map to move</li>
              <li>• Click &quot;Insert&quot; → Add point after selected</li>
              <li>• Click &quot;✕&quot; → Remove point</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-white mb-1">Final Step:</p>
            <ul className="ml-3 space-y-0.5">
              <li>• Place all pins → Click &quot;Close Loop&quot;</li>
              <li>• Connects the end point back to start</li>
            </ul>
          </div>
          <div className="p-2 bg-[#2A2500] rounded border border-[#FFCC66]/40">
            <p className="text-[#FFCC66] font-semibold">⚠️ Pin order defines travel direction!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
