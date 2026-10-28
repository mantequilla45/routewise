import type { MutableRefObject } from 'react';
import type { LatLng } from '@/lib/maps/geometry';
import type { MapMarker, MapPolyline } from '@/types/google-maps';

export function clearMarkers(markersRef: MutableRefObject<MapMarker[]>): void {
  if (markersRef.current && markersRef.current.length > 0) {
    markersRef.current.forEach((marker) => {
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
}

export function clearPolyline(polylineRef: MutableRefObject<MapPolyline | null>): void {
  if (polylineRef.current) {
    try {
      polylineRef.current.setMap(null);
    } catch (e) {
      console.warn('Error clearing polyline:', e);
    }
    polylineRef.current = null;
  }
}

// Draws the route as a red polyline with direction arrows.
export function createRoutePolyline(
  map: google.maps.Map,
  path: LatLng[],
  clickable: boolean,
): google.maps.Polyline {
  return new window.google.maps.Polyline({
    path: [...path],
    geodesic: true,
    strokeColor: '#FF6B6B',
    strokeOpacity: 1.0,
    strokeWeight: 4,
    map: map,
    clickable, // Only clickable when editing is enabled
    icons: [
      {
        icon: {
          path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 3,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
          fillColor: '#FF6B6B',
          fillOpacity: 1,
        },
        offset: '50%',
        repeat: '150px', // Show arrows every 150 pixels
      },
    ],
  });
}
