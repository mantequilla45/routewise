'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const SimpleRouteMap = dynamic(() => import('./SimpleRouteMap'), { 
    ssr: false,
    loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center"><span>Loading map...</span></div>
});

interface GeoJSONGeometry {
    type: string;
    coordinates: number[][];
}

interface RouteDetails {
    id: string;
    route_code: string;
    start_point_name: string;
    end_point_name: string;
    horizontal_or_vertical_road: boolean;
    forward_geojson?: GeoJSONGeometry;
    reverse_geojson?: GeoJSONGeometry;
}

interface RouteDetailsModalProps {
    routeId: string | null;
    onClose: () => void;
}

export default function RouteDetailsModal({ routeId, onClose }: RouteDetailsModalProps) {
    const [route, setRoute] = useState<RouteDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [coordinates, setCoordinates] = useState<[number, number][]>([]);

    const fetchRouteDetails = async () => {
        if (!routeId) return;
        
        try {
            setLoading(true);
            const response = await fetch(`/api/routes/${routeId}`);
            const data = await response.json();
            
            console.log('Route data received:', data);
            
            if (data.success && data.route) {
                setRoute(data.route);
                
                // Extract coordinates from GeoJSON LineString
                // GeoJSON format: { "type": "LineString", "coordinates": [[lon, lat], ...] }
                if (data.route.forward_geojson) {
                    const geojson = data.route.forward_geojson;
                    console.log('GeoJSON data:', geojson);
                    
                    if (geojson.type === 'LineString' && geojson.coordinates) {
                        setCoordinates(geojson.coordinates);
                        console.log('Coordinates set:', geojson.coordinates.length, 'points');
                    }
                } else {
                    console.log('No forward_geojson found in route data');
                }
            } else {
                console.error('Invalid response or no route found:', data);
            }
        } catch (error) {
            console.error('Failed to fetch route details:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (routeId) {
            fetchRouteDetails();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [routeId]);

    if (!routeId) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-black">Route Details</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                        ×
                    </button>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="p-8 flex justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                ) : route ? (
                    <div className="p-6 space-y-6">
                        {/* Route Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-semibold text-gray-600">Route Code</label>
                                <p className="text-lg font-bold text-black">{route.route_code}</p>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-600">Route Type</label>
                                <p className="text-lg text-black">
                                    {route.horizontal_or_vertical_road ? 'Horizontal (East-West)' : 'Vertical (North-South)'}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-600">Primary Terminal</label>
                                <p className="text-lg text-black">{route.start_point_name}</p>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-600">Secondary Terminal</label>
                                <p className="text-lg text-black">{route.end_point_name}</p>
                            </div>
                        </div>

                        {/* Map */}
                        <div>
                            <h3 className="text-lg font-semibold text-black mb-3">Route Path</h3>
                            <SimpleRouteMap 
                                coordinates={coordinates}
                                height="400px"
                            />
                        </div>

                        {/* Coordinates */}
                        <div>
                            <h3 className="text-lg font-semibold text-black mb-3">
                                Route Coordinates ({coordinates.length} points)
                            </h3>
                            <div className="bg-gray-50 p-4 rounded-lg max-h-48 overflow-y-auto">
                                <div className="space-y-1 font-mono text-sm">
                                    {coordinates.map((coord, index) => (
                                        <div key={index} className="text-black">
                                            Point {index + 1}: {coord[0].toFixed(6)}, {coord[1].toFixed(6)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 pt-4 border-t">
                            <button
                                onClick={() => {
                                    // Copy coordinates to clipboard
                                    const coordText = coordinates
                                        .map(coord => `${coord[0]},${coord[1]}`)
                                        .join('\n');
                                    navigator.clipboard.writeText(coordText);
                                    alert('Coordinates copied to clipboard!');
                                }}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                            >
                                Copy Coordinates
                            </button>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-8 text-center text-gray-500">
                        Route not found
                    </div>
                )}
            </div>
        </div>
    );
}