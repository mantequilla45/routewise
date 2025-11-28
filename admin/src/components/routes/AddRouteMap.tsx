'use client';

import { useEffect, useRef, useState } from 'react';
import { googleMapsLoader } from '@/lib/maps/googleMapsLoader';
import type { GoogleMapClickEvent, MapMarker, MapPolyline } from '@/types/google-maps';

// Helper function to calculate distance from a point to a line segment
function distanceToSegment(
    point: { lat: number; lng: number },
    segmentStart: { lat: number; lng: number },
    segmentEnd: { lat: number; lng: number }
): number {
    const x = point.lng;
    const y = point.lat;
    const x1 = segmentStart.lng;
    const y1 = segmentStart.lat;
    const x2 = segmentEnd.lng;
    const y2 = segmentEnd.lat;
    
    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    
    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    let param = -1;
    
    if (len_sq !== 0) {
        param = dot / len_sq;
    }
    
    let xx, yy;
    
    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }
    
    const dx = x - xx;
    const dy = y - yy;
    
    return Math.sqrt(dx * dx + dy * dy);
}

interface AddRouteMapProps {
    coordinates: [number, number][];
    onMapClick?: (lat: number, lng: number) => void;
    height?: string;
    enableClickToAdd?: boolean;
    highlightedIndex?: number | null;
    onPointClick?: (index: number) => void;
    onSegmentClick?: (afterIndex: number, lat: number, lng: number) => void;
}

export default function AddRouteMap({ 
    coordinates, 
    onMapClick,
    height = '500px',
    enableClickToAdd = false,
    highlightedIndex = null,
    onPointClick,
    onSegmentClick
}: AddRouteMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<google.maps.Map | null>(null);
    const markersRef = useRef<MapMarker[]>([]);
    const polylineRef = useRef<MapPolyline | null>(null);
    const [isMapReady, setIsMapReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const previousCoordinatesLength = useRef(0);
    const lastInsertedIndex = useRef<number | null>(null);

    useEffect(() => {
        let mounted = true;
        let clickListener: google.maps.MapsEventListener | null = null;

        const initMap = async () => {
            try {
                await googleMapsLoader.load();
                
                if (!mounted || !mapRef.current) return;
                
                if (!mapInstanceRef.current && window.google?.maps) {
                    console.log('Creating map instance for AddRouteMap');
                    const mapDiv = mapRef.current;
                    
                    // Create map with a defensive check
                    const map = new window.google.maps.Map(mapDiv, {
                        center: { lat: 10.3157, lng: 123.8854 }, // Cebu City
                        zoom: 13,
                        mapTypeControl: true,
                        streetViewControl: false,
                    });
                    
                    mapInstanceRef.current = map;
                    setIsMapReady(true);
                    
                    // Add click listener if enabled
                    if (enableClickToAdd && onMapClick) {
                        clickListener = map.addListener('click', (e: GoogleMapClickEvent) => {
                            if (e.latLng) {
                                const lat = e.latLng.lat();
                                const lng = e.latLng.lng();
                                console.log('Map clicked:', lat, lng);
                                onMapClick(lat, lng);
                            }
                        });
                        console.log('Click to add enabled');
                    }
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
            
            // Clean up click listener
            if (clickListener && window.google?.maps?.event) {
                window.google.maps.event.removeListener(clickListener);
            }
            
            // Clean up markers
            if (markersRef.current) {
                markersRef.current.forEach(marker => {
                    if (marker && marker.setMap) {
                        marker.setMap(null);
                    }
                });
                markersRef.current = [];
            }
            
            // Clean up polyline
            if (polylineRef.current) {
                polylineRef.current.setMap(null);
                polylineRef.current = null;
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Handle click listener updates separately
    useEffect(() => {
        if (!mapInstanceRef.current || !isMapReady) return;
        
        let clickListener: google.maps.MapsEventListener | null = null;
        
        if (enableClickToAdd && onMapClick) {
            clickListener = mapInstanceRef.current.addListener('click', (e: GoogleMapClickEvent) => {
                if (e.latLng) {
                    const lat = e.latLng.lat();
                    const lng = e.latLng.lng();
                    onMapClick(lat, lng);
                }
            });
        }
        
        return () => {
            if (clickListener && window.google?.maps?.event) {
                window.google.maps.event.removeListener(clickListener);
            }
        };
    }, [enableClickToAdd, onMapClick, isMapReady]);

    // Update map when coordinates change
    useEffect(() => {
        if (!mapInstanceRef.current || !isMapReady || !window.google?.maps) return;

        const map = mapInstanceRef.current;
        
        // Clear existing markers safely
        if (markersRef.current && markersRef.current.length > 0) {
            markersRef.current.forEach(marker => {
                try {
                    if (marker && marker.setMap) {
                        marker.setMap(null);
                    }
                } catch (e) {
                    console.warn('Error clearing marker:', e);
                }
            });
            markersRef.current = [];
        }
        
        // Clear polyline safely
        if (polylineRef.current) {
            try {
                polylineRef.current.setMap(null);
            } catch (e) {
                console.warn('Error clearing polyline:', e);
            }
            polylineRef.current = null;
        }

        // Draw new route if coordinates exist
        if (coordinates && coordinates.length > 0) {
            console.log('Drawing route with', coordinates.length, 'points');
            
            // Convert coordinates to Google Maps format
            const path = coordinates.map(coord => ({
                lat: coord[1],
                lng: coord[0]
            }));
            
            // Draw polyline with click handling for inserting points
            polylineRef.current = new window.google.maps.Polyline({
                path: path,
                geodesic: true,
                strokeColor: '#FF6B6B',
                strokeOpacity: 1.0,
                strokeWeight: 4,
                map: map,
                clickable: enableClickToAdd // Only clickable when editing is enabled
            });
            
            // Add click listener to polyline for inserting points
            if (enableClickToAdd && onSegmentClick && polylineRef.current) {
                polylineRef.current.addListener('click', (e: GoogleMapClickEvent) => {
                    if (e.latLng) {
                        const clickedLat = e.latLng.lat();
                        const clickedLng = e.latLng.lng();
                        
                        // Find which segment was clicked by finding the closest segment
                        let minDistance = Infinity;
                        let insertAfterIndex = 0;
                        
                        for (let i = 0; i < path.length - 1; i++) {
                            const segmentStart = path[i];
                            const segmentEnd = path[i + 1];
                            
                            // Calculate distance from click point to this segment
                            const distance = distanceToSegment(
                                { lat: clickedLat, lng: clickedLng },
                                segmentStart,
                                segmentEnd
                            );
                            
                            if (distance < minDistance) {
                                minDistance = distance;
                                insertAfterIndex = i;
                            }
                        }
                        
                        // Track where we're inserting
                        lastInsertedIndex.current = insertAfterIndex + 1;
                        
                        // Call the segment click handler with the index and coordinates
                        onSegmentClick(insertAfterIndex, clickedLat, clickedLng);
                    }
                });
            }
            
            // Add markers
            if (path.length > 0) {
                // Create markers for all points
                path.forEach((point, index) => {
                    let icon;
                    let zIndex = 100;
                    
                    // Determine icon based on position and highlight status
                    if (index === highlightedIndex) {
                        // Highlighted point - make it stand out
                        icon = {
                            path: window.google.maps.SymbolPath.CIRCLE,
                            scale: 10,
                            fillColor: '#FFD700',
                            fillOpacity: 1,
                            strokeColor: '#FF6B6B',
                            strokeWeight: 3
                        };
                        zIndex = 200; // Bring to front
                    } else if (index === 0) {
                        // Start marker
                        icon = {
                            url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
                            scaledSize: new window.google.maps.Size(32, 32)
                        };
                    } else if (index === path.length - 1) {
                        // End marker
                        icon = {
                            url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
                            scaledSize: new window.google.maps.Size(32, 32)
                        };
                    } else {
                        // Intermediate points
                        icon = {
                            path: window.google.maps.SymbolPath.CIRCLE,
                            scale: 6,
                            fillColor: '#4285F4',
                            fillOpacity: 1,
                            strokeColor: 'white',
                            strokeWeight: 2
                        };
                    }
                    
                    const marker = new window.google.maps.Marker({
                        position: point,
                        map: map,
                        title: `Point ${index + 1}`,
                        icon: icon,
                        zIndex: zIndex,
                        cursor: enableClickToAdd ? 'pointer' : 'default'
                    });
                    
                    // Add click listener to markers if editing is enabled
                    if (enableClickToAdd && onPointClick) {
                        marker.addListener('click', () => {
                            onPointClick(index);
                        });
                    }
                    
                    markersRef.current.push(marker);
                });
                
                // Center map based on context
                if (highlightedIndex !== null && path[highlightedIndex]) {
                    // Pan to highlighted point when selecting for edit
                    map.panTo(path[highlightedIndex]);
                } else if (lastInsertedIndex.current !== null && path[lastInsertedIndex.current]) {
                    // Pan to the inserted point, not the last point
                    map.panTo(path[lastInsertedIndex.current]);
                    // Clear the inserted index after panning
                    lastInsertedIndex.current = null;
                } else if (enableClickToAdd && coordinates.length > previousCoordinatesLength.current && lastInsertedIndex.current === null) {
                    // Only pan to last point if we just ADDED a new point at the end (not inserted)
                    map.panTo(path[path.length - 1]);
                } else if (!enableClickToAdd && path.length > 1) {
                    // When just viewing (not editing), fit bounds
                    const bounds = new window.google.maps.LatLngBounds();
                    path.forEach(point => bounds.extend(point));
                    map.fitBounds(bounds);
                } else if (path.length === 1) {
                    // Single point - center on it
                    map.setCenter(path[0]);
                    map.setZoom(15);
                }
                
                // Update the previous length for next render
                previousCoordinatesLength.current = coordinates.length;
            }
        }
    }, [coordinates, isMapReady, highlightedIndex, enableClickToAdd, onPointClick, onSegmentClick]);

    if (error) {
        return (
            <div style={{ height, width: '100%' }} className="rounded-lg bg-red-50 flex items-center justify-center">
                <div className="text-red-600">{error}</div>
            </div>
        );
    }

    return (
        <div className="relative">
            <div style={{ height, width: '100%' }} className="rounded-lg bg-gray-100">
                {/* Map container - isolated from React's direct manipulation */}
                <div ref={mapRef} style={{ height: '100%', width: '100%' }} className="rounded-lg" />
                {!isMapReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                        <div className="text-gray-500">Loading map...</div>
                    </div>
                )}
            </div>
            {enableClickToAdd && isMapReady && (
                <div className="absolute top-2 left-2 bg-white px-3 py-1 rounded-md shadow-md text-sm">
                    Click on map to add points
                </div>
            )}
        </div>
    );
}