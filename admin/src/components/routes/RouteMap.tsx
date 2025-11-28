'use client';

import { useEffect, useRef, useState } from 'react';

interface RouteMapProps {
    coordinates: [number, number][];
    onMapClick?: (lat: number, lng: number) => void;
    height?: string;
    enableClickToAdd?: boolean;
}

// Google types are already declared in googleMapsLoader.ts

let mapLoadPromise: Promise<void> | null = null;

function loadGoogleMapsScript(): Promise<void> {
    if (mapLoadPromise) return mapLoadPromise;
    
    mapLoadPromise = new Promise((resolve, reject) => {
        // Check if Google Maps is already loaded
        if (window.google?.maps) {
            console.log('Google Maps already loaded');
            resolve();
            return;
        }

        // Check if script is already in the DOM
        const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
        if (existingScript) {
            console.log('Google Maps script already in DOM, waiting for load...');
            existingScript.addEventListener('load', () => resolve());
            
            // Check again if it loaded while we were checking
            if (window.google?.maps) {
                resolve();
            }
            return;
        }

        // Use the API key directly since process.env doesn't work in client-side code
        const apiKey = 'AIzaSyDNtgUhuvViM6MQUzbr34ytetMlYfXrDaI';
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap`;
        script.async = true;
        script.defer = true;
        
        // Create global callback
        (window as Window & { initMap?: () => void }).initMap = () => {
            console.log('Google Maps initialized via callback');
            resolve();
            delete (window as Window & { initMap?: () => void }).initMap;
        };
        
        script.onerror = (error) => {
            console.error('Failed to load Google Maps script:', error);
            reject(new Error('Failed to load Google Maps'));
        };
        
        document.head.appendChild(script);
        console.log('Google Maps script added to DOM');
    });
    
    return mapLoadPromise;
}

export default function RouteMap({ 
    coordinates, 
    onMapClick, 
    height = '400px',
    enableClickToAdd = false 
}: RouteMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [polyline, setPolyline] = useState<google.maps.Polyline | null>(null);
    const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const initMap = async () => {
            try {
                console.log('Initializing map...');
                await loadGoogleMapsScript();
                
                if (mapRef.current && !map && window.google?.maps) {
                    console.log('Creating new map instance');
                    const newMap = new window.google.maps.Map(mapRef.current, {
                        center: { lat: 10.3157, lng: 123.8854 }, // Cebu City
                        zoom: 13,
                        mapTypeControl: true,
                        streetViewControl: false,
                    });
                    
                    setMap(newMap);
                    setIsLoading(false);
                    console.log('Map created successfully');

                    if (enableClickToAdd && onMapClick) {
                        newMap.addListener('click', (e: google.maps.MapMouseEvent) => {
                            if (e.latLng) {
                                onMapClick(e.latLng.lat(), e.latLng.lng());
                            }
                        });
                    }
                } else {
                    console.log('Map conditions not met:', {
                        hasRef: !!mapRef.current,
                        hasExistingMap: !!map,
                        hasGoogleMaps: !!window.google?.maps
                    });
                }
            } catch (err) {
                console.error('Error loading Google Maps:', err);
                setError('Failed to load Google Maps. Check console for details.');
                setIsLoading(false);
            }
        };

        if (!map) {
            initMap();
        }
    }, [map, enableClickToAdd, onMapClick]);

    useEffect(() => {
        if (!map || !window.google) return;

        // Clear existing polyline and markers
        if (polyline) {
            polyline.setMap(null);
        }
        markers.forEach(marker => marker.setMap(null));

        if (coordinates.length > 0) {
            // Create path from coordinates
            const path = coordinates.map(coord => ({
                lat: coord[1],
                lng: coord[0]
            }));

            // Draw polyline
            const newPolyline = new window.google.maps.Polyline({
                path,
                geodesic: true,
                strokeColor: '#FF6B6B',
                strokeOpacity: 1.0,
                strokeWeight: 3,
                map
            });
            setPolyline(newPolyline);

            // Add markers for start and end
            const newMarkers: google.maps.Marker[] = [];
            
            if (path.length > 0) {
                // Start marker
                newMarkers.push(new window.google.maps.Marker({
                    position: path[0],
                    map,
                    title: 'Start',
                    icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
                }));

                // End marker
                if (path.length > 1) {
                    newMarkers.push(new window.google.maps.Marker({
                        position: path[path.length - 1],
                        map,
                        title: 'End',
                        icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
                    }));
                }

                // Intermediate points
                for (let i = 1; i < path.length - 1; i++) {
                    newMarkers.push(new window.google.maps.Marker({
                        position: path[i],
                        map,
                        title: `Point ${i}`,
                        icon: {
                            path: window.google.maps.SymbolPath.CIRCLE,
                            scale: 6,
                            fillColor: '#4285F4',
                            fillOpacity: 1,
                            strokeColor: 'white',
                            strokeWeight: 2
                        }
                    }));
                }
            }
            
            setMarkers(newMarkers);

            // Fit bounds to show all coordinates
            if (path.length > 0) {
                const bounds = new window.google.maps.LatLngBounds();
                path.forEach(point => bounds.extend(point));
                map.fitBounds(bounds);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [coordinates, map]);

    if (error) {
        return (
            <div style={{ height, width: '100%' }} className="bg-red-50 rounded-lg flex items-center justify-center">
                <div className="text-red-500">{error}</div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div style={{ height, width: '100%' }} className="bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
                <div className="text-gray-500">Loading map...</div>
            </div>
        );
    }

    return (
        <div className="relative">
            <div ref={mapRef} style={{ height, width: '100%' }} className="rounded-lg" />
            {enableClickToAdd && (
                <div className="absolute top-2 left-2 bg-white px-3 py-1 rounded-md shadow-md text-sm">
                    Click on map to add points
                </div>
            )}
        </div>
    );
}