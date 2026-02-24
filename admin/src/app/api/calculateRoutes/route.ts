import { calculateFareForRoutes } from "@/lib/fare/fareCalculation";
import { getPlaceNamesForRoutes } from "@/services/geo/placeGeocode";
import { calculateRoute } from "@/services/geo/routeDistanceCalculation";
import { LatLng } from "@/types/GeoTypes";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const from: LatLng | undefined = body.from;
        const to: LatLng | undefined = body.to;

        if (!from || !to) {
            return NextResponse.json({ error: "Both 'from' and 'to' coordinates are required" }, { status: 400 });
        }
        const routeResult = await calculateRoute(from, to);
        
        // Check if we got results or just skipped routes
        if (!routeResult.results || routeResult.results.length === 0) {
            let errorMessage = "No valid routes found for your journey.";
            if (routeResult.skippedRoutes && routeResult.skippedRoutes.length > 0) {
                errorMessage = `Cannot travel in this direction on routes: ${routeResult.skippedRoutes.join(', ')}. `;
                errorMessage += "These routes go the opposite way. Try swapping your start and end points.";
            }
            return NextResponse.json({ 
                error: errorMessage,
                skippedRoutes: routeResult.skippedRoutes 
            }, { status: 404 });
        }
        
        const routesWithFare = calculateFareForRoutes(routeResult.results);
        const routesWithGeo = await getPlaceNamesForRoutes(routesWithFare);

        // Include warning if some routes were skipped
        const response: typeof routesWithGeo & { warning?: string } = routesWithGeo;
        if (routeResult.skippedRoutes && routeResult.skippedRoutes.length > 0) {
            response.warning = `Note: Route(s) ${routeResult.skippedRoutes.join(', ')} go in the opposite direction and were excluded.`;
        }
        
        return NextResponse.json(response);
    } catch (error) {
        console.error("Error in /api/calculateRoutes:", error);
        const errorMessage = error instanceof Error ? error.message : "Internal server error";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
