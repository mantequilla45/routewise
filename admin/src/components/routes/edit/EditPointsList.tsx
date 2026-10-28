'use client';

import { isClosedLoop, type Coordinate } from './coordinateUtils';

interface EditPointsListProps {
  coordinates: Coordinate[];
  selectedPointIndex: number | null;
  insertMode: boolean;
  onSelect: (index: number) => void;
  onToggleInsertMode: () => void;
  onRemove: (index: number) => void;
}

export default function EditPointsList({
  coordinates,
  selectedPointIndex,
  insertMode,
  onSelect,
  onToggleInsertMode,
  onRemove,
}: EditPointsListProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-300 mb-1">
        Added Points ({coordinates?.length || 0})
        {coordinates && isClosedLoop(coordinates) && (
          <span className="ml-2 text-purple-600 text-xs font-medium">🔄 Closed Loop</span>
        )}
      </label>
      <div className="mb-2 text-xs text-gray-500">
        💡 Tip: Select a point and click &quot;Insert&quot; to add a new point after it. For closed
        loops, new points are added before the closing point.
      </div>
      <div
        id="edit-points-list"
        className="space-y-2 max-h-40 overflow-y-auto border border-[#333] rounded-lg p-2 bg-[#111111]"
        style={{ scrollBehavior: 'smooth' }}
      >
        {(coordinates || []).map((coord, index) => (
          <div
            key={index}
            id={`edit-point-${index}`}
            className={`flex items-center justify-between text-sm p-2 rounded cursor-pointer transition-all ${
              selectedPointIndex === index
                ? 'bg-[#2A2500] border-2 border-[#FFCC66] shadow-md'
                : 'bg-[#1A1A1A] hover:bg-[#252525] border border-[#333333]'
            }`}
            onClick={() => onSelect(index)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(index);
              }
            }}
          >
            <span className="text-gray-200 flex-1 select-none" style={{ pointerEvents: 'none' }}>
              {coord.label}: {coord.lat.toFixed(6)}, {coord.lng.toFixed(6)}
              {selectedPointIndex === index && !insertMode && (
                <span className="ml-2 text-[#FFCC66] font-medium">(Click map to move)</span>
              )}
              {selectedPointIndex === index && insertMode && (
                <span className="ml-2 text-green-400 font-medium">(Click map to add after)</span>
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
                  onRemove(index);
                }}
                className="text-red-600 hover:text-red-800 font-medium px-2 py-1"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        {(!coordinates || coordinates.length === 0) && (
          <p className="text-gray-400 text-sm text-center py-4">Click on the map to add points</p>
        )}
      </div>
    </div>
  );
}
