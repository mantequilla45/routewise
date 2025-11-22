import { LatLng, MappedGeoRouteResult } from "@/types/GeoTypes";

export async function geocodeRoute(latLng: LatLng): Promise<string> {
    const apiKey = process.env.GOOGLE_MAPS_KEY;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latLng.latitude},${latLng.longitude}&key=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === "OK" && data.results.length > 0) {
        return data.results[0].formatted_address;
    } else {
        throw new Error(`geocode failed: ${data.status}`);
    }
}

export async function getPlaceName(latLng: LatLng): Promise<string> {
    const apiKey = process.env.GOOGLE_MAPS_KEY;
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latLng.latitude},${latLng.longitude}&radius=50&key=${apiKey}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.status === "OK" && data.results.length > 0) {
            return data.results[0].name;
        } else {
            throw new Error(`places search failed: ${data.status}`);
        }
    } catch (err) {
        console.warn(`Places API failed, falling back to Geocoding:`, err);
        return geocodeRoute(latLng); // fallback
    }
}

export async function getPlaceNamesForRoutes(routes: MappedGeoRouteResult[]): Promise<MappedGeoRouteResult[]> {
    for (const route of routes) {
        if (route.latLng && route.latLng.length > 0) {
            try {
                route.startingPoint = await getPlaceName(route.latLng[0]);
                route.endPoint = await getPlaceName(route.latLng.at(-1)!);
            } catch (err) {
                console.error(`Failed to get place for route ${route.routeId}:`, err);
                route.startingPoint = route.startingPoint ?? "Unknown";
                route.endPoint = route.endPoint ?? "Unknown";
            }
        }
    }
    return routes;
}
