'use client';

import { useState } from 'react';
import type { Coordinate } from '@/lib/routes/types';
import { CLOSED_LOOP_ALERT, isClosedLoop, pointLabel, relabelPoints } from '@/lib/routes/points';

function scrollToPoint(index: number) {
  setTimeout(() => {
    const pointsList = document.getElementById('points-list');
    const newElement = document.querySelector(`#point-${index}`);
    if (pointsList && newElement) {
      newElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 100);
}

function insertPointAt(points: Coordinate[], index: number, lat: number, lng: number) {
  const newPoint = { lat, lng, label: '' };
  return relabelPoints([...points.slice(0, index), newPoint, ...points.slice(index)]);
}

/**
 * State for the "Add New Route" map editor: the ordered list of points, the selected
 * point, the insert mode that controls what a map click does, and map display toggles.
 */
export function useRoutePointsEditor() {
  const [points, setPoints] = useState<Coordinate[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [insertMode, setInsertMode] = useState(false);
  // Map display preferences; kept here so they survive tab switches like the points do
  const [showPointNumbers, setShowPointNumbers] = useState(true);
  const [hidePOIs, setHidePOIs] = useState(true);

  /** Insert a point between two existing points (click on the route line). */
  const handleSegmentClick = (afterIndex: number, lat: number, lng: number) => {
    const newPointIndex = afterIndex + 1;
    setPoints((prev) => insertPointAt(prev, newPointIndex, lat, lng));
    // Auto-select the newly inserted point (this is intentional for insertions)
    setSelectedIndex(newPointIndex);
    scrollToPoint(newPointIndex);
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (insertMode && selectedIndex !== null) {
      // Insert new point after the selected point
      setPoints((prev) => insertPointAt(prev, selectedIndex + 1, lat, lng));
      setInsertMode(false);
      setSelectedIndex(null);
      scrollToPoint(selectedIndex + 1);
    } else if (!insertMode && selectedIndex !== null) {
      // Move the selected point, keeping its label and selection
      setPoints((prev) => {
        if (!prev || prev.length === 0 || selectedIndex >= prev.length) {
          return prev;
        }
        return prev.map((coord, index) =>
          index === selectedIndex ? { ...coord, lat, lng } : coord,
        );
      });
    } else {
      if (isClosedLoop(points)) {
        // Don't allow adding points at the end for closed loops
        alert(CLOSED_LOOP_ALERT);
        return;
      }
      // Add new point at the end (without selecting it)
      setPoints([...points, { lat, lng, label: pointLabel(points.length) }]);
    }
  };

  const handlePointSelect = (index: number) => {
    // Clicking the selected point deselects it; either way insert mode is reset
    setSelectedIndex(selectedIndex === index ? null : index);
    setInsertMode(false);
  };

  const removePoint = (index: number) => {
    setPoints((prev) => relabelPoints(prev.filter((_, i) => i !== index)));
    if (selectedIndex === index) {
      setSelectedIndex(null);
      setInsertMode(false);
    } else if (selectedIndex !== null && selectedIndex > index) {
      // Adjust selected index if it's after the removed point
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const toggleInsertMode = () => setInsertMode((mode) => !mode);

  /** Append a copy of the first point so the route forms a loop. */
  const closeLoop = () => {
    const firstPoint = points[0];
    const closingPoint = {
      ...firstPoint,
      label: `${pointLabel(points.length)} (Loop Close)`,
    };
    setPoints([...points, closingPoint]);
  };

  /** Replace all points (e.g. from a KML import) and drop the selection. */
  const loadPoints = (next: Coordinate[]) => {
    setPoints(next);
    setSelectedIndex(null);
  };

  return {
    points,
    setPoints,
    selectedIndex,
    insertMode,
    handleSegmentClick,
    handleMapClick,
    handlePointSelect,
    removePoint,
    toggleInsertMode,
    closeLoop,
    loadPoints,
    showPointNumbers,
    setShowPointNumbers,
    hidePOIs,
    setHidePOIs,
  };
}

export type RoutePointsEditor = ReturnType<typeof useRoutePointsEditor>;
