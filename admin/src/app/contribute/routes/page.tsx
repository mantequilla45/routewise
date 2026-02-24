'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import ConfirmModal from '@/components/ui/ConfirmModal';

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
    const [showCloseLoopModal, setShowCloseLoopModal] = useState(false);

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
            <div className="container py-6 pb-0 min-w-[90vw] mx-auto">
                {/* Header */}
                <div className="p-6 sm:p-8 flex items-center gap-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-2">Contribute a Route</h1>
                        <p className="text-base sm:text-lg lg:text-xl text-gray-600">Help map jeepney routes in your community</p>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex lg:flex-row flex-col gap-6 xl:gap-8 w-full">
                    {/* Form Section */}
                    <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8 w-full lg:w-1/3 min-w-0">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Route Information</h2>

                        <form onSubmit={handleSubmit} className="space-y-5 lg:space-y-6">
                            {/* Route Code */}
                            <div>
                                <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
                                    Route Code* (e.g., 01A, 23B)
                                </label>
                                <input
                                    type="text"
                                    value={formData.route_code}
                                    onChange={e => setFormData({ ...formData, route_code: e.target.value })}
                                    className="w-full px-4 py-3 text-sm sm:text-base border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    placeholder="Enter route code"
                                    required
                                />
                            </div>

                            {/* Contributor Info */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
                                        Your Name*
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.contributor_name}
                                        onChange={e => setFormData({ ...formData, contributor_name: e.target.value })}
                                        className="w-full px-4 py-3 text-sm sm:text-base border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                        placeholder="Your name"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
                                        Email (optional)
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.contributor_email}
                                        onChange={e => setFormData({ ...formData, contributor_email: e.target.value })}
                                        className="w-full px-4 py-3 text-sm sm:text-base border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                                    className="space-y-2 h-64 overflow-y-auto border border-gray-200 rounded-lg p-2"
                                >
                                    {mapCoordinates.map((coord, index) => (
                                        <div
                                            key={index}
                                            id={`point-${index}`}
                                            className={`flex items-center justify-between text-sm p-2 rounded cursor-pointer transition-all ${selectedPointIndex === index
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
                                                        className={`px-2 py-1 text-xs font-medium rounded ${insertMode
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

                            {/* Action Buttons */}
                            <div className="flex space-x-3 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCloseLoopModal(true)}
                                    className={`px-4 py-3 rounded-lg font-semibold transition-all ${mapCoordinates.length < 2
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : (mapCoordinates.length > 2 &&
                                            mapCoordinates[mapCoordinates.length - 1].lat === mapCoordinates[0].lat &&
                                            mapCoordinates[mapCoordinates.length - 1].lng === mapCoordinates[0].lng)
                                            ? 'bg-green-500 text-white cursor-not-allowed'
                                            : 'bg-purple-600 text-white hover:bg-purple-700'
                                        }`}
                                    disabled={mapCoordinates.length < 2 ||
                                        (mapCoordinates.length > 2 &&
                                            mapCoordinates[mapCoordinates.length - 1].lat === mapCoordinates[0].lat &&
                                            mapCoordinates[mapCoordinates.length - 1].lng === mapCoordinates[0].lng)}
                                    title={mapCoordinates.length < 2 ? 'Need at least 2 points to close loop' : ''}
                                >
                                    {(mapCoordinates.length > 2 &&
                                        mapCoordinates[mapCoordinates.length - 1].lat === mapCoordinates[0].lat &&
                                        mapCoordinates[mapCoordinates.length - 1].lng === mapCoordinates[0].lng)
                                        ? '✓ Loop Closed'
                                        : 'Close Loop'}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || mapCoordinates.length < 2}
                                    className={`flex-1 py-3 px-4 rounded-lg font-semibold text-white transition-all ${isSubmitting || mapCoordinates.length < 2
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit Route for Review'}
                                </button>
                            </div>

                            {/* Status Message */}
                            {status.message && (
                                <div className={`p-4 rounded-lg ${status.type === 'error'
                                    ? 'bg-red-100 text-red-700 border border-red-300'
                                    : 'bg-green-100 text-green-700 border border-green-300'
                                    }`}>
                                    {status.message}
                                </div>
                            )}
                        </form>
                    </div>

                    {/* Map Section */}
                    <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8 w-full lg:w-2/3 min-w-0">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Draw Route on Map</h2>
                            <div className="flex items-center gap-4">
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
                        <div className="mt-6 lg:mt-8 flex flex-col lg:flex-row gap-4 lg:gap-6">
                            {/* Legend */}
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 w-1/3">
                                <h4 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">Map Legend</h4>
                                <div className="flex flex-col gap-5 text-xs sm:text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-[10px]">✕</div>
                                        <span className="text-gray-700">Start Point</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-[10px]">O</div>
                                        <span className="text-gray-700">End Point</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-[10px]">•</div>
                                        <span className="text-gray-700">Waypoints</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-1 rounded" style={{ backgroundColor: '#FF6B6B' }}></div>
                                        <span className="text-gray-700">Route Path</span>
                                    </div>
                                </div>
                            </div>

                            {/* Instructions */}
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 w-2/3">
                                <h4 className="font-semibold text-blue-900 mb-3 text-sm sm:text-base flex items-center">
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    How to Map a Route
                                </h4>
                                <div className="space-y-3 text-xs sm:text-sm text-blue-800">
                                    <div>
                                        <p className="font-semibold mb-1">Adding Points:</p>
                                        <ul className="ml-3 space-y-0.5">
                                            <li>• Click anywhere on map → Add waypoint at end</li>
                                            <li>• Click on blue line → Insert between points</li>
                                            <li>• Minimum 2 points required</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <p className="font-semibold mb-1">Editing Points:</p>
                                        <ul className="ml-3 space-y-0.5">
                                            <li>• Select point from list → Click map to move</li>
                                            <li>• Click &quot;Insert&quot; button → Add point after selected</li>
                                            <li>• Click &quot;Remove&quot; button → Remove point</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <p className="font-semibold mb-1">Final Step:</p>
                                        <ul className="ml-3 space-y-0.5">
                                            <li>• After placing all pins → Click &quot;Close Loop&quot; button</li>
                                            <li>• This connects the end point back to start</li>
                                        </ul>
                                    </div>
                                    <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-300">
                                        <p className="text-yellow-800 font-semibold">⚠️ Important: Pin order defines travel direction!</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Footer */}
            <footer className="mt-16 bg-white/90 backdrop-blur-sm border-t border-gray-200">
                <div className="container min-w-[100vw] px-4 sm:px-6 lg:px-20 py-8 lg:py-12">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8">
                        <div className="flex items-center gap-4">
                            <div className="text-center lg:text-left">
                                <Image
                                    src="/routewise.svg"
                                    alt="Routewise"
                                    width={48}
                                    height={48}
                                    className="h-10 sm:h-12 w-auto opacity-90"
                                />
                                <p className="text-xs sm:text-sm text-gray-600">Mapping the future of public transport</p>
                            </div>
                        </div>

                        <div className="text-center lg:text-right">
                            <p className="text-sm sm:text-base text-gray-700 font-medium mb-2">
                                🛡️ All contributions are reviewed before publication
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600 max-w-md">
                                Thank you for helping improve public transportation in your community
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 lg:mt-8 pt-4 lg:pt-6 border-t border-gray-200 text-center">
                        <p className="text-xs sm:text-sm text-gray-500">
                            © {new Date().getFullYear()} Routewise. Your contribution makes a difference.
                        </p>
                    </div>
                </div>
            </footer>

            {/* Close Loop Confirmation Modal */}
            <ConfirmModal
                isOpen={showCloseLoopModal}
                onClose={() => setShowCloseLoopModal(false)}
                onConfirm={() => {
                    const firstPoint = mapCoordinates[0];
                    const lastIndex = mapCoordinates.length;
                    const closingPoint = {
                        ...firstPoint,
                        label: `Point ${lastIndex + 1} (Loop Close)`
                    };
                    setMapCoordinates([...mapCoordinates, closingPoint]);
                }}
                title="⚠️ Closing the Loop"
                message={`Once you close the loop:
• You can only add points between existing segments
• You cannot add points at the end of the route  
• The route will form a continuous loop

Are you sure you want to close the loop?`}
                confirmText="Yes, Close Loop"
                cancelText="Cancel"
                confirmButtonClass="bg-purple-600 hover:bg-purple-700"
            />
        </div>
    );
}