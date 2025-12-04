import { LatLng, MappedGeoRouteResult } from "@/types/GeoTypes";

export interface MultiRouteResult extends MappedGeoRouteResult {
    isTransfer: boolean;
    firstRoute?: {
        routeId: string;
        routeName: string;
        coordinates: LatLng[];
        fare: number;
        distance: number;
    };
    secondRoute?: {
        routeId: string;
        routeName: string;
        coordinates: LatLng[];
        fare: number;
        distance: number;
    };
    transferPoint?: LatLng;
    totalFare?: number;
}

export async function calculateMultiRoutes(
    from: LatLng,
    to: LatLng
): Promise<MultiRouteResult[] | { error: string; warning?: string }> {
    console.log('🔄 MULTI-ROUTE: Starting 2-jeep calculation');
    console.log('🔄 MULTI-ROUTE: From:', from);
    console.log('🔄 MULTI-ROUTE: To:', to);
    
    try {
        console.log('🔄 MULTI-ROUTE: Calling API endpoint /api/calculateMultiRoutes');
        const res = await fetch("http://10.0.2.2:3000/api/calculateMultiRoutes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ from, to })
        });

        console.log('🔄 MULTI-ROUTE: API response status:', res.status);

        if (!res.ok) {
            try {
                const errorData = await res.json();
                console.log("🔄 MULTI-ROUTE ERROR:", errorData);
                return { 
                    error: errorData.error || "No 2-jeep routes available",
                    warning: errorData.warning
                };
            } catch {
                const errorText = await res.text();
                console.log("🔄 MULTI-ROUTE ERROR TEXT:", errorText);
                return { error: errorText || "No 2-jeep routes available" };
            }
        }

        const data = await res.json();
        console.log("🔄 MULTI-ROUTE SUCCESS: Response data:", data);

        if (Array.isArray(data)) {
            console.log('🔄 MULTI-ROUTE: Found', data.length, '2-jeep route combinations');
            // Mark all results as transfer routes
            return data.map(route => ({
                ...route,
                isTransfer: true
            })) as MultiRouteResult[];
        }

        return data;
    } catch (error) {
        console.error('🔄 MULTI-ROUTE FATAL ERROR:', error);
        return { 
            error: 'Failed to calculate 2-jeep routes', 
            warning: 'Network or calculation error occurred' 
        };
    }
}