'use client';

import dynamic from 'next/dynamic';
import MapInstructions from '@/components/contribute/MapInstructions';

// Dynamically import map component to avoid SSR issues
const AddRouteMap = dynamic(() => import('@/components/routes/AddRouteMap'), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
      Loading map...
    </div>
  ),
});

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

function ToggleSwitch({ checked, onChange, label }: ToggleSwitchProps) {
  return (
    <label className="flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <div className="relative">
        <div
          className={`block w-10 h-6 rounded-full ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}
        ></div>
        <div
          className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${checked ? 'transform translate-x-4' : ''}`}
        ></div>
      </div>
      <span className="ml-2 text-sm font-medium text-gray-700">{label}</span>
    </label>
  );
}

interface ContributeMapSectionProps {
  coordinates: [number, number][];
  selectedPointIndex: number | null;
  showPointNumbers: boolean;
  onShowPointNumbersChange: (checked: boolean) => void;
  hidePOIs: boolean;
  onHidePOIsChange: (checked: boolean) => void;
  onMapClick: (lat: number, lng: number) => void;
  onPointClick: (index: number) => void;
  onSegmentClick: (afterIndex: number, lat: number, lng: number) => void;
}

export default function ContributeMapSection({
  coordinates,
  selectedPointIndex,
  showPointNumbers,
  onShowPointNumbersChange,
  hidePOIs,
  onHidePOIsChange,
  onMapClick,
  onPointClick,
  onSegmentClick,
}: ContributeMapSectionProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8 w-full lg:w-2/3 min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Draw Route on Map</h2>
        <div className="flex items-center gap-4">
          <ToggleSwitch
            checked={showPointNumbers}
            onChange={onShowPointNumbersChange}
            label="Show Numbers"
          />
          <ToggleSwitch checked={hidePOIs} onChange={onHidePOIsChange} label="Hide Places" />
        </div>
      </div>
      <AddRouteMap
        coordinates={coordinates}
        onMapClick={onMapClick}
        enableClickToAdd={true}
        height="500px"
        highlightedIndex={selectedPointIndex}
        onPointClick={onPointClick}
        onSegmentClick={onSegmentClick}
        showPointNumbers={showPointNumbers}
        hidePOIs={hidePOIs}
      />

      <MapInstructions />
    </div>
  );
}
