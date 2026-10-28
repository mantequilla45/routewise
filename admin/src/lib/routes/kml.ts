import type { Coordinate } from './types';
import { pointLabel } from './points';

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

function pushCoordinate(coordinates: Coordinate[], pair: string) {
  const [lng, lat] = pair.split(',');
  const longitude = parseFloat(lng);
  const latitude = parseFloat(lat);

  if (!isNaN(longitude) && !isNaN(latitude)) {
    coordinates.push({
      lat: latitude,
      lng: longitude,
      label: pointLabel(coordinates.length),
    });
  }
}

/**
 * Extract route coordinates from a KML document. LineString/Polygon coordinates are
 * preferred; Point coordinates are used as a fallback when no lines are present.
 */
export function parseKML(kmlContent: string): Coordinate[] {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(kmlContent, 'text/xml');

    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      throw new Error('Invalid KML format');
    }

    const coordinates: Coordinate[] = [];

    const lineStrings = xmlDoc.querySelectorAll('LineString coordinates, Polygon coordinates');
    lineStrings.forEach((coordElement) => {
      const coordText = coordElement.textContent?.trim();
      if (!coordText) return;

      // KML coordinates are in format: longitude,latitude,altitude (altitude is optional)
      const coordPairs = coordText.split(/\s+/).filter((pair) => pair.length > 0);
      coordPairs.forEach((pair) => pushCoordinate(coordinates, pair));
    });

    if (coordinates.length === 0) {
      const points = xmlDoc.querySelectorAll('Point coordinates');
      points.forEach((coordElement) => {
        const coordText = coordElement.textContent?.trim();
        if (!coordText) return;
        pushCoordinate(coordinates, coordText);
      });
    }

    return coordinates;
  } catch (error) {
    console.error('Error parsing KML:', error);
    throw new Error('Failed to parse KML file');
  }
}
