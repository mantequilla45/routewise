import { LatLng, MappedGeoRouteResult } from "@/types/GeoTypes";
import { adjustToNearestRoad } from "../maps/roadAdjustment";

export async function calculatePossibleRoutes(
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

        // ==========================================
        // NEW V2 IMPLEMENTATION ONLY - FRESH START
        // NO FALLBACK, NO MULTI-ROUTE
        // ==========================================
        console.log('🆕 V2 ROUTE CALCULATION - FRESH START');
        console.log('📍 From:', adjustedFrom);
        console.log('📍 To:', adjustedTo);
        
        const res = await fetch("http://10.0.2.2:3000/api/calculateRoutesV2", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ from: adjustedFrom, to: adjustedTo }),
        });

        if (!res.ok) {
            const errorData = await res.json();
            console.log('❌ V2 Error:', errorData);
            return { 
                error: errorData.error || "No route handler available",
                warning: errorData.debugInfo ? JSON.stringify(errorData.debugInfo) : undefined
            };
        }

        const data = await res.json();
        console.log('✅ V2 Success:', data);
        
        // Return V2 data only
        return data as MappedGeoRouteResult[];

    } catch (error) {
        console.error('🔴 V2 Fatal error:', error);
        return { 
            error: 'Failed to calculate routes', 
            warning: 'V2 calculation error occurred' 
        };
    }
}