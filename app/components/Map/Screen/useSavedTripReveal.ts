import { MapPointsContext } from '@/context/map-context';
import { useContext, useEffect, useEffectEvent, useState } from 'react';

/**
 * A saved route opens with the sheet tucked away (`openedOnSaved`), so the results don't flash
 * up only to slide away when the saved trip is selected (SelectorContent selects it). The sheet
 * comes up only if no result matches, or the search finds nothing. Returns whether the saved
 * trip is still being looked for (for a loading pill in place of the sheet).
 */
export default function useSavedTripReveal({
  openedOnSaved,
  isCalculating,
  showModal,
}: {
  openedOnSaved: boolean;
  isCalculating: boolean;
  showModal: () => void;
}) {
  const { preferredCodes, setPreferredCodes, results, selectedRouteIndex } =
    useContext(MapPointsContext);
  // waiting → shown (the saved trip is on the map) or reveal (bring up the sheet instead)
  const [state, setState] = useState<'waiting' | 'shown' | 'reveal'>(
    openedOnSaved ? 'waiting' : 'shown',
  );
  // The search runs a moment after the screen opens; "done" only means anything after it started
  const [started, setStarted] = useState(false);
  if (isCalculating && !started) setStarted(true);

  if (state === 'waiting') {
    const noMatch = preferredCodes === null; // looked through the results, none was it
    const nothingFound = started && !isCalculating && results.length === 0;
    if (selectedRouteIndex !== null) setState('shown');
    else if (noMatch || nothingFound) setState('reveal');
  }

  const revealSheet = useEffectEvent(() => {
    setPreferredCodes(null); // a search the rider makes next isn't for the saved trip
    showModal();
  });
  useEffect(() => {
    if (state === 'reveal') revealSheet();
  }, [state]);

  return state === 'waiting';
}
