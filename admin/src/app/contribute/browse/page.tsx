'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const SimpleRouteMap = dynamic(() => import('@/components/routes/SimpleRouteMap'), { 
    ssr: false,
    loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
});

interface Route {
    id: string;
    route_code: string;
    start_point_name: string;
    end_point_name: string;
    forward_geojson: {
        type: string;
        coordinates: [number, number][];
    };
}

export default function ViewRoutesPage() {
    const [routes, setRoutes] = useState<Route[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchRoutes();
    }, []);

    const fetchRoutes = async () => {
        try {
            const response = await fetch('/api/routes');
            const data = await response.json();
            if (data.success) {
                // Filter out contribution routes
                const publicRoutes = data.routes.filter((route: any) => 
                    !route.route_code?.startsWith('CONTRIB_')
                );
                setRoutes(publicRoutes);
            }
        } catch (error) {
            console.error('Error fetching routes:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredRoutes = routes.filter(route => 
        route.route_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.start_point_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.end_point_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Browse Routes</h1>
                    <p className="text-lg text-gray-600">Explore public transportation routes in your area</p>
                    <div className="mt-4">
                        <Link 
                            href="/contribute" 
                            className="text-blue-600 hover:underline mr-4"
                        >
                            ← Back
                        </Link>
                        <Link 
                            href="/contribute/routes" 
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                            Contribute a Route
                        </Link>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="max-w-2xl mx-auto mb-8">
                    <input
                        type="text"
                        placeholder="Search routes by code or terminal..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Routes Grid */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p className="mt-4 text-gray-600">Loading routes...</p>
                    </div>
                ) : filteredRoutes.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-xl text-gray-600">No routes found</p>
                        <Link 
                            href="/contribute/routes"
                            className="mt-4 inline-block text-blue-600 hover:underline"
                        >
                            Be the first to contribute a route →
                        </Link>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredRoutes.map(route => (
                            <div 
                                key={route.id} 
                                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                                onClick={() => setSelectedRoute(selectedRoute?.id === route.id ? null : route)}
                            >
                                <div className="h-48">
                                    <SimpleRouteMap 
                                        coordinates={route.forward_geojson?.coordinates || []}
                                        height="100%"
                                    />
                                </div>
                                <div className="p-4">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                                        Route {route.route_code}
                                    </h3>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <p>
                                            <span className="font-semibold">From:</span> {route.start_point_name || 'Terminal A'}
                                        </p>
                                        <p>
                                            <span className="font-semibold">To:</span> {route.end_point_name || 'Terminal B'}
                                        </p>
                                        <p>
                                            <span className="font-semibold">Points:</span> {route.forward_geojson?.coordinates?.length || 0}
                                        </p>
                                    </div>
                                    {selectedRoute?.id === route.id && (
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <p className="text-xs text-gray-500 mb-2">Route Coordinates:</p>
                                            <div className="max-h-32 overflow-y-auto text-xs font-mono bg-gray-50 p-2 rounded">
                                                {route.forward_geojson?.coordinates?.map((coord, idx) => (
                                                    <div key={idx}>
                                                        Point {idx + 1}: {coord[1].toFixed(6)}, {coord[0].toFixed(6)}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer */}
                <div className="text-center mt-12 text-gray-600">
                    <p className="text-sm">
                        Can't find a route you know? 
                        <Link href="/contribute/routes" className="ml-1 text-blue-600 hover:underline">
                            Contribute it here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}