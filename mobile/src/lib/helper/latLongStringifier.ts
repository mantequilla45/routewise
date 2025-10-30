import { LatLng } from "react-native-maps";

export const latLongStringifier = (latLong: LatLng | null): string => { 
    if (!latLong) return "No location set";
    return `${latLong.latitude.toFixed(6)}, ${latLong.longitude.toFixed(6)}`;
};
