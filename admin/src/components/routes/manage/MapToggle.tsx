'use client';

interface MapToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/** Small pill switch used above the map (point numbers, hide places). */
export default function MapToggle({ label, checked, onChange }: MapToggleProps) {
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
          className={`block w-10 h-6 rounded-full transition-colors ${
            checked ? 'bg-[#FFCC66]' : 'bg-[#4C4C4C]'
          }`}
        ></div>
        <div
          className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${
            checked ? 'transform translate-x-4' : ''
          }`}
        ></div>
      </div>
      <span className="ml-2 text-sm font-medium text-white">{label}</span>
    </label>
  );
}
