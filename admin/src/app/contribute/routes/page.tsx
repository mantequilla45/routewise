'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import map component to avoid SSR issues
const AddRouteMap = dynamic(() => import('@/components/routes/AddRouteMap'), { 
    ssr: false,
    loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">Loading map...</div>
});

interface Coordinate {
    lat: number;
    lng: number;
    label?: string;
}

export default function ContributeRoutePage() {
    const [formData, setFormData] = useState({
        route_code: '',
        contributor_name: '',
        contributor_email: ''
    });
    
    const [mapCoordinates, setMapCoordinates] = useState<Coordinate[]>([]);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
    const [insertMode, setInsertMode] = useState(false);
    const [showPointNumbers, setShowPointNumbers] = useState(true);
    const [hidePOIs, setHidePOIs] = useState(false);

    // Parse coordinates for map display
    const getDisplayCoordinates = (): [number, number][] => {
        return mapCoordinates.map(coord => [coord.lng, coord.lat]);
    };

    const handleSegmentClick = (afterIndex: number, lat: number, lng: number) => {
        const newPointIndex = afterIndex + 1;
        
        setMapCoordinates(prevCoords => {
            const newPoint = { lat, lng, label: '' };
            const updatedCoords = [
                ...prevCoords.slice(0, newPointIndex),
                newPoint,
                ...prevCoords.slice(newPointIndex)
            ];
            return updatedCoords.map((coord, i) => ({
                ...coord,
                label: `Point ${i + 1}`
            }));
        });
        
        setSelectedPointIndex(newPointIndex);
        
        setTimeout(() => {
            const pointsList = document.getElementById('points-list');
            const newElement = document.querySelector(`#point-${newPointIndex}`);
            if (pointsList && newElement) {
                newElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    };
    
    const handleMapClick = (lat: number, lng: number) => {
        if (insertMode && selectedPointIndex !== null) {
            setMapCoordinates(prevCoords => {
                const newPoint = { lat, lng, label: '' };
                const updatedCoords = [
                    ...prevCoords.slice(0, selectedPointIndex + 1),
                    newPoint,
                    ...prevCoords.slice(selectedPointIndex + 1)
                ];
                return updatedCoords.map((coord, i) => ({
                    ...coord,
                    label: `Point ${i + 1}`
                }));
            });
            setSelectedPointIndex(selectedPointIndex + 1);
            setInsertMode(false);
        } else if (selectedPointIndex !== null) {
            setMapCoordinates(prevCoords => 
                prevCoords.map((coord, index) => 
                    index === selectedPointIndex ? { lat, lng, label: coord.label } : coord
                )
            );
        } else {
            const newPoint = {
                lat,
                lng,
                label: `Point ${mapCoordinates.length + 1}`
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
        setMapCoordinates(prevCoords => {
            const newCoords = prevCoords.filter((_, i) => i !== index);
            return newCoords.map((coord, i) => ({
                ...coord,
                label: `Point ${i + 1}`
            }));
        });
        
        if (selectedPointIndex === index) {
            setSelectedPointIndex(null);
            setInsertMode(false);
        } else if (selectedPointIndex !== null && selectedPointIndex > index) {
            setSelectedPointIndex(selectedPointIndex - 1);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus({ type: '', message: '' });

        try {
            if (mapCoordinates.length < 2) {
                throw new Error('Please add at least 2 points on the map');
            }
            const coordinates_forward: [number, number][] = mapCoordinates.map(coord => [coord.lng, coord.lat]);

            const response = await fetch('/api/routes/contribute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    route_code: formData.route_code,
                    contributor_name: formData.contributor_name,
                    contributor_email: formData.contributor_email,
                    coordinates_forward,
                    status: 'pending' // Mark as pending for admin review
                })
            });

            const result = await response.json();

            if (result.success) {
                setStatus({ 
                    type: 'success', 
                    message: `Thank you for contributing! Route ${formData.route_code} has been submitted for review.` 
                });
                
                // Reset form
                setFormData({
                    route_code: '',
                    contributor_name: '',
                    contributor_email: ''
                });
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
                message: errorMessage 
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Contribute a Route</h1>
                    <p className="text-lg text-gray-600">Help map jeepney routes in your community</p>
                </div>

                {/* Main Content */}
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Form Section */}
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Route Information</h2>
                        
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Route Code */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Route Code* (e.g., 01A, 23B)
                                </label>
                                <input
                                    type="text"
                                    value={formData.route_code}
                                    onChange={e => setFormData({...formData, route_code: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter route code"
                                    required
                                />
                            </div>

                            {/* Contributor Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Your Name*
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.contributor_name}
                                        onChange={e => setFormData({...formData, contributor_name: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Your name"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Email (optional)
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.contributor_email}
                                        onChange={e => setFormData({...formData, contributor_email: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="your@email.com"
                                    />
                                </div>
                            </div>

                            {/* Route Points */}
                            <div className="border-t pt-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Route Points ({mapCoordinates.length})
                                    {mapCoordinates.length > 2 && 
                                     Math.abs(mapCoordinates[0].lat - mapCoordinates[mapCoordinates.length - 1].lat) < 0.000001 &&
                                     Math.abs(mapCoordinates[0].lng - mapCoordinates[mapCoordinates.length - 1].lng) < 0.000001 && (
                                        <span className="ml-2 text-purple-600 text-xs font-medium">🔄 Closed Loop</span>
                                    )}
                                </label>
                                <div 
                                    id="points-list"
                                    className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2"
                                >
                                    {mapCoordinates.map((coord, index) => (
                                        <div 
                                            key={index} 
                                            id={`point-${index}`}
                                            className={`flex items-center justify-between text-sm p-2 rounded cursor-pointer transition-all ${
                                                selectedPointIndex === index 
                                                    ? 'bg-yellow-100 border-2 border-yellow-400 shadow-md' 
                                                    : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                                            }`}
                                            onClick={() => handlePointSelect(index)}
                                        >
                                            <span className="text-gray-800 flex-1">
                                                {coord.label}: {coord.lat.toFixed(6)}, {coord.lng.toFixed(6)}
                                                {selectedPointIndex === index && !insertMode && (
                                                    <span className="ml-2 text-yellow-600 font-medium text-xs">(Click map to move)</span>
                                                )}
                                                {selectedPointIndex === index && insertMode && (
                                                    <span className="ml-2 text-green-600 font-medium text-xs">(Click map to add after)</span>
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
                                                    >
                                                        {insertMode ? 'Cancel' : 'Insert'}
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeMapCoordinate(index);
                                                    }}
                                                    className="text-red-600 hover:text-red-800 font-medium px-2 py-1 text-xs"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {mapCoordinates.length === 0 && (
                                        <p className="text-gray-500 text-sm text-center py-4">Click on the map to add points</p>
                                    )}
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting || mapCoordinates.length < 2}
                                className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all ${
                                    isSubmitting || mapCoordinates.length < 2
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700 transform hover:scale-105'
                                }`}
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Route for Review'}
                            </button>

                            {/* Status Message */}
                            {status.message && (
                                <div className={`p-4 rounded-lg ${
                                    status.type === 'error' 
                                        ? 'bg-red-100 text-red-700 border border-red-300' 
                                        : 'bg-green-100 text-green-700 border border-green-300'
                                }`}>
                                    {status.message}
                                </div>
                            )}
                        </form>
                    </div>

                    {/* Map Section */}
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-gray-900">Draw Route on Map</h2>
                            <div className="flex items-center gap-3">
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={showPointNumbers}
                                        onChange={e => setShowPointNumbers(e.target.checked)}
                                        className="sr-only"
                                    />
                                    <div className="relative">
                                        <div className={`block w-10 h-6 rounded-full ${showPointNumbers ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                                        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${showPointNumbers ? 'transform translate-x-4' : ''}`}></div>
                                    </div>
                                    <span className="ml-2 text-sm font-medium text-gray-700">Show Numbers</span>
                                </label>
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={hidePOIs}
                                        onChange={e => setHidePOIs(e.target.checked)}
                                        className="sr-only"
                                    />
                                    <div className="relative">
                                        <div className={`block w-10 h-6 rounded-full ${hidePOIs ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                                        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${hidePOIs ? 'transform translate-x-4' : ''}`}></div>
                                    </div>
                                    <span className="ml-2 text-sm font-medium text-gray-700">Hide Places</span>
                                </label>
                            </div>
                        </div>
                        <AddRouteMap 
                            coordinates={getDisplayCoordinates()}
                            onMapClick={handleMapClick}
                            enableClickToAdd={true}
                            height="500px"
                            highlightedIndex={selectedPointIndex}
                            onPointClick={handlePointSelect}
                            onSegmentClick={handleSegmentClick}
                            showPointNumbers={showPointNumbers}
                            hidePOIs={hidePOIs}
                        />
                        
                        {/* Map Instructions */}
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                            <h3 className="font-semibold text-blue-900 mb-2">How to map a route:</h3>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li className="font-bold text-red-700">⚠️ Pin order defines travel direction!</li>
                                <li>• Click on the map to add route waypoints</li>
                                <li>• <span className="text-green-700 font-semibold">Green X</span> = Route start point</li>
                                <li>• <span className="text-red-700 font-semibold">Red O</span> = Route end point</li>
                                <li>• Click on the line between points to insert waypoints</li>
                                <li>• Select a point and click "Insert" to add after it</li>
                                <li>• Select a point and click elsewhere to move it</li>
                                <li>• Minimum 2 points required to submit</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="text-center mt-8 text-gray-600">
                    <p className="text-sm">
                        All contributions will be reviewed by administrators before being published.
                    </p>
                    <p className="text-xs mt-2">
                        Thank you for helping improve public transportation mapping!
                    </p>
                </div>
            </div>
        </div>
    );
}