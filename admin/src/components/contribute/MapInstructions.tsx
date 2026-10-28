export default function MapInstructions() {
  return (
    <div className="mt-6 lg:mt-8 flex flex-col lg:flex-row gap-4 lg:gap-6">
      {/* Legend */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 w-1/3">
        <h4 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">Map Legend</h4>
        <div className="flex flex-col gap-5 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-[10px]">
              ✕
            </div>
            <span className="text-gray-700">Start Point</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-[10px]">
              O
            </div>
            <span className="text-gray-700">End Point</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-[10px]">
              •
            </div>
            <span className="text-gray-700">Waypoints</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-1 rounded" style={{ backgroundColor: '#FF6B6B' }}></div>
            <span className="text-gray-700">Route Path</span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 w-2/3">
        <h4 className="font-semibold text-blue-900 mb-3 text-sm sm:text-base flex items-center">
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          How to Map a Route
        </h4>
        <div className="space-y-3 text-xs sm:text-sm text-blue-800">
          <div>
            <p className="font-semibold mb-1">Adding Points:</p>
            <ul className="ml-3 space-y-0.5">
              <li>• Click anywhere on map → Add waypoint at end</li>
              <li>• Click on blue line → Insert between points</li>
              <li>• Minimum 2 points required</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-1">Editing Points:</p>
            <ul className="ml-3 space-y-0.5">
              <li>• Select point from list → Click map to move</li>
              <li>• Click &quot;Insert&quot; button → Add point after selected</li>
              <li>• Click &quot;Remove&quot; button → Remove point</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-1">Final Step:</p>
            <ul className="ml-3 space-y-0.5">
              <li>• After placing all pins → Click &quot;Close Loop&quot; button</li>
              <li>• This connects the end point back to start</li>
            </ul>
          </div>
          <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-300">
            <p className="text-yellow-800 font-semibold">
              ⚠️ Important: Pin order defines travel direction!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
