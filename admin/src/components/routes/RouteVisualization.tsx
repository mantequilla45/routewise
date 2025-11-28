'use client';

import { useState } from 'react';

interface RouteVisualizationProps {
    coordinates: [number, number][];
    routeCode: string;
    startPoint: string;
    endPoint: string;
}

export default function RouteVisualization({ 
    coordinates, 
    routeCode,
    startPoint,
    endPoint 
}: RouteVisualizationProps) {
    const [showAll, setShowAll] = useState(false);
    const displayLimit = 10;
    
    const displayCoords = showAll ? coordinates : coordinates.slice(0, displayLimit);
    
    // Calculate route statistics
    const totalPoints = coordinates.length;
    const startCoord = coordinates[0];
    const endCoord = coordinates[coordinates.length - 1];
    
    // Simple distance calculation (Haversine formula)
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Radius of Earth in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };
    
    const straightLineDistance = startCoord && endCoord 
        ? calculateDistance(startCoord[1], startCoord[0], endCoord[1], endCoord[0])
        : 0;

    // Create OpenStreetMap URL for viewing
    const osmUrl = coordinates.length > 0 
        ? `https://www.openstreetmap.org/?mlat=${coordinates[0][1]}&mlon=${coordinates[0][0]}&zoom=14`
        : '#';

    // Create Google Maps URL (for external viewing)
    const googleMapsUrl = coordinates.length > 0
        ? `https://www.google.com/maps/dir/${coordinates.map(c => `${c[1]},${c[0]}`).join('/')}`
        : '#';

    return (
        <div className="space-y-4">
            {/* Route Summary Card */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <h4 className="text-sm font-semibold text-gray-600">Route Code</h4>
                        <p className="text-2xl font-bold text-blue-600">{routeCode}</p>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-gray-600">Total Waypoints</h4>
                        <p className="text-2xl font-bold text-blue-600">{totalPoints}</p>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-gray-600">Straight Distance</h4>
                        <p className="text-lg font-semibold text-gray-800">{straightLineDistance.toFixed(2)} km</p>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-gray-600">Route Type</h4>
                        <p className="text-lg font-semibold text-gray-800">Jeepney</p>
                    </div>
                </div>
            </div>

            {/* Route Endpoints */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="font-semibold text-green-800">Start Point</span>
                    </div>
                    <p className="text-gray-800 font-medium">{startPoint}</p>
                    {startCoord && (
                        <p className="text-sm text-gray-600 mt-1">
                            {startCoord[1].toFixed(6)}, {startCoord[0].toFixed(6)}
                        </p>
                    )}
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="font-semibold text-red-800">End Point</span>
                    </div>
                    <p className="text-gray-800 font-medium">{endPoint}</p>
                    {endCoord && (
                        <p className="text-sm text-gray-600 mt-1">
                            {endCoord[1].toFixed(6)}, {endCoord[0].toFixed(6)}
                        </p>
                    )}
                </div>
            </div>

            {/* Coordinate Table */}
            <div className="bg-white border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b">
                    <h3 className="font-semibold text-gray-900">Route Coordinates</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                    <table className="w-full">
                        <thead className="bg-gray-100 sticky top-0">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">#</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Latitude</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Longitude</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Type</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {displayCoords.map((coord, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                        {index + 1}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-700 font-mono">
                                        {coord[1].toFixed(6)}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-700 font-mono">
                                        {coord[0].toFixed(6)}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                        {index === 0 ? (
                                            <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded">Start</span>
                                        ) : index === coordinates.length - 1 ? (
                                            <span className="px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded">End</span>
                                        ) : (
                                            <span className="px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-100 rounded">Waypoint</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {coordinates.length > displayLimit && (
                    <div className="px-4 py-3 bg-gray-50 border-t">
                        <button
                            onClick={() => setShowAll(!showAll)}
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                        >
                            {showAll ? 'Show Less' : `Show All ${coordinates.length} Points`}
                        </button>
                    </div>
                )}
            </div>

            {/* External Map Links */}
            <div className="flex gap-4">
                <a
                    href={osmUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-4 py-3 bg-green-600 text-white text-center rounded-lg hover:bg-green-700 font-medium"
                >
                    View on OpenStreetMap
                </a>
                <button
                    onClick={() => {
                        const coordText = coordinates
                            .map(coord => `${coord[0]},${coord[1]}`)
                            .join('\n');
                        navigator.clipboard.writeText(coordText);
                        alert('Coordinates copied to clipboard!');
                    }}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 font-medium"
                >
                    Copy All Coordinates
                </button>
            </div>

            {/* Route Path Visualization (Simple SVG) */}
            <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Route Path Preview</h4>
                <svg 
                    viewBox="0 0 400 200" 
                    className="w-full h-48 bg-white rounded border"
                >
                    {coordinates.length > 1 && (() => {
                        // Normalize coordinates to fit in SVG viewport
                        const lons = coordinates.map(c => c[0]);
                        const lats = coordinates.map(c => c[1]);
                        const minLon = Math.min(...lons);
                        const maxLon = Math.max(...lons);
                        const minLat = Math.min(...lats);
                        const maxLat = Math.max(...lats);
                        
                        const points = coordinates.map(coord => {
                            const x = ((coord[0] - minLon) / (maxLon - minLon)) * 380 + 10;
                            const y = 190 - ((coord[1] - minLat) / (maxLat - minLat)) * 180;
                            return `${x},${y}`;
                        }).join(' ');
                        
                        return (
                            <>
                                <polyline 
                                    points={points}
                                    fill="none"
                                    stroke="#3B82F6"
                                    strokeWidth="2"
                                />
                                {/* Start point */}
                                <circle 
                                    cx={((coordinates[0][0] - minLon) / (maxLon - minLon)) * 380 + 10}
                                    cy={190 - ((coordinates[0][1] - minLat) / (maxLat - minLat)) * 180}
                                    r="5"
                                    fill="#10B981"
                                />
                                {/* End point */}
                                <circle 
                                    cx={((coordinates[coordinates.length - 1][0] - minLon) / (maxLon - minLon)) * 380 + 10}
                                    cy={190 - ((coordinates[coordinates.length - 1][1] - minLat) / (maxLat - minLat)) * 180}
                                    r="5"
                                    fill="#EF4444"
                                />
                            </>
                        );
                    })()}
                </svg>
            </div>
        </div>
    );
}