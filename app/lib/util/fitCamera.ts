import { LatLng } from '@/types/GeoTypes';
import { Platform } from 'react-native';

// Web Mercator: Google Maps draws the world 256 points wide at zoom 0, doubling per zoom level.
// expo-maps on iOS instead turns zoom into a region 360 / 2^zoom degrees wide that MapKit
// stretches across the whole view, so there the world is `width` points wide at zoom 0.
const GOOGLE_WORLD_SIZE = 256;
const MIN_ZOOM = 3;
const MAX_ZOOM = 17;

const mercatorY = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 180 / 2));
const fromMercatorY = (y: number) => ((2 * Math.atan(Math.exp(y)) - Math.PI / 2) * 180) / Math.PI;

export type Padding = { top: number; bottom: number; left: number; right: number };

/**
 * Camera center and zoom that fit all `points` inside a `width` x `height` view (in points),
 * leaving `padding` free for overlays. expo-maps has no fit-to-bounds call, so this does the
 * Mercator math directly. The center is shifted so the points sit in the unpadded area.
 */
export function fitCamera(
  points: LatLng[],
  width: number,
  height: number,
  padding: Padding,
): { coordinates: LatLng; zoom: number } | null {
  if (points.length === 0) return null;
  const worldSize = Platform.OS === 'ios' ? width : GOOGLE_WORLD_SIZE;

  const lats = points.map((p) => p.latitude);
  const lngs = points.map((p) => p.longitude);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minY = mercatorY(Math.min(...lats));
  const maxY = mercatorY(Math.max(...lats));

  const usableWidth = Math.max(1, width - padding.left - padding.right);
  const usableHeight = Math.max(1, height - padding.top - padding.bottom);

  // Zoom at which the box's width / height exactly fills the usable area
  const lngSpan = Math.max(maxLng - minLng, 1e-6);
  const ySpan = Math.max(maxY - minY, 1e-8);
  const zoomForWidth = Math.log2((usableWidth * 360) / (lngSpan * worldSize));
  const zoomForHeight = Math.log2((usableHeight * 2 * Math.PI) / (ySpan * worldSize));
  const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.min(zoomForWidth, zoomForHeight)));

  // Points per degree / per Mercator unit at that zoom, to offset the center for the padding
  const worldPoints = worldSize * 2 ** zoom;
  const lngPerPoint = 360 / worldPoints;
  const yPerPoint = (2 * Math.PI) / worldPoints;
  const centerLng = (minLng + maxLng) / 2 + ((padding.right - padding.left) / 2) * lngPerPoint;
  // Screen y grows downward, Mercator y grows northward
  const centerY = (minY + maxY) / 2 + ((padding.top - padding.bottom) / 2) * yPerPoint;

  return { coordinates: { latitude: fromMercatorY(centerY), longitude: centerLng }, zoom };
}
