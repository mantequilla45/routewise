'use client';

import { useEffect, useRef, useState } from 'react';
import type { RoutePointsEditor } from '@/hooks/useRoutePointsEditor';
import { toLngLatPairs } from '@/lib/routes/points';
import DynamicAddRouteMap from './DynamicAddRouteMap';
import MapHelpTooltip from './MapHelpTooltip';
import MapLegend from './MapLegend';
import MapToggle from './MapToggle';

interface RouteMapPanelProps {
  editor: RoutePointsEditor;
}

/** Right-hand column of the "Add New Route" tab: display toggles, the map and its legend. */
export default function RouteMapPanel({ editor }: RouteMapPanelProps) {
  const { showPointNumbers, setShowPointNumbers, hidePOIs, setHidePOIs } = editor;
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapHeight, setMapHeight] = useState(420);

  // Size the map to its flex container so it fills the panel
  useEffect(() => {
    const el = mapContainerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const h = entry.contentRect.height;
        if (h > 0) setMapHeight(h);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-3 border border-[#2A2A2A] rounded-xl p-4 bg-[#111111]">
      <div className="flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-4">
          <MapToggle label="Numbers" checked={showPointNumbers} onChange={setShowPointNumbers} />
          <MapToggle label="Hide Places" checked={hidePOIs} onChange={setHidePOIs} />
        </div>
        <MapHelpTooltip />
      </div>

      <div ref={mapContainerRef} className="flex-1 min-h-0">
        <DynamicAddRouteMap
          coordinates={toLngLatPairs(editor.points)}
          onMapClick={editor.handleMapClick}
          enableClickToAdd={true}
          height={`${mapHeight}px`}
          highlightedIndex={editor.selectedIndex}
          onPointClick={editor.handlePointSelect}
          onSegmentClick={editor.handleSegmentClick}
          showPointNumbers={showPointNumbers}
          hidePOIs={hidePOIs}
        />
      </div>

      <MapLegend />
    </div>
  );
}
