import { LatLng, MappedGeoRouteResult } from "@/types/GeoTypes";

export async function calculatePossibleRoutes(
    from: LatLng | null,
    to: LatLng | null
): Promise<MappedGeoRouteResult[] | { error: string; warning?: string }> {
    if (!from || !to) return [];

    const res = await fetch("http://10.0.2.2:3000/api/calculateRoutes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, to })
    });

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
        return data as MappedGeoRouteResult[];
    }

    return data;
}
