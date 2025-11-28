export interface GoogleMapClickEvent {
    latLng: google.maps.LatLng;
}

export interface MapMarker extends google.maps.Marker {
    setMap(map: google.maps.Map | null): void;
}

export interface MapPolyline extends google.maps.Polyline {
    setMap(map: google.maps.Map | null): void;
    addListener(eventName: string, handler: (e: GoogleMapClickEvent) => void): google.maps.MapsEventListener;
}