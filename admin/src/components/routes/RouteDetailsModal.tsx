'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const SimpleRouteMap = dynamic(() => import('./SimpleRouteMap'), { 
    ssr: false,
    loading: () => <div className="h-96 bg-[#2D2D2D] animate-pulse rounded-lg flex items-center justify-center"><span className="text-gray-400">Loading map...</span></div>
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
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#3A3A3A] rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-[#404040]">
                {/* Header */}
                <div className="sticky top-0 bg-[#3A3A3A] border-b border-[#404040] p-4 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">Route Details</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-[#FFCC66] text-2xl transition-colors"
                    >
                        ×
                    </button>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="p-8 flex justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFCC66]"></div>
                    </div>
                ) : route ? (
                    <div className="p-6 space-y-6">
                        {/* Route Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-semibold text-gray-400">Route Code</label>
                                <p className="text-lg font-bold text-[#FFCC66]">{route.route_code}</p>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-400">Route Type</label>
                                <p className="text-lg text-white">
                                    {route.horizontal_or_vertical_road ? 'Horizontal (East-West)' : 'Vertical (North-South)'}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-400">Primary Terminal</label>
                                <p className="text-lg text-white">{route.start_point_name}</p>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-400">Secondary Terminal</label>
                                <p className="text-lg text-white">{route.end_point_name}</p>
                            </div>
                        </div>

                        {/* Map */}
                        <div>
                            <h3 className="text-lg font-semibold text-[#FFCC66] mb-3">Route Path</h3>
                            <SimpleRouteMap 
                                coordinates={coordinates}
                                height="400px"
                            />
                        </div>

                        {/* Coordinates */}
                        <div>
                            <h3 className="text-lg font-semibold text-[#FFCC66] mb-3">
                                Route Coordinates ({coordinates.length} points)
                            </h3>
                            <div className="bg-[#2D2D2D] border border-[#4C4C4C] p-4 rounded-lg max-h-48 overflow-y-auto">
                                <div className="space-y-1 font-mono text-sm">
                                    {coordinates.map((coord, index) => (
                                        <div key={index} className="text-gray-300">
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
                                className="px-4 py-2 bg-[#FFCC66] text-black font-semibold rounded-lg hover:bg-[#CC9933] transition-colors"
                            >
                                Copy Coordinates
                            </button>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-[#4C4C4C] text-white rounded-lg hover:bg-[#404040] transition-colors border border-[#404040]"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-8 text-center text-gray-400">
                        Route not found
                    </div>
                )}
            </div>
        </div>
    );
}