import { LatLng } from "@/types/GeoTypes";

    export const latLongStringifier = (latLong: LatLng | null): string => {
        if (!latLong) return "No location set";
        return `${latLong.latitude.toFixed(6)}, ${latLong.longitude.toFixed(6)}`;
    };