'use client';

import { useEffect, useRef, useState } from 'react';
import { googleMapsLoader } from '@/lib/maps/googleMapsLoader';
import { findClosestSegmentIndex, isClosedLoopPath } from '@/lib/maps/geometry';
import { getMapStyles } from '@/lib/maps/mapStyles';
import type { GoogleMapClickEvent, MapMarker, MapPolyline } from '@/types/google-maps';
import { normalizeCoordinates } from './add-map/normalizeCoordinates';
import { buildMarkerOptions } from './add-map/markerOptions';
import { clearMarkers, clearPolyline, createRoutePolyline } from './add-map/routeOverlays';

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
  hidePOIs = false,
}: AddRouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<MapMarker[]>([]);
  const polylineRef = useRef<MapPolyline | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previousCoordinatesLength = useRef(0);
  const lastInsertedIndex = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;

    const initMap = async () => {
      try {
        await googleMapsLoader.load();

        if (!mounted || !mapRef.current) return;

        if (!mapInstanceRef.current && window.google?.maps) {
          const map = new window.google.maps.Map(mapRef.current, {
            center: { lat: 10.3157, lng: 123.8854 }, // Cebu City
            zoom: 13,
            mapTypeControl: true,
            streetViewControl: false,
            styles: getMapStyles(hidePOIs),
          });

          mapInstanceRef.current = map;
          setIsMapReady(true);

          // Click listener is added in the separate useEffect below
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

      if (markersRef.current) {
        markersRef.current.forEach((marker) => {
          if (marker && marker.setMap) {
            marker.setMap(null);
          }
        });
        markersRef.current = [];
      }

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

    // Close and clear info window when re-rendering markers
    if (infoWindowRef.current) {
      infoWindowRef.current.close();
    }

    clearMarkers(markersRef);
    clearPolyline(polylineRef);

    if (!coordinates || coordinates.length === 0) return;

    const path = normalizeCoordinates(coordinates);

    if (path.length === 0) {
      console.error('No valid coordinates to display');
      return;
    }

    const isClosedLoop = isClosedLoopPath(path);

    polylineRef.current = createRoutePolyline(map, path, enableClickToAdd);

    // Clicking the polyline inserts a point into the closest segment
    if (enableClickToAdd && onSegmentClick && polylineRef.current) {
      polylineRef.current.addListener('click', (e: GoogleMapClickEvent) => {
        if (e.latLng) {
          const clickedLat = e.latLng.lat();
          const clickedLng = e.latLng.lng();

          const insertAfterIndex = findClosestSegmentIndex(path, {
            lat: clickedLat,
            lng: clickedLng,
          });

          // Track where we're inserting
          lastInsertedIndex.current = insertAfterIndex + 1;

          onSegmentClick(insertAfterIndex, clickedLat, clickedLng);
        }
      });
    }

    path.forEach((point, index) => {
      const marker = new window.google.maps.Marker(
        buildMarkerOptions(index, map, {
          path,
          isClosedLoop,
          highlightedIndex,
          showPointNumbers,
          enableClickToAdd,
        }),
      );

      if (enableClickToAdd && onPointClick) {
        marker.addListener('click', () => {
          onPointClick(index);
        });
      }

      // Auto-open info window on the selected marker
      if (index === highlightedIndex && enableClickToAdd) {
        if (!infoWindowRef.current) {
          infoWindowRef.current = new window.google.maps.InfoWindow();
        }
        const iw = infoWindowRef.current;
        iw.setContent(
          `<style>.gm-ui-hover-effect{display:none!important}</style><div style="font-size:12px;color:#1a1a1a;padding:2px 4px;font-weight:500">Point ${index + 1} — Click map to move</div>`,
        );
        iw.open(mapInstanceRef.current, marker);
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
      lastInsertedIndex.current = null;
    } else if (
      enableClickToAdd &&
      coordinates.length > previousCoordinatesLength.current &&
      lastInsertedIndex.current === null
    ) {
      // Only pan to last point if we just ADDED a new point at the end (not inserted)
      map.panTo(path[path.length - 1]);
    } else if (!enableClickToAdd && path.length > 1) {
      // When just viewing (not editing), fit bounds
      const bounds = new window.google.maps.LatLngBounds();
      path.forEach((point) => bounds.extend(point));
      map.fitBounds(bounds);
    } else if (path.length === 1) {
      map.setCenter(path[0]);
      map.setZoom(15);
    }

    previousCoordinatesLength.current = coordinates.length;
  }, [
    coordinates,
    isMapReady,
    highlightedIndex,
    enableClickToAdd,
    onPointClick,
    onSegmentClick,
    showPointNumbers,
  ]);

  // Update map styles when POI visibility changes
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady || !window.google?.maps) return;

    mapInstanceRef.current.setOptions({ styles: getMapStyles(hidePOIs) });
  }, [hidePOIs, isMapReady]);

  if (error) {
    return (
      <div
        style={{ height, width: '100%' }}
        className="rounded-lg bg-red-50 flex items-center justify-center"
      >
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
