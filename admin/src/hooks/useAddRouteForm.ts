'use client';

import { useState } from 'react';
import type { Coordinate } from '@/lib/routes/types';
import { toLngLatPairs } from '@/lib/routes/points';
import { parseKML, readFileAsText } from '@/lib/routes/kml';
import { api } from '@/lib/api';

export interface FormStatus {
  type: '' | 'info' | 'success' | 'error';
  message: string;
}

interface UseAddRouteFormOptions {
  points: Coordinate[];
  setPoints: (points: Coordinate[]) => void;
  loadPoints: (points: Coordinate[]) => void;
  /** Called shortly after a route is added successfully. */
  onRouteAdded: () => void;
}

/** Route-code input, KML import and submission for the "Add New Route" form. */
export function useAddRouteForm({
  points,
  setPoints,
  loadPoints,
  onRouteAdded,
}: UseAddRouteFormOptions) {
  const [routeCode, setRouteCode] = useState('');
  const [status, setStatus] = useState<FormStatus>({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: '', message: '' });

    try {
      if (points.length < 2) {
        throw new Error('Please add at least 2 points on the map');
      }

      const result = await api.routes.add({
        route_code: routeCode,
        start_point_name: 'Terminal A',
        end_point_name: 'Terminal B',
        coordinates_forward: toLngLatPairs(points),
      });

      if (result.success) {
        setStatus({
          type: 'success',
          message: `Route ${result.route.route_code} added successfully!`,
        });
        setRouteCode('');
        setPoints([]);

        // Switch to list view after successful add
        setTimeout(onRouteAdded, 2000);
      } else {
        throw new Error(result.error || 'Failed to add route');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setStatus({ type: 'error', message: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setStatus({ type: 'info', message: 'Processing file...' });

      const fileContent = await readFileAsText(file);
      let coordinates: Coordinate[] = [];

      if (file.name.endsWith('.kml')) {
        coordinates = parseKML(fileContent);
      } else if (file.name.endsWith('.kmz')) {
        setStatus({
          type: 'error',
          message: 'KMZ files are not yet supported. Please convert to KML first.',
        });
        return;
      }

      if (coordinates.length === 0) {
        setStatus({ type: 'error', message: 'No valid coordinates found in the file.' });
        return;
      }

      loadPoints(coordinates);
      setStatus({
        type: 'success',
        message: `Successfully loaded ${coordinates.length} points from ${file.name}`,
      });
    } catch (error) {
      console.error('Error processing file:', error);
      setStatus({
        type: 'error',
        message: 'Error processing file. Please check the file format.',
      });
    }
  };

  return { routeCode, setRouteCode, status, isSubmitting, handleSubmit, handleFileUpload };
}

export type AddRouteForm = ReturnType<typeof useAddRouteForm>;
