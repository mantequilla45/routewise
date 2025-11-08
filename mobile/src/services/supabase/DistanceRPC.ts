import { supabase } from "../../lib/supabase";
import { LatLng } from "../../context/MapPointContext";

export async function findJeepneyPath(startLatLng: LatLng | null, endLatLng: LatLng | null) {
    if (!startLatLng || !endLatLng) return
    const { data, error } = await supabase.rpc('routing_demonstration_distance', {
        lat_a: startLatLng.latitude,
        long_a: startLatLng.longitude,
        lat_b: endLatLng.latitude,
        long_b: endLatLng.longitude,
    });


    console.log(startLatLng)
    console.log(endLatLng)
    if (error) throw error

    console.log(data);
    return data
}
