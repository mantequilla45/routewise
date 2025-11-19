import { calculateRoute } from "@/services/geo/routeCalculation";
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
        const calculatedRoutes = await calculateRoute(from, to);
        console.log(NextResponse.json(calculatedRoutes))
        return NextResponse.json(calculatedRoutes);
    } catch (error) {
        console.error("Error in /api/calculateRoutes:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
