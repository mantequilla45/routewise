'use client';

import type { Coordinate } from '@/hooks/useContributeRoute';

interface RoutePointsListProps {
  mapCoordinates: Coordinate[];
  selectedPointIndex: number | null;
  insertMode: boolean;
  onToggleInsertMode: () => void;
  onPointSelect: (index: number) => void;
  onRemove: (index: number) => void;
}

export default function RoutePointsList({
  mapCoordinates,
  selectedPointIndex,
  insertMode,
  onToggleInsertMode,
  onPointSelect,
  onRemove,
}: RoutePointsListProps) {
  const first = mapCoordinates[0];
  const last = mapCoordinates[mapCoordinates.length - 1];
  const isClosedLoop =
    mapCoordinates.length > 2 &&
    Math.abs(first.lat - last.lat) < 0.000001 &&
    Math.abs(first.lng - last.lng) < 0.000001;

  return (
    <div className="border-t pt-4">
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        Route Points ({mapCoordinates.length})
        {isClosedLoop && (
          <span className="ml-2 text-purple-600 text-xs font-medium">🔄 Closed Loop</span>
        )}
      </label>
      <div
        id="points-list"
        className="space-y-2 h-64 overflow-y-auto border border-gray-200 rounded-lg p-2"
      >
        {mapCoordinates.map((coord, index) => (
          <div
            key={index}
            id={`point-${index}`}
            className={`flex items-center justify-between text-sm p-2 rounded cursor-pointer transition-all ${
              selectedPointIndex === index
                ? 'bg-yellow-100 border-2 border-yellow-400 shadow-md'
                : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
            }`}
            onClick={() => onPointSelect(index)}
          >
            <span className="text-gray-800 flex-1">
              {coord.label}: {coord.lat.toFixed(6)}, {coord.lng.toFixed(6)}
              {selectedPointIndex === index && !insertMode && (
                <span className="ml-2 text-yellow-600 font-medium text-xs">
                  (Click map to move)
                </span>
              )}
              {selectedPointIndex === index && insertMode && (
                <span className="ml-2 text-green-600 font-medium text-xs">
                  (Click map to add after)
                </span>
              )}
            </span>
            <div className="flex gap-1">
              {selectedPointIndex === index && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleInsertMode();
                  }}
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    insertMode
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {insertMode ? 'Cancel' : 'Insert'}
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(index);
                }}
                className="text-red-600 hover:text-red-800 font-medium px-2 py-1 text-xs"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        {mapCoordinates.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-4">Click on the map to add points</p>
        )}
      </div>
    </div>
  );
}
