import { MappedGeoRouteResult } from "@/types/GeoTypes";

export function calculateFare(distanceMeters: number) {
    const baseFare = 13;
    const increment = 1.8;
    const incrementTriggerKm = 3;

    const distanceKm = distanceMeters / 1000;
    const extraKm = Math.max(0, Math.floor(distanceKm - incrementTriggerKm));

    return baseFare + extraKm * increment;
}

export function calculateFareForRoutes(routes: MappedGeoRouteResult[]): MappedGeoRouteResult[] {
    for (const route of routes) {
        const distance = route.distanceMeters ?? 0;
        route.fare = calculateFare(distance);
    }
    return routes;
}

