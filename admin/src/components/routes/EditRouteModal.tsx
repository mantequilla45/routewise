'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import dynamic from 'next/dynamic';
import EditPointsList from './edit/EditPointsList';
import MapDisplayToggles from './edit/MapDisplayToggles';
import { isClosedLoop } from './edit/coordinateUtils';
import { useRoutePointEditor } from './edit/useRoutePointEditor';

const AddRouteMap = dynamic(() => import('@/components/routes/AddRouteMap'), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-[#2D2D2D] animate-pulse rounded-lg flex items-center justify-center text-gray-400">
      Loading map...
    </div>
  ),
});

interface EditRouteModalProps {
  routeId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function EditRouteModal({
  routeId,
  isOpen,
  onClose,
  onUpdate,
}: EditRouteModalProps) {
  const [formData, setFormData] = useState({
    route_code: '',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPointNumbers, setShowPointNumbers] = useState(true);
  const [hidePOIs, setHidePOIs] = useState(false);

  const {
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
  } = useRoutePointEditor();

  useEffect(() => {
    if (isOpen && routeId) {
      fetchRouteData();
    }

    // Reset states when modal closes
    if (!isOpen) {
      resetSelection();
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, routeId]);

  const fetchRouteData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/routes/${routeId}`);
      const data = await response.json();

      if (data.success && data.route) {
        const route = data.route;

        setFormData({
          route_code: route.route_code || '',
        });

        // Extract coordinates from GeoJSON
        if (route.forward_geojson?.coordinates) {
          const coords = route.forward_geojson.coordinates;
          const mapCoords = coords.map((coord: [number, number], index: number) => ({
            lng: coord[0],
            lat: coord[1],
            label: `Point ${index + 1}`,
          }));
          setMapCoordinates(mapCoords);
        }
      }
    } catch (error) {
      console.error('Error fetching route:', error);
      setError('Failed to load route data');
    } finally {
      setIsLoading(false);
    }
  };

  const getDisplayCoordinates = (): [number, number][] => {
    return (mapCoordinates || []).map((coord) => [coord.lng, coord.lat]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!mapCoordinates || mapCoordinates.length < 2) {
        throw new Error('Please add at least 2 points on the map');
      }
      const coordinates_forward: [number, number][] = mapCoordinates.map((coord) => [
        coord.lng,
        coord.lat,
      ]);

      const response = await fetch(`/api/routes/${routeId}/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route_code: formData.route_code,
          start_point_name: 'Terminal A',
          end_point_name: 'Terminal B',
          coordinates_forward,
        }),
      });

      const result = await response.json();

      if (result.success) {
        onUpdate();
        onClose();
      } else {
        throw new Error(result.error || 'Failed to update route');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#3A3A3A] rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-[#404040]">
        <div className="sticky top-0 bg-[#3A3A3A] border-b border-[#404040] px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Edit Route</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#FFCC66] transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <div className="text-gray-500">Loading route data...</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">
                    Route Code*
                  </label>
                  <input
                    type="text"
                    value={formData.route_code}
                    onChange={(e) => setFormData({ ...formData, route_code: e.target.value })}
                    className="w-full px-3 py-2 bg-[#2D2D2D] border border-[#4C4C4C] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFCC66] focus:border-[#FFCC66]"
                    required
                  />
                </div>

                <EditPointsList
                  coordinates={mapCoordinates}
                  selectedPointIndex={selectedPointIndex}
                  insertMode={insertMode}
                  onSelect={handlePointSelect}
                  onToggleInsertMode={toggleInsertMode}
                  onRemove={handleRemovePoint}
                />
              </div>

              {/* Right Column - Map */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold text-white">Click to Edit Points</h3>
                  <MapDisplayToggles
                    showPointNumbers={showPointNumbers}
                    onShowPointNumbersChange={setShowPointNumbers}
                    hidePOIs={hidePOIs}
                    onHidePOIsChange={setHidePOIs}
                  />
                </div>
                <AddRouteMap
                  coordinates={getDisplayCoordinates()}
                  onMapClick={handleMapClick}
                  enableClickToAdd={true}
                  height="400px"
                  highlightedIndex={selectedPointIndex}
                  onPointClick={handlePointSelect}
                  onSegmentClick={handleSegmentClick}
                  showPointNumbers={showPointNumbers}
                  hidePOIs={hidePOIs}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-4 bg-red-900/20 text-red-400 border border-red-500 rounded-lg">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-[#333]">
              {isClosedLoop(mapCoordinates) ? (
                <Button variant="success" disabled>
                  ✓ Loop Closed
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  disabled={mapCoordinates.length < 2}
                  title={mapCoordinates.length < 2 ? 'Need at least 2 points to close loop' : ''}
                  onClick={handleCloseLoop}
                >
                  Close Loop
                </Button>
              )}

              <div className="flex space-x-3">
                <Button type="button" variant="secondary" disabled={isSubmitting} onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={isSubmitting} size="md">
                  {isSubmitting ? 'Updating...' : 'Update Route'}
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
