import { LatLng } from "@/context/map-context";

export async function calculatePossibleRoutes(from: LatLng | null, to: LatLng | null) {
    if (!from || !to) return;

    // ONLY WORKS ON EMULATOR FOR NOW. WEBSERVER IS NOT UP YET. THE LINK IS CURRENTLY HARDCODED
    const res = await fetch("http://10.0.2.2:3000/api/calculateRoutes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, to })
    });

    if (!res.ok) {
        const errorText = await res.text();
        console.log("Error response:", errorText);
        throw new Error("Request failed");
    }

    const data = await res.json();
    console.log("Response JSON:", data);

    return data;
}

