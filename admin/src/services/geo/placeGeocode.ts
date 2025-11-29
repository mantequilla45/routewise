import { LatLng, MappedGeoRouteResult } from "@/types/GeoTypes";

export async function geocodeRoute(latLng: LatLng): Promise<string> {
    try {
        const apiKey = process.env.NEXT_PUBLIC_GMAPS_API;
        if (!apiKey) {
            console.warn('Google Maps API key not found');
            return 'Location';
        }
        
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latLng.latitude},${latLng.longitude}&key=${apiKey}`;

        const response = await fetch(url);
        if (!response.ok) {
            console.warn(`Geocoding HTTP error: ${response.status}`);
            return 'Location';
        }

        const data = await response.json();

        if (data.status === "OK" && data.results.length > 0) {
            // Get a short, relevant address
            const result = data.results[0];
            // Try to get neighborhood or locality for cleaner display
            const component = result.address_components?.find(
                (c: { types: string[]; long_name: string }) => c.types.includes('neighborhood') || 
                           c.types.includes('locality') || 
                           c.types.includes('sublocality')
            );
            return component?.long_name || result.formatted_address.split(',')[0] || 'Location';
        } else if (data.status === "ZERO_RESULTS") {
            return 'Unknown Location';
        } else {
            console.warn(`Geocoding status: ${data.status}`);
            return 'Location';
        }
    } catch (err) {
        console.warn('Geocoding error:', err);
        return 'Location';
    }
}

export async function getPlaceName(latLng: LatLng): Promise<string> {
    // Skip Places API and go directly to geocoding
    // Places API requires additional billing and often fails
    return geocodeRoute(latLng);
}

export async function getPlaceNamesForRoutes(routes: MappedGeoRouteResult[]): Promise<MappedGeoRouteResult[]> {
    for (const route of routes) {
        if (route.latLng && route.latLng.length > 0) {
            try {
                route.startingPoint = await getPlaceName(route.latLng[0]);
                route.endPoint = await getPlaceName(route.latLng.at(-1)!);
            } catch {
                console.warn(`Using fallback names for route ${route.routeId}`);
                route.startingPoint = route.startingPoint ?? "Start Location";
                route.endPoint = route.endPoint ?? "End Location";
            }
        } else {
            // If no coordinates, use generic names
            route.startingPoint = "Start Location";
            route.endPoint = "End Location";
        }
    }
    return routes;
}
