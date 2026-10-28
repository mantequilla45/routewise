import type { LatLng } from '@/lib/maps/geometry';

function svgIcon(svg: string, size: number): google.maps.Icon {
  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
    scaledSize: new window.google.maps.Size(size, size),
    anchor: new window.google.maps.Point(size / 2, size / 2),
  };
}

function startIcon(): google.maps.Icon {
  return svgIcon(
    `
                                <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="12" cy="12" r="10" fill="#10B981" stroke="white" stroke-width="2"/>
                                    <path d="M8 8 L16 16 M16 8 L8 16" stroke="white" stroke-width="2" stroke-linecap="round"/>
                                </svg>
                            `,
    24,
  );
}

function endIcon(): google.maps.Icon {
  return svgIcon(
    `
                                <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="12" cy="12" r="10" fill="#EF4444" stroke="white" stroke-width="2"/>
                                    <circle cx="12" cy="12" r="5" fill="white"/>
                                </svg>
                            `,
    24,
  );
}

function numberedIcon(label: number): google.maps.Icon {
  return svgIcon(
    `
                                    <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="14" cy="14" r="11" fill="#3B82F6" stroke="white" stroke-width="2"/>
                                        <text x="14" y="18" font-family="Arial" font-size="11" font-weight="bold" fill="white" text-anchor="middle">${label}</text>
                                    </svg>
                                `,
    28,
  );
}

function plainIcon(): google.maps.Icon {
  return svgIcon(
    `
                                    <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="10" cy="10" r="8" fill="#3B82F6" stroke="white" stroke-width="2"/>
                                    </svg>
                                `,
    20,
  );
}

function highlightedIcon(label: number): google.maps.Icon {
  return svgIcon(
    `
                                <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="20" cy="20" r="16" fill="#FFD700" stroke="#FF6B6B" stroke-width="3"/>
                                    <text x="20" y="26" font-family="Arial" font-size="14" font-weight="bold" fill="black" text-anchor="middle">${label}</text>
                                </svg>
                            `,
    40,
  );
}

export interface MarkerContext {
  path: LatLng[];
  isClosedLoop: boolean;
  highlightedIndex: number | null;
  showPointNumbers: boolean;
  enableClickToAdd: boolean;
}

// Builds the marker options for the point at `index`, picking the icon, title and z-index based
// on its position in the route and whether it is highlighted.
export function buildMarkerOptions(
  index: number,
  map: google.maps.Map,
  { path, isClosedLoop, highlightedIndex, showPointNumbers, enableClickToAdd }: MarkerContext,
): google.maps.MarkerOptions {
  const markerOptions: google.maps.MarkerOptions = {
    position: path[index],
    map: map,
    cursor: enableClickToAdd ? 'pointer' : 'default',
    title: '',
    zIndex: 100,
  };

  if (index === 0 && !isClosedLoop) {
    // First point - Starting point with X icon (only if not a closed loop)
    markerOptions.icon = startIcon();
    markerOptions.title = 'Starting Point';
    markerOptions.zIndex = 200;
  } else if (index === path.length - 1 && path.length > 1 && !isClosedLoop) {
    // Last point - End point with circle icon
    markerOptions.icon = endIcon();
    markerOptions.title = 'End Point';
    markerOptions.zIndex = 200;
  } else if (isClosedLoop && index === path.length - 1) {
    // Loop closing point - show as Point 1 (same as first point)
    markerOptions.icon = showPointNumbers ? numberedIcon(1) : plainIcon();
    markerOptions.title = 'Point 1 (Loop Close)';
    markerOptions.zIndex = 100;
  } else if (index === highlightedIndex) {
    // Highlighted middle point
    markerOptions.icon = highlightedIcon(index + 1);
    markerOptions.title = `Point ${index + 1} (Selected)`;
    markerOptions.zIndex = 250;
  } else {
    // Regular middle points - with or without numbers
    markerOptions.icon = showPointNumbers ? numberedIcon(index + 1) : plainIcon();
    markerOptions.title = `Point ${index + 1}`;
    markerOptions.zIndex = 100;
  }

  return markerOptions;
}
