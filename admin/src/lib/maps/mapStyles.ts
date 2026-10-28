// Map styles that hide points of interest, businesses and transit labels.
export const POI_HIDDEN_STYLES: google.maps.MapTypeStyle[] = [
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'poi.business',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'transit',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
];

export function getMapStyles(hidePOIs: boolean): google.maps.MapTypeStyle[] {
  return hidePOIs ? POI_HIDDEN_STYLES : [];
}
