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
    showPointNumbers?: boolean;
    hidePOIs?: boolean;
}

export default function AddRouteMap({ 
    coordinates, 
    onMapClick,
    height = '500px',
    enableClickToAdd = false,
    highlightedIndex = null,
    onPointClick,
    onSegmentClick,
    showPointNumbers = true,
    hidePOIs = false
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
                    const mapStyles = hidePOIs ? [
                        {
                            featureType: "poi",
                            elementType: "labels",
                            stylers: [{ visibility: "off" }]
                        },
                        {
                            featureType: "poi.business",
                            stylers: [{ visibility: "off" }]
                        },
                        {
                            featureType: "transit",
                            elementType: "labels",
                            stylers: [{ visibility: "off" }]
                        }
                    ] : [];
                    
                    const map = new window.google.maps.Map(mapDiv, {
                        center: { lat: 10.3157, lng: 123.8854 }, // Cebu City
                        zoom: 13,
                        mapTypeControl: true,
                        streetViewControl: false,
                        styles: mapStyles
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
            console.log('Raw coordinates:', coordinates);
            
            // Convert coordinates to Google Maps format with validation
            const path = coordinates
                .filter(coord => {
                    // Validate coordinates - handle both array and object formats
                    if (!coord) {
                        console.warn('Invalid coordinate: null or undefined');
                        return false;
                    }
                    
                    // Check if it's an object with lat/lng properties
                    if (typeof coord === 'object' && coord && 'lat' in coord && 'lng' in coord) {
                        const latLngCoord = coord as { lat: number; lng: number };
                        if (!isFinite(latLngCoord.lat) || !isFinite(latLngCoord.lng)) {
                            console.warn('Non-finite coordinate values:', coord);
                            return false;
                        }
                        return true;
                    }
                    
                    // Check if it's an array [lng, lat]
                    if (Array.isArray(coord) && coord.length === 2) {
                        const [lng, lat] = coord;
                        if (!isFinite(lat) || !isFinite(lng)) {
                            console.warn('Non-finite coordinate values:', coord);
                            return false;
                        }
                        return true;
                    }
                    
                    console.warn('Invalid coordinate format:', coord);
                    return false;
                })
                .map(coord => {
                    // Convert to Google Maps format
                    if (typeof coord === 'object' && coord && 'lat' in coord && 'lng' in coord) {
                        const latLngCoord = coord as { lat: number; lng: number };
                        return { lat: latLngCoord.lat, lng: latLngCoord.lng };
                    } else if (Array.isArray(coord)) {
                        return { lat: coord[1], lng: coord[0] };
                    }
                    return null;
                })
                .filter(coord => coord !== null);
            
            if (path.length === 0) {
                console.error('No valid coordinates to display');
                return;
            }
            
            // Check if this is a closed loop (first and last points are the same)
            const isClosedLoop = path.length > 2 && 
                path[0].lat === path[path.length - 1].lat && 
                path[0].lng === path[path.length - 1].lng;
            
            const routePath = [...path];
            
            // Draw polyline with click handling for inserting points
            polylineRef.current = new window.google.maps.Polyline({
                path: routePath,
                geodesic: true,
                strokeColor: '#FF6B6B',
                strokeOpacity: 1.0,
                strokeWeight: 4,
                map: map,
                clickable: enableClickToAdd, // Only clickable when editing is enabled
                icons: [{
                    icon: {
                        path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                        scale: 3,
                        strokeColor: '#FFFFFF',
                        strokeWeight: 2,
                        fillColor: '#FF6B6B',
                        fillOpacity: 1
                    },
                    offset: '50%',
                    repeat: '150px' // Show arrows every 150 pixels
                }]
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
                        
                        // Check all segments (not including a closing segment since routes aren't loops)
                        const segmentsToCheck = path.length - 1;
                        
                        for (let i = 0; i < segmentsToCheck; i++) {
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
                console.log('Creating markers for', path.length, 'points');
                console.log('Highlighted index:', highlightedIndex);
                
                // Create markers for all points
                path.forEach((point, index) => {
                    const markerOptions: google.maps.MarkerOptions = {
                        position: point,
                        map: map,
                        cursor: enableClickToAdd ? 'pointer' : 'default',
                        title: '',
                        zIndex: 100
                    };
                    
                    // Determine icon and label based on position and highlight status
                    if (index === 0 && !isClosedLoop) {
                        // First point - Starting point with X icon (only if not a closed loop)
                        console.log(`Marker ${index}: START (first point)`);
                        markerOptions.icon = {
                            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                                <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="12" cy="12" r="10" fill="#10B981" stroke="white" stroke-width="2"/>
                                    <path d="M8 8 L16 16 M16 8 L8 16" stroke="white" stroke-width="2" stroke-linecap="round"/>
                                </svg>
                            `),
                            scaledSize: new window.google.maps.Size(24, 24),
                            anchor: new window.google.maps.Point(12, 12)
                        };
                        markerOptions.title = 'Starting Point';
                        markerOptions.zIndex = 200;
                    } else if (index === path.length - 1 && path.length > 1 && !isClosedLoop) {
                        // Last point - End point with circle icon
                        console.log(`Marker ${index}: END (last point of ${path.length} total)`);
                        markerOptions.icon = {
                            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                                <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="12" cy="12" r="10" fill="#EF4444" stroke="white" stroke-width="2"/>
                                    <circle cx="12" cy="12" r="5" fill="white"/>
                                </svg>
                            `),
                            scaledSize: new window.google.maps.Size(24, 24),
                            anchor: new window.google.maps.Point(12, 12)
                        };
                        markerOptions.title = 'End Point';
                        markerOptions.zIndex = 200;
                    } else if (isClosedLoop && index === path.length - 1) {
                        // Loop closing point - show as Point 1 (same as first point)
                        console.log(`Marker ${index}: LOOP CLOSE (same as Point 1)`);
                        if (showPointNumbers) {
                            markerOptions.icon = {
                                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                                    <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="14" cy="14" r="11" fill="#3B82F6" stroke="white" stroke-width="2"/>
                                        <text x="14" y="18" font-family="Arial" font-size="11" font-weight="bold" fill="white" text-anchor="middle">1</text>
                                    </svg>
                                `),
                                scaledSize: new window.google.maps.Size(28, 28),
                                anchor: new window.google.maps.Point(14, 14)
                            };
                        } else {
                            markerOptions.icon = {
                                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                                    <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="10" cy="10" r="8" fill="#3B82F6" stroke="white" stroke-width="2"/>
                                    </svg>
                                `),
                                scaledSize: new window.google.maps.Size(20, 20),
                                anchor: new window.google.maps.Point(10, 10)
                            };
                        }
                        markerOptions.title = 'Point 1 (Loop Close)';
                        markerOptions.zIndex = 100;
                    } else if (index === highlightedIndex) {
                        // Highlighted middle point
                        markerOptions.icon = {
                            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                                <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="20" cy="20" r="16" fill="#FFD700" stroke="#FF6B6B" stroke-width="3"/>
                                    <text x="20" y="26" font-family="Arial" font-size="14" font-weight="bold" fill="black" text-anchor="middle">${index + 1}</text>
                                </svg>
                            `),
                            scaledSize: new window.google.maps.Size(40, 40),
                            anchor: new window.google.maps.Point(20, 20)
                        };
                        markerOptions.title = `Point ${index + 1} (Selected)`;
                        markerOptions.zIndex = 250;
                    } else {
                        // Regular middle points - with or without numbers
                        console.log(`Marker ${index}: Middle point (${index + 1}/${path.length})`);
                        if (showPointNumbers) {
                            markerOptions.icon = {
                                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                                    <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="14" cy="14" r="11" fill="#3B82F6" stroke="white" stroke-width="2"/>
                                        <text x="14" y="18" font-family="Arial" font-size="11" font-weight="bold" fill="white" text-anchor="middle">${index + 1}</text>
                                    </svg>
                                `),
                                scaledSize: new window.google.maps.Size(28, 28),
                                anchor: new window.google.maps.Point(14, 14)
                            };
                        } else {
                            markerOptions.icon = {
                                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                                    <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="10" cy="10" r="8" fill="#3B82F6" stroke="white" stroke-width="2"/>
                                    </svg>
                                `),
                                scaledSize: new window.google.maps.Size(20, 20),
                                anchor: new window.google.maps.Point(10, 10)
                            };
                        }
                        markerOptions.title = `Point ${index + 1}`;
                        markerOptions.zIndex = 100;
                    }
                    
                    const marker = new window.google.maps.Marker(markerOptions);
                    
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
    }, [coordinates, isMapReady, highlightedIndex, enableClickToAdd, onPointClick, onSegmentClick, showPointNumbers]);
    
    // Update map styles when POI visibility changes
    useEffect(() => {
        if (!mapInstanceRef.current || !isMapReady || !window.google?.maps) return;
        
        const mapStyles = hidePOIs ? [
            {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }]
            },
            {
                featureType: "poi.business",
                stylers: [{ visibility: "off" }]
            },
            {
                featureType: "transit",
                elementType: "labels",
                stylers: [{ visibility: "off" }]
            }
        ] : [];
        
        mapInstanceRef.current.setOptions({ styles: mapStyles });
    }, [hidePOIs, isMapReady]);

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
        </div>
    );
}