import { LatLng, MappedGeoRouteResult } from "@/types/GeoTypes";

export async function calculatePossibleRoutes(
    from: LatLng | null,
    to: LatLng | null
): Promise<MappedGeoRouteResult[] | { error: string }> {
    if (!from || !to) return [];

    const res = await fetch("http://10.0.2.2:3000/api/calculateRoutes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, to })
    });

    if (!res.ok) {
        const errorText = await res.text();
        console.log("Error response:", errorText);
        return { error: errorText };
    }

    const data = await res.json();

    console.log("Response JSON:", data);

    // optionally validate the shape
    if (Array.isArray(data)) {
        return data as MappedGeoRouteResult[];
    }

    return data;
}
