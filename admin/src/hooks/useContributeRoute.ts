'use client';

import { useState, type FormEvent } from 'react';

export interface Coordinate {
  lat: number;
  lng: number;
  label?: string;
}

export interface ContributeFormData {
  route_code: string;
  contributor_name: string;
  contributor_email: string;
}

export interface SubmitStatus {
  type: string;
  message: string;
}

const EMPTY_FORM: ContributeFormData = {
  route_code: '',
  contributor_name: '',
  contributor_email: '',
};

function relabel(coords: Coordinate[]): Coordinate[] {
  return coords.map((coord, i) => ({
    ...coord,
    label: `Point ${i + 1}`,
  }));
}

export function useContributeRoute() {
  const [formData, setFormData] = useState<ContributeFormData>(EMPTY_FORM);
  const [mapCoordinates, setMapCoordinates] = useState<Coordinate[]>([]);
  const [status, setStatus] = useState<SubmitStatus>({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const [insertMode, setInsertMode] = useState(false);
  const [showPointNumbers, setShowPointNumbers] = useState(true);
  const [hidePOIs, setHidePOIs] = useState(false);
  const [showCloseLoopModal, setShowCloseLoopModal] = useState(false);

  // Parse coordinates for map display
  const getDisplayCoordinates = (): [number, number][] => {
    return mapCoordinates.map((coord) => [coord.lng, coord.lat]);
  };

  const handleSegmentClick = (afterIndex: number, lat: number, lng: number) => {
    const newPointIndex = afterIndex + 1;

    setMapCoordinates((prevCoords) => {
      const newPoint = { lat, lng, label: '' };
      return relabel([
        ...prevCoords.slice(0, newPointIndex),
        newPoint,
        ...prevCoords.slice(newPointIndex),
      ]);
    });

    setSelectedPointIndex(newPointIndex);
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (insertMode && selectedPointIndex !== null) {
      setMapCoordinates((prevCoords) => {
        const newPoint = { lat, lng, label: '' };
        return relabel([
          ...prevCoords.slice(0, selectedPointIndex + 1),
          newPoint,
          ...prevCoords.slice(selectedPointIndex + 1),
        ]);
      });
      setSelectedPointIndex(selectedPointIndex + 1);
      setInsertMode(false);
    } else if (selectedPointIndex !== null) {
      setMapCoordinates((prevCoords) =>
        prevCoords.map((coord, index) =>
          index === selectedPointIndex ? { lat, lng, label: coord.label } : coord,
        ),
      );
    } else {
      const newPoint = {
        lat,
        lng,
        label: `Point ${mapCoordinates.length + 1}`,
      };
      setMapCoordinates([...mapCoordinates, newPoint]);
    }
  };

  const handlePointSelect = (index: number) => {
    if (selectedPointIndex === index) {
      setSelectedPointIndex(null);
      setInsertMode(false);
    } else {
      setSelectedPointIndex(index);
      setInsertMode(false);
    }
  };

  const removeMapCoordinate = (index: number) => {
    setMapCoordinates((prevCoords) => relabel(prevCoords.filter((_, i) => i !== index)));

    if (selectedPointIndex === index) {
      setSelectedPointIndex(null);
      setInsertMode(false);
    } else if (selectedPointIndex !== null && selectedPointIndex > index) {
      setSelectedPointIndex(selectedPointIndex - 1);
    }
  };

  const closeLoop = () => {
    const firstPoint = mapCoordinates[0];
    const lastIndex = mapCoordinates.length;
    const closingPoint = {
      ...firstPoint,
      label: `Point ${lastIndex + 1} (Loop Close)`,
    };
    setMapCoordinates([...mapCoordinates, closingPoint]);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: '', message: '' });

    try {
      if (mapCoordinates.length < 2) {
        throw new Error('Please add at least 2 points on the map');
      }
      const coordinates_forward: [number, number][] = mapCoordinates.map((coord) => [
        coord.lng,
        coord.lat,
      ]);

      const response = await fetch('/api/routes/contribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route_code: formData.route_code,
          contributor_name: formData.contributor_name,
          contributor_email: formData.contributor_email,
          coordinates_forward,
          status: 'pending', // Mark as pending for admin review
        }),
      });

      const result = await response.json();

      if (result.success) {
        setStatus({
          type: 'success',
          message: `Thank you for contributing! Route ${formData.route_code} has been submitted for review.`,
        });

        // Reset form
        setFormData(EMPTY_FORM);
        setMapCoordinates([]);
        setSelectedPointIndex(null);
        setInsertMode(false);
      } else {
        throw new Error(result.error || 'Failed to submit route');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setStatus({
        type: 'error',
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    setFormData,
    mapCoordinates,
    status,
    isSubmitting,
    selectedPointIndex,
    insertMode,
    setInsertMode,
    showPointNumbers,
    setShowPointNumbers,
    hidePOIs,
    setHidePOIs,
    showCloseLoopModal,
    setShowCloseLoopModal,
    getDisplayCoordinates,
    handleSegmentClick,
    handleMapClick,
    handlePointSelect,
    removeMapCoordinate,
    closeLoop,
    handleSubmit,
  };
}
