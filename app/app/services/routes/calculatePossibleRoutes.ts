import { LatLng, MappedGeoRouteResult } from "@/types/GeoTypes";
import { adjustToNearestRoad } from "../maps/roadAdjustment";
import { calculateMultiRoutes, MultiRouteResult } from "./calculateMultiRoutes";

export async function calculatePossibleRoutes(
    from: LatLng | null,
    to: LatLng | null
): Promise<(MappedGeoRouteResult | MultiRouteResult)[] | { error: string; warning?: string }> {
    
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

        const res = await fetch("http://10.0.2.2:3000/api/calculateRoutes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ from: adjustedFrom, to: adjustedTo })
        });

        if (!res.ok) {
            try {
                const errorData = await res.json();
                
                // If single routes failed, try multi-route before giving up
                console.log('🔄 MULTI-ROUTE: Single route failed, attempting 2-jeep calculation...');
                const multiRouteResult = await calculateMultiRoutes(adjustedFrom, adjustedTo);
                
                console.log('🔄 MULTI-ROUTE: Result:', multiRouteResult);
                
                // Check if multi-route calculation returned an error
                if ('error' in multiRouteResult) {
                    console.log('🔄 MULTI-ROUTE: Failed - both single and multi-route unavailable');
                    // Return original error if multi-route also failed
                    return { 
                        error: errorData.error || "Failed to calculate routes",
                        warning: "No single or multi-jeep routes found"
                    };
                }
                
                console.log('🔄 MULTI-ROUTE: Success - returning multi-route results');
                // Return multi-route results if successful
                return multiRouteResult;
            } catch (err) {
                console.log('🔄 MULTI-ROUTE: Error parsing response:', err);
                const errorText = await res.text();
                return { error: errorText || "Failed to calculate routes" };
            }
        }

        const data = await res.json();

        // optionally validate the shape
        if (Array.isArray(data)) {
            // If we got single routes, return them
            if (data.length > 0) {
                return data as MappedGeoRouteResult[];
            }
        }

        // If no single routes found (empty array), try multi-route calculation
        console.log('🔄 MULTI-ROUTE: No single routes in response, attempting 2-jeep calculation...');
        const multiRouteResult = await calculateMultiRoutes(adjustedFrom, adjustedTo);
        
        console.log('🔄 MULTI-ROUTE: Result:', multiRouteResult);
        
        // Check if multi-route calculation returned an error
        if ('error' in multiRouteResult) {
            console.log('🔄 MULTI-ROUTE: Failed - no routes available');
            return multiRouteResult;
        }
        
        console.log('🔄 MULTI-ROUTE: Success - returning multi-route results');
        // Return multi-route results
        return multiRouteResult;
    } catch (error) {
        console.error('🔄 MULTI-ROUTE: Fatal error in calculatePossibleRoutes:', error);
        return { 
            error: 'Failed to calculate routes', 
            warning: 'Network or calculation error occurred' 
        };
    }
}
