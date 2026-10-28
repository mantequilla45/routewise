'use client';

import type { Coordinate } from '@/lib/routes/types';

interface ContributionPointsEditorProps {
  points: Coordinate[];
  selectedIndex: number | null;
  onSelectPoint: (index: number) => void;
  onRemovePoint: (index: number) => void;
}

/** Point list shown while editing a contribution's route. */
export default function ContributionPointsEditor({
  points,
  selectedIndex,
  onSelectPoint,
  onRemovePoint,
}: ContributionPointsEditorProps) {
  return (
    <div className="bg-[#111111] p-4 rounded-xl border border-[#2A2A2A]">
      <h4 className="font-semibold mb-3 text-white">Edit Route Points</h4>
      <div className="h-64 overflow-y-auto border border-[#333] rounded-lg p-2 space-y-2">
        {points.map((coord, index) => (
          <div
            key={index}
            className={`flex items-center justify-between text-sm p-2 rounded cursor-pointer transition-all ${
              selectedIndex === index
                ? 'bg-[#2A2500] border-2 border-[#FFCC66] shadow-md'
                : 'bg-[#1A1A1A] hover:bg-[#252525] border border-[#333333]'
            }`}
            onClick={() => onSelectPoint(index)}
          >
            <span className="text-gray-200 flex-1">
              {coord.label}: {coord.lat.toFixed(6)}, {coord.lng.toFixed(6)}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemovePoint(index);
              }}
              className="text-red-500 hover:text-red-700 px-2"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      {points.length === 0 && (
        <p className="text-gray-400 text-sm mt-2">Click on the map to add route points</p>
      )}
    </div>
  );
}
