'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

const AddRouteMap = dynamic(() => import('@/components/routes/AddRouteMap'), { 
    ssr: false,
    loading: () => <div className="h-96 bg-[#2D2D2D] animate-pulse rounded-lg flex items-center justify-center text-gray-400">Loading map...</div>
});

interface EditRouteModalProps {
    routeId: string;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

interface Coordinate {
    lat: number;
    lng: number;
    label?: string;
}

export default function EditRouteModal({ routeId, isOpen, onClose, onUpdate }: EditRouteModalProps) {
    const [formData, setFormData] = useState({
        route_code: ''
    });
    
    const [mapCoordinates, setMapCoordinates] = useState<Coordinate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
    const selectedPointRef = useRef<number | null>(null);
    const isProcessingClick = useRef(false);
    const [insertMode, setInsertMode] = useState(false);
    const [showPointNumbers, setShowPointNumbers] = useState(true);
    const [hidePOIs, setHidePOIs] = useState(false);

    useEffect(() => {
        if (isOpen && routeId) {
            fetchRouteData();
        }
        
        // Reset states when modal closes
        if (!isOpen) {
            setSelectedPointIndex(null);
            selectedPointRef.current = null;
            setInsertMode(false);
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
                    route_code: route.route_code || ''
                });
                
                // Extract coordinates from GeoJSON
                if (route.forward_geojson?.coordinates) {
                    const coords = route.forward_geojson.coordinates;
                    
                    // Set map coordinates
                    const mapCoords = coords.map((coord: [number, number], index: number) => ({
                        lng: coord[0],
                        lat: coord[1],
                        label: `Point ${index + 1}`
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

    const handleSegmentClick = (afterIndex: number, lat: number, lng: number) => {
        // Insert a new point after the specified index
        const newPointIndex = afterIndex + 1;
        
        setMapCoordinates(prevCoords => {
            if (!prevCoords) return [];
            const newPoint = { lat, lng, label: '' };
            const updatedCoords = [
                ...prevCoords.slice(0, newPointIndex),
                newPoint,
                ...prevCoords.slice(newPointIndex)
            ];
            // Re-label all points
            return updatedCoords.map((coord, i) => ({
                ...coord,
                label: `Point ${i + 1}`
            }));
        });
        
        // Auto-select the newly inserted point
        setSelectedPointIndex(newPointIndex);
        selectedPointRef.current = newPointIndex;
        
        // Scroll to the new point
        setTimeout(() => {
            const pointsList = document.getElementById('edit-points-list');
            const newElement = document.querySelector(`#edit-point-${newPointIndex}`);
            if (pointsList && newElement) {
                newElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    };
    
    const handleMapClick = (lat: number, lng: number) => {
        // Prevent double execution
        if (isProcessingClick.current) {
            console.log('Ignoring duplicate click');
            return;
        }
        
        isProcessingClick.current = true;
        
        // Use a timeout to reset the flag
        setTimeout(() => {
            isProcessingClick.current = false;
        }, 100);
        
        // Use the ref value which is more reliable than state
        const indexToEdit = selectedPointRef.current;
        
        if (insertMode && indexToEdit !== null && indexToEdit >= 0) {
            // Insert new point after the selected point
            setMapCoordinates(prevCoords => {
                if (!prevCoords) return [];
                const newPoint = { lat, lng, label: '' }; // Label will be updated below
                const updatedCoords = [
                    ...prevCoords.slice(0, indexToEdit + 1),
                    newPoint,
                    ...prevCoords.slice(indexToEdit + 1)
                ];
                // Re-label all points
                return updatedCoords.map((coord, i) => ({
                    ...coord,
                    label: `Point ${i + 1}`
                }));
            });
            
            // Select the newly inserted point
            const newPointIndex = indexToEdit + 1;
            setSelectedPointIndex(newPointIndex);
            selectedPointRef.current = newPointIndex;
            
            // Exit insert mode
            setInsertMode(false);
            
            // Scroll to the new point
            setTimeout(() => {
                const pointsList = document.getElementById('edit-points-list');
                const newElement = document.querySelector(`#edit-point-${newPointIndex}`);
                if (pointsList && newElement) {
                    newElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
            
        } else if (!insertMode && indexToEdit !== null && indexToEdit >= 0) {
            // Edit existing point - only if not the first or last point in a closed loop
            setMapCoordinates(prevCoords => {
                if (!prevCoords) return [];
                
                // Check if this is a closed loop (first and last points are the same)
                const isClosedLoop = prevCoords.length > 2 && 
                    Math.abs(prevCoords[0].lat - prevCoords[prevCoords.length - 1].lat) < 0.000001 &&
                    Math.abs(prevCoords[0].lng - prevCoords[prevCoords.length - 1].lng) < 0.000001;
                
                // If it's a closed loop and we're editing the first or last point, update both
                if (isClosedLoop && (indexToEdit === 0 || indexToEdit === prevCoords.length - 1)) {
                    const updatedCoords = [...prevCoords];
                    updatedCoords[0] = { ...updatedCoords[0], lat, lng };
                    updatedCoords[prevCoords.length - 1] = { ...updatedCoords[prevCoords.length - 1], lat, lng };
                    return updatedCoords;
                } else {
                    // Normal edit for non-loop or middle points
                    const updatedCoords = [...prevCoords];
                    updatedCoords[indexToEdit] = {
                        ...updatedCoords[indexToEdit],
                        lat,
                        lng
                    };
                    return updatedCoords;
                }
            });
            
            // Deselect after updating
            setSelectedPointIndex(null);
            selectedPointRef.current = null;
        } else {
            // Add new point at the end (but before the closing point if it's a closed loop)
            setMapCoordinates(prev => {
                if (!prev || prev.length === 0) {
                    // First point
                    return [{ lat, lng, label: 'Point 1' }];
                }
                
                // Check if this is a closed loop
                const isClosedLoop = prev.length > 2 && 
                    Math.abs(prev[0].lat - prev[prev.length - 1].lat) < 0.000001 &&
                    Math.abs(prev[0].lng - prev[prev.length - 1].lng) < 0.000001;
                
                if (isClosedLoop) {
                    // Insert before the last point (which is the closing point)
                    const newPoint = { lat, lng, label: '' };
                    const updatedCoords = [
                        ...prev.slice(0, prev.length - 1),
                        newPoint,
                        prev[prev.length - 1]
                    ];
                    // Re-label all points
                    return updatedCoords.map((coord, i) => ({
                        ...coord,
                        label: i === updatedCoords.length - 1 ? `Point ${updatedCoords.length} (Loop Close)` : `Point ${i + 1}`
                    }));
                } else {
                    // Normal append at the end
                    const currentLength = prev.length;
                    const newCoord = { lat, lng, label: `Point ${currentLength + 1}` };
                    return [...prev, newCoord];
                }
            });
            
            // Scroll to show the new point
            setTimeout(() => {
                const pointsList = document.getElementById('edit-points-list');
                const points = pointsList?.querySelectorAll('[id^="edit-point-"]');
                if (points && points.length > 0) {
                    const lastPoint = points[points.length - 1];
                    lastPoint.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        }
    };

    const handlePointSelect = (index: number) => {
        if (selectedPointIndex === index) {
            // Deselect if clicking the same point
            setSelectedPointIndex(null);
            selectedPointRef.current = null;
        } else {
            // Select the point
            setSelectedPointIndex(index);
            selectedPointRef.current = index;
            
            // Scroll the selected point into view
            setTimeout(() => {
                const pointsList = document.getElementById('edit-points-list');
                const selectedElement = document.querySelector(`#edit-point-${index}`);
                if (pointsList && selectedElement) {
                    // Calculate the position to scroll to
                    const listRect = pointsList.getBoundingClientRect();
                    const elementRect = selectedElement.getBoundingClientRect();
                    
                    // Check if element is outside the visible area
                    if (elementRect.top < listRect.top || elementRect.bottom > listRect.bottom) {
                        // Scroll the element into the center of the list
                        selectedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            }, 50);
        }
    };

    const removeMapCoordinate = (index: number) => {
        setMapCoordinates(prev => {
            if (!prev) return [];
            const updated = prev.filter((_, i) => i !== index);
            // Re-label points after removal
            return updated.map((coord, i) => ({
                ...coord,
                label: `Point ${i + 1}`
            }));
        });
        if (selectedPointIndex === index) {
            setSelectedPointIndex(null);
        } else if (selectedPointIndex !== null && selectedPointIndex > index) {
            // Adjust selected index if it's after the removed point
            setSelectedPointIndex(selectedPointIndex - 1);
        }
    };

    const getDisplayCoordinates = (): [number, number][] => {
        return (mapCoordinates || []).map(coord => [coord.lng, coord.lat]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            if (!mapCoordinates || mapCoordinates.length < 2) {
                throw new Error('Please add at least 2 points on the map');
            }
            const coordinates_forward: [number, number][] = mapCoordinates.map(coord => [coord.lng, coord.lat]);

            const response = await fetch(`/api/routes/${routeId}/update`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    route_code: formData.route_code,
                    start_point_name: 'Terminal A',
                    end_point_name: 'Terminal B',
                    coordinates_forward
                })
            });

            const result = await response.json();

            if (result.success) {
                // Update the routes list
                onUpdate();
                
                // Close modal immediately after success
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
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Route Code*
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.route_code}
                                        onChange={e => setFormData({...formData, route_code: e.target.value})}
                                        className="w-full px-3 py-2 bg-[#2D2D2D] border border-[#4C4C4C] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFCC66] focus:border-[#FFCC66]"
                                        required
                                    />
                                </div>


                                {/* Coordinates Input */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            Added Points ({mapCoordinates?.length || 0})
                                            {mapCoordinates && mapCoordinates.length > 2 && 
                                             Math.abs(mapCoordinates[0].lat - mapCoordinates[mapCoordinates.length - 1].lat) < 0.000001 &&
                                             Math.abs(mapCoordinates[0].lng - mapCoordinates[mapCoordinates.length - 1].lng) < 0.000001 && (
                                                <span className="ml-2 text-purple-600 text-xs font-medium">🔄 Closed Loop</span>
                                            )}
                                        </label>
                                        <div className="mb-2 text-xs text-gray-600">
                                            💡 Tip: Select a point and click &quot;Insert&quot; to add a new point after it. For closed loops, new points are added before the closing point.
                                        </div>
                                        <div 
                                            id="edit-points-list"
                                            className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2"
                                            style={{ scrollBehavior: 'smooth' }}
                                        >
                                            {(mapCoordinates || []).map((coord, index) => (
                                                <div 
                                                    key={index}
                                                    id={`edit-point-${index}`}
                                                    className={`flex items-center justify-between text-sm p-2 rounded cursor-pointer transition-all ${
                                                        selectedPointIndex === index 
                                                            ? 'bg-yellow-100 border-2 border-yellow-400 shadow-md' 
                                                            : 'bg-[#2D2D2D] hover:bg-[#404040] border border-[#4C4C4C]'
                                                    }`}
                                                    onClick={() => handlePointSelect(index)}
                                                    role="button"
                                                    tabIndex={0}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault();
                                                            handlePointSelect(index);
                                                        }
                                                    }}
                                                >
                                                    <span 
                                                        className="text-gray-800 flex-1 select-none"
                                                        style={{ pointerEvents: 'none' }}
                                                    >
                                                        {coord.label}: {coord.lat.toFixed(6)}, {coord.lng.toFixed(6)}
                                                        {selectedPointIndex === index && !insertMode && (
                                                            <span className="ml-2 text-yellow-600 font-medium">(Click map to move)</span>
                                                        )}
                                                        {selectedPointIndex === index && insertMode && (
                                                            <span className="ml-2 text-green-600 font-medium">(Click map to add after)</span>
                                                        )}
                                                    </span>
                                                    <div className="flex gap-1">
                                                        {selectedPointIndex === index && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setInsertMode(!insertMode);
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
                                                                removeMapCoordinate(index);
                                                                if (selectedPointIndex === index) {
                                                                    setSelectedPointIndex(null);
                                                                    setInsertMode(false);
                                                                }
                                                            }}
                                                            className="text-red-600 hover:text-red-800 font-medium px-2 py-1"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!mapCoordinates || mapCoordinates.length === 0) && (
                                                <p className="text-gray-500 text-sm text-center py-4">Click on the map to add points</p>
                                            )}
                                        </div>
                                    </div>
                            </div>

                            {/* Right Column - Map */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-lg font-semibold text-gray-700">Click to Edit Points</h3>
                                    <div className="flex items-center gap-3">
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={showPointNumbers}
                                                onChange={e => setShowPointNumbers(e.target.checked)}
                                                className="sr-only"
                                            />
                                            <div className="relative">
                                                <div className={`block w-9 h-5 rounded-full transition-colors ${showPointNumbers ? 'bg-[#FFCC66]' : 'bg-[#4C4C4C]'}`}></div>
                                                <div className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition ${showPointNumbers ? 'transform translate-x-4' : ''}`}></div>
                                            </div>
                                            <span className="ml-2 text-xs font-medium text-gray-700">Numbers</span>
                                        </label>
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={hidePOIs}
                                                onChange={e => setHidePOIs(e.target.checked)}
                                                className="sr-only"
                                            />
                                            <div className="relative">
                                                <div className={`block w-9 h-5 rounded-full transition-colors ${hidePOIs ? 'bg-[#FFCC66]' : 'bg-[#4C4C4C]'}`}></div>
                                                <div className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition ${hidePOIs ? 'transform translate-x-4' : ''}`}></div>
                                            </div>
                                            <span className="ml-2 text-xs font-medium text-gray-700">Hide Places</span>
                                        </label>
                                    </div>
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
                            <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
                                {error}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex justify-between items-center mt-6 pt-4 border-t">
                            {/* Close Loop Button */}
                            <button
                                type="button"
                                onClick={() => {
                                    if (mapCoordinates.length < 2) return;
                                    
                                    const isAlreadyClosed = mapCoordinates.length > 2 && 
                                        Math.abs(mapCoordinates[0].lat - mapCoordinates[mapCoordinates.length - 1].lat) < 0.000001 && 
                                        Math.abs(mapCoordinates[0].lng - mapCoordinates[mapCoordinates.length - 1].lng) < 0.000001;
                                        
                                    if (isAlreadyClosed) return;
                                    
                                    const firstPoint = mapCoordinates[0];
                                    const closingPoint = {
                                        ...firstPoint,
                                        label: `Point ${mapCoordinates.length + 1} (Loop Close)`
                                    };
                                    setMapCoordinates([...mapCoordinates, closingPoint]);
                                }}
                                disabled={mapCoordinates.length < 2 || (mapCoordinates.length > 2 && 
                                    Math.abs(mapCoordinates[0].lat - mapCoordinates[mapCoordinates.length - 1].lat) < 0.000001 && 
                                    Math.abs(mapCoordinates[0].lng - mapCoordinates[mapCoordinates.length - 1].lng) < 0.000001)}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                    mapCoordinates.length < 2
                                        ? 'bg-[#2D2D2D] text-gray-500 cursor-not-allowed'
                                        : (mapCoordinates.length > 2 && 
                                            Math.abs(mapCoordinates[0].lat - mapCoordinates[mapCoordinates.length - 1].lat) < 0.000001 && 
                                            Math.abs(mapCoordinates[0].lng - mapCoordinates[mapCoordinates.length - 1].lng) < 0.000001)
                                            ? 'bg-green-500 text-white cursor-not-allowed'
                                            : 'bg-purple-600 text-white hover:bg-purple-700'
                                }`}
                                title={mapCoordinates.length < 2 ? 'Need at least 2 points to close loop' : ''}
                            >
                                {(mapCoordinates.length > 2 && 
                                    Math.abs(mapCoordinates[0].lat - mapCoordinates[mapCoordinates.length - 1].lat) < 0.000001 && 
                                    Math.abs(mapCoordinates[0].lng - mapCoordinates[mapCoordinates.length - 1].lng) < 0.000001)
                                    ? '✓ Loop Closed'
                                    : 'Close Loop'}
                            </button>

                            <div className="flex space-x-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={isSubmitting}
                                    className="px-6 py-2 bg-[#4C4C4C] text-white border border-[#404040] rounded-lg hover:bg-[#404040] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`px-6 py-2 rounded-lg font-medium text-white flex items-center space-x-2 ${
                                        isSubmitting
                                            ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                                            : 'bg-[#FFCC66] hover:bg-[#CC9933] text-black font-bold'
                                    }`}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span>Updating...</span>
                                        </>
                                    ) : (
                                        <span>Update Route</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}