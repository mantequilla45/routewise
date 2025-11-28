'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

const AddRouteMap = dynamic(() => import('@/components/routes/AddRouteMap'), { 
    ssr: false,
    loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">Loading map...</div>
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
        route_code: '',
        start_point_name: '',
        end_point_name: '',
        horizontal_or_vertical_road: true
    });
    
    const [mapCoordinates, setMapCoordinates] = useState<Coordinate[]>([]);
    const [inputMethod, setInputMethod] = useState<'text' | 'map'>('map');
    const [textCoordinates, setTextCoordinates] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
    const selectedPointRef = useRef<number | null>(null);
    const isProcessingClick = useRef(false);
    const [insertMode, setInsertMode] = useState(false);

    useEffect(() => {
        if (isOpen && routeId) {
            fetchRouteData();
        }
        
        // Reset selection when modal closes
        if (!isOpen) {
            setSelectedPointIndex(null);
            selectedPointRef.current = null;
            setInsertMode(false);
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
                    start_point_name: route.start_point_name || '',
                    end_point_name: route.end_point_name || '',
                    horizontal_or_vertical_road: route.horizontal_or_vertical_road ?? true
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
                    
                    // Set text coordinates
                    const textCoords = coords.map((coord: [number, number]) => 
                        `${coord[0]},${coord[1]}`
                    ).join('\n');
                    setTextCoordinates(textCoords);
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
            
            // Exit insert mode and deselect
            setInsertMode(false);
            setSelectedPointIndex(null);
            selectedPointRef.current = null;
            
            // Scroll to the new point
            setTimeout(() => {
                const pointsList = document.getElementById('edit-points-list');
                const newElement = document.querySelector(`#edit-point-${indexToEdit + 1}`);
                if (pointsList && newElement) {
                    newElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
            
        } else if (!insertMode && indexToEdit !== null && indexToEdit >= 0) {
            // Edit existing point
            setMapCoordinates(prevCoords => {
                if (!prevCoords) return [];
                const updatedCoords = [...prevCoords];
                updatedCoords[indexToEdit] = {
                    ...updatedCoords[indexToEdit],
                    lat,
                    lng
                };
                return updatedCoords;
            });
            
            // Deselect after updating
            setSelectedPointIndex(null);
            selectedPointRef.current = null;
        } else {
            // Add new point at the end
            const newIndex = mapCoordinates?.length || 0;
            
            setMapCoordinates(prev => {
                const currentLength = prev?.length || 0;
                const newCoord = { lat, lng, label: `Point ${currentLength + 1}` };
                const updated = [...(prev || []), newCoord];
                return updated;
            });
            
            // Auto-select the newly added point
            setSelectedPointIndex(newIndex);
            selectedPointRef.current = newIndex;
            
            // Auto-scroll the points list
            setTimeout(() => {
                const pointsList = document.getElementById('edit-points-list');
                const newElement = document.querySelector(`#edit-point-${newIndex}`);
                if (pointsList && newElement) {
                    newElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
        if (inputMethod === 'map') {
            return (mapCoordinates || []).map(coord => [coord.lng, coord.lat]);
        }
        
        try {
            if (!textCoordinates) return [];
            const lines = textCoordinates.split('\n').filter(line => line.trim());
            return lines.map(line => {
                const [lon, lat] = line.split(',').map(n => parseFloat(n.trim()));
                if (isNaN(lon) || isNaN(lat)) throw new Error('Invalid coordinates');
                return [lon, lat];
            });
        } catch {
            return [];
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            let coordinates_forward: [number, number][];
            
            if (inputMethod === 'map') {
                if (!mapCoordinates || mapCoordinates.length < 2) {
                    throw new Error('Please add at least 2 points on the map');
                }
                coordinates_forward = mapCoordinates.map(coord => [coord.lng, coord.lat]);
            } else {
                const coordPairs = (textCoordinates || '').split('\n').filter(line => line.trim());
                if (!coordPairs || coordPairs.length < 2) {
                    throw new Error('Please enter at least 2 coordinate pairs');
                }
                coordinates_forward = coordPairs.map(pair => {
                    const [lon, lat] = pair.split(',').map(n => parseFloat(n.trim()));
                    if (isNaN(lon) || isNaN(lat)) {
                        throw new Error(`Invalid coordinate: ${pair}`);
                    }
                    return [lon, lat];
                });
            }

            const response = await fetch(`/api/routes/${routeId}/update`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    coordinates_forward
                })
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
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">Edit Route</h2>
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
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            Route Code*
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.route_code}
                                            onChange={e => setFormData({...formData, route_code: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            Route Type
                                        </label>
                                        <select
                                            value={formData.horizontal_or_vertical_road ? 'horizontal' : 'vertical'}
                                            onChange={e => setFormData({
                                                ...formData, 
                                                horizontal_or_vertical_road: e.target.value === 'horizontal'
                                            })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="horizontal">Horizontal (E-W)</option>
                                            <option value="vertical">Vertical (N-S)</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Start Point*
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.start_point_name}
                                        onChange={e => setFormData({...formData, start_point_name: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        End Point*
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.end_point_name}
                                        onChange={e => setFormData({...formData, end_point_name: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                {/* Input Method Toggle */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Coordinate Input Method
                                    </label>
                                    <div className="flex space-x-4">
                                        <button
                                            type="button"
                                            onClick={() => setInputMethod('map')}
                                            className={`px-4 py-2 rounded-lg font-medium ${
                                                inputMethod === 'map'
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                        >
                                            Click on Map
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setInputMethod('text')}
                                            className={`px-4 py-2 rounded-lg font-medium ${
                                                inputMethod === 'text'
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                        >
                                            Text Input
                                        </button>
                                    </div>
                                </div>

                                {/* Coordinates Input */}
                                {inputMethod === 'text' ? (
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            Route Coordinates (longitude,latitude)
                                        </label>
                                        <textarea
                                            value={textCoordinates}
                                            onChange={e => setTextCoordinates(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                            rows={6}
                                            placeholder="123.8854,10.3157&#10;123.8900,10.3200"
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                                            Added Points ({mapCoordinates?.length || 0})
                                        </label>
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
                                                            : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
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
                                                                        : 'bg-blue-500 text-white hover:bg-blue-600'
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
                                )}
                            </div>

                            {/* Right Column - Map */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                    {inputMethod === 'map' ? 'Click to Edit Points' : 'Route Preview'}
                                </h3>
                                <AddRouteMap 
                                    coordinates={getDisplayCoordinates()}
                                    onMapClick={inputMethod === 'map' ? handleMapClick : undefined}
                                    enableClickToAdd={inputMethod === 'map'}
                                    height="400px"
                                    highlightedIndex={selectedPointIndex}
                                    onPointClick={handlePointSelect}
                                    onSegmentClick={inputMethod === 'map' ? handleSegmentClick : undefined}
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
                        <div className="flex justify-end space-x-4 mt-6 pt-4 border-t">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`px-6 py-2 rounded-lg font-medium text-white ${
                                    isSubmitting
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-blue-500 hover:bg-blue-600'
                                }`}
                            >
                                {isSubmitting ? 'Updating...' : 'Update Route'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}