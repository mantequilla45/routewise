'use client';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

function Toggle({ checked, onChange, label }: ToggleProps) {
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
          className={`block w-9 h-5 rounded-full transition-colors ${checked ? 'bg-[#FFCC66]' : 'bg-[#4C4C4C]'}`}
        ></div>
        <div
          className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition ${checked ? 'transform translate-x-4' : ''}`}
        ></div>
      </div>
      <span className="ml-2 text-xs font-medium text-gray-300">{label}</span>
    </label>
  );
}

interface MapDisplayTogglesProps {
  showPointNumbers: boolean;
  onShowPointNumbersChange: (value: boolean) => void;
  hidePOIs: boolean;
  onHidePOIsChange: (value: boolean) => void;
}

export default function MapDisplayToggles({
  showPointNumbers,
  onShowPointNumbersChange,
  hidePOIs,
  onHidePOIsChange,
}: MapDisplayTogglesProps) {
  return (
    <div className="flex items-center gap-3">
      <Toggle checked={showPointNumbers} onChange={onShowPointNumbersChange} label="Numbers" />
      <Toggle checked={hidePOIs} onChange={onHidePOIsChange} label="Hide Places" />
    </div>
  );
}
