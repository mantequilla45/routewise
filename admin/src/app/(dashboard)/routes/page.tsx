'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import RoutesList from '@/components/routes/RoutesList';
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

interface Contribution {
    id: string;
    route_code: string;
    contributor_name: string;
    contributor_email?: string;
    forward_geojson: {
        type: string;
        coordinates: [number, number][];
    };
    status: string;
    created_at: string;
    review_notes?: string;
}

export default function EnhancedAddRoutePage() {
    const [activeTab, setActiveTab] = useState<'add' | 'list' | 'review'>('add');
    const [contributions, setContributions] = useState<Contribution[]>([]);
    const [loadingContributions, setLoadingContributions] = useState(false);
    const [selectedContribution, setSelectedContribution] = useState<Contribution | null>(null);
    const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
    const [reviewNotes, setReviewNotes] = useState('');
    const [formData, setFormData] = useState({
        route_code: ''
    });
    
    const [mapCoordinates, setMapCoordinates] = useState<Coordinate[]>([]);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
    const [insertMode, setInsertMode] = useState(false);
    const [showPointNumbers, setShowPointNumbers] = useState(true);
    const [hidePOIs, setHidePOIs] = useState(false);
    const [showCloseLoopModal, setShowCloseLoopModal] = useState(false);

    useEffect(() => {
        // Fetch contributions on component mount to show badge count
        fetchContributions();
    }, []);

    // Parse coordinates for map display
    const getDisplayCoordinates = (): [number, number][] => {
        return mapCoordinates.map(coord => [coord.lng, coord.lat]);
    };

    const handleSegmentClick = (afterIndex: number, lat: number, lng: number) => {
        // Insert a new point after the specified index
        const newPointIndex = afterIndex + 1;
        
        setMapCoordinates(prevCoords => {
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
        
        // Auto-select the newly inserted point (this is intentional for insertions)
        setSelectedPointIndex(newPointIndex);
        
        // Scroll to the new point
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
            // Insert new point after the selected point
            setMapCoordinates(prevCoords => {
                const newPoint = { lat, lng, label: '' };
                const updatedCoords = [
                    ...prevCoords.slice(0, selectedPointIndex + 1),
                    newPoint,
                    ...prevCoords.slice(selectedPointIndex + 1)
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
            
            // Scroll to the new point
            setTimeout(() => {
                const pointsList = document.getElementById('points-list');
                const newElement = document.querySelector(`#point-${selectedPointIndex + 1}`);
                if (pointsList && newElement) {
                    newElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
            
        } else if (!insertMode && selectedPointIndex !== null) {
            // Update existing point at its current position
            setMapCoordinates(prevCoords => {
                if (!prevCoords || prevCoords.length === 0 || selectedPointIndex >= prevCoords.length) {
                    return prevCoords;
                }
                
                return prevCoords.map((coord, index) => {
                    if (index === selectedPointIndex) {
                        // Update this point with new lat/lng, keeping the label
                        return {
                            ...coord,
                            lat,
                            lng
                        };
                    }
                    return coord;
                });
            });
            // Keep the point selected after editing to avoid confusion
            // User can click elsewhere or press Escape to deselect
            // setSelectedPointIndex(null);
        } else {
            // Check if this is a closed loop
            const isClosedLoop = mapCoordinates.length > 2 && 
                Math.abs(mapCoordinates[0].lat - mapCoordinates[mapCoordinates.length - 1].lat) < 0.000001 &&
                Math.abs(mapCoordinates[0].lng - mapCoordinates[mapCoordinates.length - 1].lng) < 0.000001;
            
            if (isClosedLoop) {
                // Don't allow adding points at the end for closed loops
                alert("This route is a closed loop. You can only add points between existing segments.\n\nTo add a point:\n1. Select an existing point\n2. Click 'Insert' button\n3. Click on the map where you want the new point");
                return;
            }
            
            // Add new point at the end
            const newIndex = mapCoordinates.length;
            const newCoord = { lat, lng, label: `Point ${newIndex + 1}` };
            setMapCoordinates([...mapCoordinates, newCoord]);
            
            // Don't auto-select when adding new points at the end
        }
    };

    const handlePointSelect = (index: number) => {
        if (selectedPointIndex === index) {
            // Deselect if clicking the same point
            setSelectedPointIndex(null);
            setInsertMode(false); // Also exit insert mode when deselecting
        } else {
            // Select the point
            setSelectedPointIndex(index);
            setInsertMode(false); // Reset insert mode when selecting a different point
        }
    };

    const removeMapCoordinate = (index: number) => {
        setMapCoordinates(prev => {
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus({ type: '', message: '' });

        try {
            if (mapCoordinates.length < 2) {
                throw new Error('Please add at least 2 points on the map');
            }
            const coordinates_forward: [number, number][] = mapCoordinates.map(coord => [coord.lng, coord.lat]);

            const response = await fetch('/api/routes/add', {
                method: 'POST',
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
                setStatus({ 
                    type: 'success', 
                    message: `Route ${result.route.route_code} added successfully!` 
                });
                
                // Reset form
                setFormData({
                    route_code: ''
                });
                setMapCoordinates([]);
                
                // Switch to list view after successful add
                setTimeout(() => {
                    setActiveTab('list');
                }, 2000);
            } else {
                throw new Error(result.error || 'Failed to add route');
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

    const importFromGoogleMaps = () => {
        const url = prompt('Paste Google Maps URL:');
        if (url) {
            // Extract coordinates from Google Maps URL (basic implementation)
            const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
            if (match) {
                const [, lat, lng] = match;
                handleMapClick(parseFloat(lat), parseFloat(lng));
            } else {
                alert('Could not extract coordinates from URL');
            }
        }
    };

    const fetchContributions = async () => {
        setLoadingContributions(true);
        try {
            const response = await fetch('/api/routes/contribute?status=pending');
            const data = await response.json();
            if (data.success) {
                setContributions(data.contributions);
            }
        } catch (error) {
            console.error('Error fetching contributions:', error);
        } finally {
            setLoadingContributions(false);
        }
    };

    const handleApproveContribution = async (contribution: Contribution) => {
        try {
            // First, add the route to the main routes table
            const response = await fetch('/api/routes/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    route_code: contribution.route_code,
                    start_point_name: 'Terminal A',
                    end_point_name: 'Terminal B',
                    coordinates_forward: contribution.forward_geojson.coordinates
                })
            });

            const result = await response.json();

            if (result.success) {
                // Update contribution status to approved
                await fetch(`/api/routes/contribute/${contribution.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        status: 'approved',
                        review_notes: reviewNotes,
                        transferred_route_id: result.route.id
                    })
                });

                // Refresh contributions list
                fetchContributions();
                setSelectedContribution(null);
                setReviewAction(null);
                setReviewNotes('');
                
                alert(`Route ${contribution.route_code} has been approved and added to the system!`);
            }
        } catch (error) {
            console.error('Error approving contribution:', error);
            alert('Failed to approve contribution');
        }
    };

    const handleRejectContribution = async (contribution: Contribution) => {
        try {
            await fetch(`/api/routes/contribute/${contribution.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'rejected',
                    review_notes: reviewNotes
                })
            });

            fetchContributions();
            setSelectedContribution(null);
            setReviewAction(null);
            setReviewNotes('');
            
            alert(`Route ${contribution.route_code} has been rejected.`);
        } catch (error) {
            console.error('Error rejecting contribution:', error);
            alert('Failed to reject contribution');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Route Management</h1>
                    <p className="text-gray-700 mt-2">Add and manage jeepney routes</p>
                </div>

                {/* Tab Navigation */}
                <div className="bg-white rounded-lg shadow-md mb-6">
                    <div className="flex border-b">
                        <button
                            onClick={() => setActiveTab('add')}
                            className={`px-6 py-3 font-medium transition-colors ${
                                activeTab === 'add'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-800 hover:text-gray-900'
                            }`}
                        >
                            Add New Route
                        </button>
                        <button
                            onClick={() => setActiveTab('list')}
                            className={`px-6 py-3 font-medium transition-colors ${
                                activeTab === 'list'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-800 hover:text-gray-900'
                            }`}
                        >
                            View All Routes
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('review');
                                if (activeTab !== 'review') {
                                    fetchContributions();
                                }
                            }}
                            className={`px-6 py-3 font-medium transition-colors relative ${
                                activeTab === 'review'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-800 hover:text-gray-900'
                            }`}
                        >
                            Review Contributions
                            {contributions.filter(c => c.status === 'pending').length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                    {contributions.filter(c => c.status === 'pending').length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Content */}
                {activeTab === 'add' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Form Section */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-bold text-black mb-4">Route Details</h2>
                            
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Basic Information */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-black mb-1">
                                            Route Code*
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.route_code}
                                            onChange={e => setFormData({...formData, route_code: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="e.g., 01A"
                                            required
                                        />
                                    </div>
                                </div>


                                {/* Coordinates Input */}
                                <div className="border-t pt-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-black mb-1">
                                            Added Points ({mapCoordinates.length})
                                            {mapCoordinates.length > 2 && 
                                             Math.abs(mapCoordinates[0].lat - mapCoordinates[mapCoordinates.length - 1].lat) < 0.000001 &&
                                             Math.abs(mapCoordinates[0].lng - mapCoordinates[mapCoordinates.length - 1].lng) < 0.000001 && (
                                                <span className="ml-2 text-purple-600 text-xs font-medium">🔄 Closed Loop - Use Insert to add points</span>
                                            )}
                                        </label>
                                        <div 
                                            id="points-list"
                                            className="space-y-2 h-64 overflow-y-auto border border-gray-200 rounded-lg p-2"
                                            style={{ scrollBehavior: 'smooth' }}
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
                                            {mapCoordinates.length === 0 && (
                                                <p className="text-gray-500 text-sm text-center py-4">Click on the map to add points</p>
                                            )}
                                        </div>
                                        
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex space-x-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowCloseLoopModal(true)}
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                            mapCoordinates.length < 2
                                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                : (mapCoordinates.length > 2 && 
                                                   mapCoordinates[mapCoordinates.length - 1].lat === mapCoordinates[0].lat &&
                                                   mapCoordinates[mapCoordinates.length - 1].lng === mapCoordinates[0].lng)
                                                    ? 'bg-green-500 text-white cursor-not-allowed'
                                                    : 'bg-purple-500 text-white hover:bg-purple-600'
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
                                        disabled={isSubmitting}
                                        className={`flex-1 py-2 px-4 rounded-lg font-medium text-white transition-colors ${
                                            isSubmitting
                                                ? 'bg-gray-400 cursor-not-allowed'
                                                : 'bg-blue-500 hover:bg-blue-600'
                                        }`}
                                    >
                                        {isSubmitting ? 'Adding...' : 'Add Route'}
                                    </button>
                                </div>

                                {/* Status Message */}
                                {status.message && (
                                    <div className={`p-4 rounded-lg ${
                                        status.type === 'error' 
                                            ? 'bg-red-100 text-red-700' 
                                            : 'bg-green-100 text-green-700'
                                    }`}>
                                        {status.message}
                                    </div>
                                )}
                            </form>
                        </div>

                        {/* Map Section */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-black">Click to Add Points</h2>
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
                                        <span className="ml-2 text-sm font-medium text-gray-700">Numbers</span>
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
                                <h3 className="font-semibold text-blue-900 mb-2">How to add points:</h3>
                                <ul className="text-sm text-blue-800 space-y-1">
                                        <>
                                            <li className="font-bold text-red-700">⚠️ IMPORTANT: Pin order defines jeepney travel direction!</li>
                                            <li>• <span className="text-green-700 font-semibold">GREEN marker (START)</span> = Where jeepney begins its route</li>
                                            <li>• <span className="text-red-700 font-semibold">RED marker (END)</span> = Where jeepney ends its route</li>
                                            <li>• Arrows show the direction jeepney will travel</li>
                                            <li>• Click on the map to add waypoints at the end</li>
                                            <li>• Click on the route line to insert points between</li>
                                            <li>• Follow the actual jeepney route direction</li>
                                        </>
                                </ul>
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'list' ? (
                    <RoutesList />
                ) : activeTab === 'review' ? (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Pending Route Contributions</h2>
                        
                        {loadingContributions ? (
                            <div className="text-center py-8">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                <p className="mt-2 text-gray-600">Loading contributions...</p>
                            </div>
                        ) : contributions.filter(c => c.status === 'pending').length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-gray-600">No pending contributions to review</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {contributions.filter(c => c.status === 'pending').map(contribution => (
                                    <div key={contribution.id} className="border rounded-lg p-4 hover:bg-gray-50">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    Route {contribution.route_code}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    Contributed by: {contribution.contributor_name}
                                                    {contribution.contributor_email && ` (${contribution.contributor_email})`}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Submitted: {new Date(contribution.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedContribution(contribution);
                                                        setReviewAction(null);
                                                    }}
                                                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                                                >
                                                    Review
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {/* Show map preview if selected */}
                                        {selectedContribution?.id === contribution.id && (
                                            <div className="mt-4 border-t pt-4">
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                    <div>
                                                        <h4 className="font-semibold mb-2">Route Preview</h4>
                                                        <div className="h-64">
                                                            <AddRouteMap
                                                                coordinates={contribution.forward_geojson.coordinates}
                                                                height="100%"
                                                                enableClickToAdd={false}
                                                                showPointNumbers={true}
                                                                hidePOIs={false}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold mb-2">Route Details</h4>
                                                        <div className="space-y-2 text-sm">
                                                            <p><strong>Points:</strong> {contribution.forward_geojson.coordinates.length}</p>
                                                            <p><strong>Type:</strong> {contribution.forward_geojson.type}</p>
                                                            
                                                            {!reviewAction && (
                                                                <div className="flex gap-2 mt-4">
                                                                    <button
                                                                        onClick={() => setReviewAction('approve')}
                                                                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                                                    >
                                                                        Approve
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setReviewAction('reject')}
                                                                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                                                                    >
                                                                        Reject
                                                                    </button>
                                                                </div>
                                                            )}
                                                            
                                                            {reviewAction && (
                                                                <div className="mt-4">
                                                                    <label className="block text-sm font-semibold mb-1">
                                                                        Review Notes:
                                                                    </label>
                                                                    <textarea
                                                                        value={reviewNotes}
                                                                        onChange={e => setReviewNotes(e.target.value)}
                                                                        className="w-full px-3 py-2 border rounded text-sm"
                                                                        rows={3}
                                                                        placeholder={reviewAction === 'approve' ? 'Optional approval notes...' : 'Please provide rejection reason...'}
                                                                        required={reviewAction === 'reject'}
                                                                    />
                                                                    <div className="flex gap-2 mt-2">
                                                                        <button
                                                                            onClick={() => {
                                                                                if (reviewAction === 'approve') {
                                                                                    handleApproveContribution(contribution);
                                                                                } else {
                                                                                    handleRejectContribution(contribution);
                                                                                }
                                                                            }}
                                                                            className={`px-4 py-2 text-white rounded ${
                                                                                reviewAction === 'approve' 
                                                                                    ? 'bg-green-500 hover:bg-green-600' 
                                                                                    : 'bg-red-500 hover:bg-red-600'
                                                                            }`}
                                                                        >
                                                                            Confirm {reviewAction === 'approve' ? 'Approval' : 'Rejection'}
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                setReviewAction(null);
                                                                                setReviewNotes('');
                                                                            }}
                                                                            className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : null}
            </div>
            
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