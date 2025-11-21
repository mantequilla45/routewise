import { LatLng, MappedGeoRouteResult } from "@/types/GeoTypes";

// Won't work. Geocoding API restricted to mobile

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

export async function geocodeRoutes(routes: MappedGeoRouteResult[]): Promise<MappedGeoRouteResult[]> {

    console.log(process.env.GOOGLE_MAPS_KEY);
    for (const route of routes) {
        if (route.latLng && route.latLng.length > 0) {
            try {
                // First point → startingPoint
                route.startingPoint = await geocodeRoute(route.latLng[0]);
                // Last point → endPoint
                route.endPoint = await geocodeRoute(route.latLng.at(-1)!);
            } catch (err) {
                console.error(`Failed to geocode route ${route.routeId}:`, err);
                route.startingPoint = route.startingPoint ?? "Unknown";
                route.endPoint = route.endPoint ?? "Unknown";
            }
        }
    }
    return routes;
}