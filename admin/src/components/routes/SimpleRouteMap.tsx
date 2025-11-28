'use client';

import { useEffect, useRef, useState } from 'react';
import { googleMapsLoader } from '@/lib/maps/googleMapsLoader';

interface SimpleRouteMapProps {
    coordinates: [number, number][];
    height?: string;
}

export default function SimpleRouteMap({ coordinates, height = '400px' }: SimpleRouteMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<google.maps.Map | null>(null);
    const markersRef = useRef<google.maps.Marker[]>([]);
    const polylineRef = useRef<google.maps.Polyline | null>(null);
    const [isMapReady, setIsMapReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        const initMap = async () => {
            try {
                await googleMapsLoader.load();
                
                if (!mounted) return;
                
                if (mapRef.current && !mapInstanceRef.current && window.google?.maps) {
                    console.log('Creating map instance for SimpleRouteMap');
                    const map = new window.google.maps.Map(mapRef.current, {
                        center: { lat: 10.3157, lng: 123.8854 },
                        zoom: 12,
                        mapTypeControl: false,
                        streetViewControl: false,
                    });
                    
                    mapInstanceRef.current = map;
                    setIsMapReady(true);
                }
            } catch (err) {
                console.error('Failed to initialize map:', err);
                if (mounted) {
                    setError('Failed to load Google Maps');
                }
            }
        };

        initMap();

        return () => {
            mounted = false;
        };
    }, []);

    // Update map when coordinates change
    useEffect(() => {
        if (!mapInstanceRef.current || !isMapReady || !window.google?.maps) return;

        const map = mapInstanceRef.current;
        
        // Clear existing markers and polyline
        markersRef.current.forEach(marker => {
            if (marker && marker.setMap) {
                marker.setMap(null);
            }
        });
        markersRef.current = [];
        
        if (polylineRef.current) {
            polylineRef.current.setMap(null);
            polylineRef.current = null;
        }

        // Draw route if coordinates exist
        if (coordinates && coordinates.length > 0) {
            // Convert coordinates to Google Maps format
            const path = coordinates.map(coord => ({
                lat: coord[1],
                lng: coord[0]
            }));
            
            // Create closed loop by adding first point at the end if we have at least 2 points
            const closedPath = path.length >= 2 ? [...path, path[0]] : path;
            
            // Draw polyline
            polylineRef.current = new window.google.maps.Polyline({
                path: closedPath,
                geodesic: true,
                strokeColor: '#FF6B6B',
                strokeOpacity: 1.0,
                strokeWeight: 3,
                map: map
            });
            
            // Add uniform markers for all points (no start/end distinction)
            if (path.length > 0) {
                path.forEach((point, index) => {
                    const marker = new window.google.maps.Marker({
                        position: point,
                        map: map,
                        title: `Point ${index + 1}`,
                        icon: {
                            path: window.google.maps.SymbolPath.CIRCLE,
                            scale: 6,
                            fillColor: '#FF6B6B',
                            fillOpacity: 1,
                            strokeColor: 'white',
                            strokeWeight: 2
                        }
                    });
                    markersRef.current.push(marker);
                });
                
                // Fit bounds to show entire route
                const bounds = new window.google.maps.LatLngBounds();
                path.forEach(point => bounds.extend(point));
                map.fitBounds(bounds);
            }
        }
    }, [coordinates, isMapReady]);

    if (error) {
        return (
            <div style={{ height, width: '100%' }} className="rounded-lg bg-red-50 flex items-center justify-center">
                <div className="text-red-600">{error}</div>
            </div>
        );
    }

    return (
        <div>
            <div style={{ height, width: '100%' }} className="rounded-lg bg-gray-100 relative">
                {/* Map container - isolated from React's direct manipulation */}
                <div ref={mapRef} style={{ height: '100%', width: '100%' }} className="rounded-lg" />
                {!isMapReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                        <div className="text-gray-500">Loading map...</div>
                    </div>
                )}
            </div>
            {isMapReady && coordinates.length === 0 && (
                <p className="text-center text-gray-500 mt-2">No route coordinates available</p>
            )}
        </div>
    );
}