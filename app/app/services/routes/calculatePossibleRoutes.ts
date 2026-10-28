import { LatLng, MappedGeoRouteResult } from "@/types/GeoTypes";
import { api, ApiError } from "@/lib/api";
import { adjustToNearestRoad } from "../maps/roadAdjustment";

export default async function calculatePossibleRoutes(
    from: LatLng | null,
    to: LatLng | null
): Promise<MappedGeoRouteResult[] | { error: string; warning?: string }> {

    if (!from || !to) {
        return [];
    }

    try {
        // Try to snap to road, but fall back to original points if it fails
        let adjustedFrom = from;
        let adjustedTo = to;

        try {
            const [snappedFrom, snappedTo] = await Promise.all([
                adjustToNearestRoad(from).catch(() => from),
                adjustToNearestRoad(to).catch(() => to)
            ]);
            adjustedFrom = snappedFrom;
            adjustedTo = snappedTo;
        } catch (snapError) {
            // Use original points on snap error
        }

        console.log('🧭 ROUTE CALCULATION');
        console.log('📍 From:', adjustedFrom);
        console.log('📍 To:', adjustedTo);

        const data = await api.routes.calculate(adjustedFrom, adjustedTo);
        console.log('✅ Routes:', data);
        return data as MappedGeoRouteResult[];

    } catch (error) {
        if (error instanceof ApiError) {
            console.log('❌ Route error:', error.body);
            return {
                error: error.body.error || "No route handler available",
                warning: error.body.debugInfo ? JSON.stringify(error.body.debugInfo) : undefined
            };
        }
        console.error('🔴 Route calculation failed:', error);
        return {
            error: 'Failed to calculate routes',
            warning: 'Route calculation error occurred'
        };
    }
}
