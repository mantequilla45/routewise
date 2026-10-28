import { useRef, useState } from 'react';
import {
  appendPoint,
  closeLoop,
  insertPointAfter,
  movePoint,
  removePoint,
  type Coordinate,
} from './coordinateUtils';
import { scrollSelectedPointIntoView, scrollToLastPoint, scrollToPoint } from './scrollToPoint';

// State and handlers for editing a route's points: selecting, moving, inserting and removing.
export function useRoutePointEditor() {
  const [mapCoordinates, setMapCoordinates] = useState<Coordinate[]>([]);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const selectedPointRef = useRef<number | null>(null);
  const isProcessingClick = useRef(false);
  const [insertMode, setInsertMode] = useState(false);

  const selectPoint = (index: number | null) => {
    setSelectedPointIndex(index);
    selectedPointRef.current = index;
  };

  const resetSelection = () => {
    selectPoint(null);
    setInsertMode(false);
  };

  const handleSegmentClick = (afterIndex: number, lat: number, lng: number) => {
    const newPointIndex = afterIndex + 1;
    setMapCoordinates((prevCoords) => insertPointAfter(prevCoords || [], afterIndex, lat, lng));
    selectPoint(newPointIndex);
    scrollToPoint(newPointIndex);
  };

  const handleMapClick = (lat: number, lng: number) => {
    // Prevent double execution
    if (isProcessingClick.current) {
      return;
    }

    isProcessingClick.current = true;
    setTimeout(() => {
      isProcessingClick.current = false;
    }, 100);

    // Use the ref value which is more reliable than state
    const indexToEdit = selectedPointRef.current;

    if (insertMode && indexToEdit !== null && indexToEdit >= 0) {
      // Insert new point after the selected point
      setMapCoordinates((prevCoords) => insertPointAfter(prevCoords || [], indexToEdit, lat, lng));
      const newPointIndex = indexToEdit + 1;
      selectPoint(newPointIndex);
      setInsertMode(false);
      scrollToPoint(newPointIndex);
    } else if (!insertMode && indexToEdit !== null && indexToEdit >= 0) {
      // Move the selected point, then deselect
      setMapCoordinates((prevCoords) => movePoint(prevCoords || [], indexToEdit, lat, lng));
      selectPoint(null);
    } else {
      // Add new point at the end (but before the closing point if it's a closed loop)
      setMapCoordinates((prev) => appendPoint(prev || [], lat, lng));
      scrollToLastPoint();
    }
  };

  const handlePointSelect = (index: number) => {
    if (selectedPointIndex === index) {
      selectPoint(null);
    } else {
      selectPoint(index);
      scrollSelectedPointIntoView(index);
    }
  };

  const handleRemovePoint = (index: number) => {
    setMapCoordinates((prev) => removePoint(prev || [], index));
    if (selectedPointIndex === index) {
      setSelectedPointIndex(null);
    } else if (selectedPointIndex !== null && selectedPointIndex > index) {
      // Adjust selected index if it's after the removed point
      setSelectedPointIndex(selectedPointIndex - 1);
    }
    if (selectedPointIndex === index) {
      setSelectedPointIndex(null);
      setInsertMode(false);
    }
  };

  const handleCloseLoop = () => {
    if (mapCoordinates.length < 2) return;
    setMapCoordinates(closeLoop(mapCoordinates));
  };

  const toggleInsertMode = () => setInsertMode(!insertMode);

  return {
    mapCoordinates,
    setMapCoordinates,
    selectedPointIndex,
    insertMode,
    resetSelection,
    toggleInsertMode,
    handleSegmentClick,
    handleMapClick,
    handlePointSelect,
    handleRemovePoint,
    handleCloseLoop,
  };
}
