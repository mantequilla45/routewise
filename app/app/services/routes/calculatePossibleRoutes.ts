import { LatLng, MappedGeoRouteResult } from "@/types/GeoTypes";
import { adjustToNearestRoad } from "../maps/roadAdjustment";
import { calculateMultiRoutes, MultiRouteResult } from "./calculateMultiRoutes";

export async function calculatePossibleRoutes(
    from: LatLng | null,
    to: LatLng | null
): Promise<(MappedGeoRouteResult | MultiRouteResult)[] | { error: string; warning?: string }> {
    console.log('calculatePossibleRoutes called with:', { from, to });
    
    if (!from || !to) {
        console.log('Missing from or to coordinates');
        return [];
    }

    try {
        console.log('Starting route calculation...');
        
        // Try to snap to road, but fall back to original points if it fails
        let adjustedFrom = from;
        let adjustedTo = to;
        
        try {
            console.log('Attempting to snap points to road...');
            const [snappedFrom, snappedTo] = await Promise.all([
                adjustToNearestRoad(from).catch(() => from),
                adjustToNearestRoad(to).catch(() => to)
            ]);
            adjustedFrom = snappedFrom;
            adjustedTo = snappedTo;
            console.log('Snap to road completed');
        } catch (snapError) {
            console.log('Snap to road failed, using original points:', snapError);
        }

        console.log('Original points:', { from, to });
        console.log('Using points for calculation:', { from: adjustedFrom, to: adjustedTo });

        console.log('Fetching route calculation from API...');
        const res = await fetch("http://10.0.2.2:3000/api/calculateRoutes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ from: adjustedFrom, to: adjustedTo })
        });

        console.log('API response status:', res.status);

        if (!res.ok) {
            try {
                const errorData = await res.json();
                console.log("Error response:", errorData);
                return { 
                    error: errorData.error || "Failed to calculate routes",
                    warning: errorData.warning
                };
            } catch {
                const errorText = await res.text();
                console.log("Error response text:", errorText);
                return { error: errorText || "Failed to calculate routes" };
            }
        }

        const data = await res.json();

        console.log("Response JSON:", data);

        // Check for warnings in successful responses
        if (data.warning) {
            console.log("Route warning:", data.warning);
        }

        // optionally validate the shape
        if (Array.isArray(data)) {
            console.log('Successfully calculated', data.length, 'routes');
            
            // If we got single routes, return them
            if (data.length > 0) {
                return data as MappedGeoRouteResult[];
            }
        }

        // If no single routes found (empty array), try multi-route calculation
        console.log('No single jeep routes found, attempting 2-jeep calculation...');
        const multiRouteResult = await calculateMultiRoutes(adjustedFrom, adjustedTo);
        
        // Check if multi-route calculation returned an error
        if ('error' in multiRouteResult) {
            return multiRouteResult;
        }
        
        // Return multi-route results
        return multiRouteResult;
    } catch (error) {
        console.error('Error in calculatePossibleRoutes:', error);
        return { 
            error: 'Failed to calculate routes', 
            warning: 'Network or calculation error occurred' 
        };
    }
}
