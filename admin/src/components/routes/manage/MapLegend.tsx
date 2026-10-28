'use client';

/** Compact colour key shown under the add-route map. */
export default function MapLegend() {
  return (
    <div className="flex-shrink-0 flex items-center gap-4 text-xs text-gray-400 px-1">
      <div className="flex items-center gap-1.5">
        <div className="w-3.5 h-3.5 rounded-full bg-green-500 flex-shrink-0" />
        <span>Start</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3.5 h-3.5 rounded-full bg-red-500 flex-shrink-0" />
        <span>End</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3.5 h-3.5 rounded-full bg-blue-500 flex-shrink-0" />
        <span>Waypoints</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-1 rounded flex-shrink-0" style={{ backgroundColor: '#FF6B6B' }} />
        <span>Route</span>
      </div>
    </div>
  );
}
