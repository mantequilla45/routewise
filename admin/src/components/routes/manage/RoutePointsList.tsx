'use client';

import type { Coordinate } from '@/lib/routes/types';
import { isClosedLoop } from '@/lib/routes/points';

interface RoutePointsListProps {
  points: Coordinate[];
  selectedIndex: number | null;
  insertMode: boolean;
  onSelectPoint: (index: number) => void;
  onToggleInsertMode: () => void;
  onRemovePoint: (index: number) => void;
}

/** Scrollable list of the route's points with select / insert / remove controls. */
export default function RoutePointsList({
  points,
  selectedIndex,
  insertMode,
  onSelectPoint,
  onToggleInsertMode,
  onRemovePoint,
}: RoutePointsListProps) {
  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <label className="block text-sm font-semibold text-white mb-1">
        Added Points ({points.length})
        {isClosedLoop(points) && (
          <span className="ml-2 text-[#CC9933] text-xs font-medium">
            🔄 Closed Loop - Use Insert to add points
          </span>
        )}
      </label>
      <div
        id="points-list"
        className="space-y-1.5 flex-1 min-h-0 overflow-y-auto bg-[#2D2D2D] border border-[#4C4C4C] rounded-lg p-2"
        style={{ scrollBehavior: 'smooth' }}
      >
        {points.map((coord, index) => {
          const isSelected = selectedIndex === index;
          return (
            <div
              key={index}
              id={`point-${index}`}
              className={`flex items-center justify-between text-sm p-2 rounded cursor-pointer transition-all ${
                isSelected
                  ? 'bg-[#2A2500] border-2 border-[#FFCC66] shadow-md'
                  : 'bg-[#1A1A1A] hover:bg-[#252525] border border-[#333333]'
              }`}
              onClick={() => onSelectPoint(index)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectPoint(index);
                }
              }}
            >
              <span className="text-gray-200 flex-1 select-none" style={{ pointerEvents: 'none' }}>
                {coord.label}: {coord.lat.toFixed(6)}, {coord.lng.toFixed(6)}
                {isSelected && !insertMode && (
                  <span className="ml-2 text-[#FFCC66] font-medium">(Click map to move)</span>
                )}
                {isSelected && insertMode && (
                  <span className="ml-2 text-green-400 font-medium">(Click map to add after)</span>
                )}
              </span>
              <div className="flex gap-1">
                {isSelected && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleInsertMode();
                    }}
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      insertMode
                        ? 'bg-green-600 text-white hover:bg-green-500'
                        : 'bg-[#FFCC66] text-black hover:bg-[#CC9933]'
                    }`}
                    title={insertMode ? 'Exit insert mode' : 'Insert point after this'}
                  >
                    {insertMode ? 'Cancel' : 'Insert'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemovePoint(index);
                  }}
                  className="text-red-600 hover:text-red-800 font-medium px-2 py-1"
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
        {points.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-4">Click on the map to add points</p>
        )}
      </div>
    </div>
  );
}
