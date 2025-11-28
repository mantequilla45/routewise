'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const RouteDetailsModal = dynamic(() => import('./RouteDetailsModal'), { ssr: false });
const EditRouteModal = dynamic(() => import('./EditRouteModal'), { ssr: false });

interface Route {
    id: string;
    route_code: string;
    start_point_name: string;
    end_point_name: string;
    horizontal_or_vertical_road: boolean;
}

export default function RoutesList({ onRouteSelect }: { onRouteSelect?: (route: Route) => void }) {
    const [routes, setRoutes] = useState<Route[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
    const [editingRouteId, setEditingRouteId] = useState<string | null>(null);

    useEffect(() => {
        fetchRoutes();
    }, []);

    const fetchRoutes = async () => {
        try {
            const response = await fetch('/api/routes/add');
            const data = await response.json();
            if (data.success) {
                setRoutes(data.routes);
            }
        } catch (error) {
            console.error('Failed to fetch routes:', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteRoute = async (id: string) => {
        if (!confirm('Are you sure you want to delete this route?')) return;
        
        try {
            const response = await fetch(`/api/routes/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                setRoutes(routes.filter(r => r.id !== id));
            }
        } catch (error) {
            console.error('Failed to delete route:', error);
        }
    };

    const filteredRoutes = routes.filter(route => 
        route.route_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.start_point_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.end_point_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-black">Existing Routes ({routes.length})</h2>
                <input
                    type="text"
                    placeholder="Search routes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg w-64 text-black bg-white"
                />
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b bg-gray-50">
                            <th className="text-left p-2 text-black font-semibold">Code</th>
                            <th className="text-left p-2 text-black font-semibold">Terminal 1</th>
                            <th className="text-left p-2 text-black font-semibold">Terminal 2</th>
                            <th className="text-left p-2 text-black font-semibold">Type</th>
                            <th className="text-left p-2 text-black font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRoutes.map(route => (
                            <tr key={route.id} className="border-b hover:bg-gray-50">
                                <td className="p-2 font-medium text-black">{route.route_code}</td>
                                <td className="p-2 text-gray-900">{route.start_point_name}</td>
                                <td className="p-2 text-gray-900">{route.end_point_name}</td>
                                <td className="p-2">
                                    <span className={`px-2 py-1 rounded text-xs ${
                                        route.horizontal_or_vertical_road 
                                            ? 'bg-blue-100 text-blue-800' 
                                            : 'bg-green-100 text-green-800'
                                    }`}>
                                        {route.horizontal_or_vertical_road ? 'Horizontal' : 'Vertical'}
                                    </span>
                                </td>
                                <td className="p-2">
                                    <button
                                        onClick={() => {
                                            setSelectedRouteId(route.id);
                                            if (onRouteSelect) onRouteSelect(route);
                                        }}
                                        className="text-blue-600 hover:text-blue-800 mr-3 font-medium"
                                    >
                                        View
                                    </button>
                                    <button
                                        onClick={() => setEditingRouteId(route.id)}
                                        className="text-green-600 hover:text-green-800 mr-3 font-medium"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => deleteRoute(route.id)}
                                        className="text-red-600 hover:text-red-800 font-medium"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredRoutes.length === 0 && (
                    <div className="text-center py-8 text-gray-800 font-medium">
                        No routes found
                    </div>
                )}
            </div>

            {/* Route Details Modal */}
            <RouteDetailsModal 
                routeId={selectedRouteId}
                onClose={() => setSelectedRouteId(null)}
            />
            
            {/* Edit Route Modal */}
            {editingRouteId && (
                <EditRouteModal 
                    routeId={editingRouteId}
                    isOpen={!!editingRouteId}
                    onClose={() => setEditingRouteId(null)}
                    onUpdate={() => {
                        setEditingRouteId(null);
                        fetchRoutes(); // Refresh the list after update
                    }}
                />
            )}
        </div>
    );
}