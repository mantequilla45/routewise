import { api, type PlaceSuggestion } from '@/lib/api';
import { LatLng } from '@/types/GeoTypes';
import { useRef, useState } from 'react';

const DEBOUNCE_MS = 250;

const newSessionToken = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

/**
 * Debounced place search against the backend. One session token covers the keystrokes and the
 * final details call (Google bills it as one session); it renews after each pick or reset.
 */
export default function usePlaceSearch(near?: LatLng | null) {
  const [session, setSession] = useState(newSessionToken);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [failed, setFailed] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRequest = useRef(0);

  const hasQuery = query.trim().length >= 2;

  const onChangeText = (text: string) => {
    setQuery(text);
    setFailed(false);
    if (timer.current) clearTimeout(timer.current);
    if (text.trim().length < 2) {
      latestRequest.current++;
      setSuggestions([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    timer.current = setTimeout(async () => {
      const request = ++latestRequest.current;
      try {
        const results = await api.places.autocomplete(text.trim(), session, near);
        if (request === latestRequest.current) setSuggestions(results);
      } catch (error) {
        console.warn('Place search failed:', error);
        if (request === latestRequest.current) setFailed(true);
      } finally {
        if (request === latestRequest.current) setIsSearching(false);
      }
    }, DEBOUNCE_MS);
  };

  const reset = () => {
    onChangeText('');
    setSession(newSessionToken());
  };

  /** Resolve a suggestion to coordinates; null if it fails (shown as an error). */
  const choose = async (suggestion: PlaceSuggestion): Promise<LatLng | null> => {
    setOpeningId(suggestion.placeId);
    try {
      const place = await api.places.details(suggestion.placeId, session);
      reset();
      return place.location;
    } catch (error) {
      console.warn('Place details failed:', error);
      setFailed(true);
      return null;
    } finally {
      setOpeningId(null);
    }
  };

  return {
    query,
    hasQuery,
    suggestions,
    isSearching,
    failed,
    openingId,
    onChangeText,
    reset,
    choose,
  };
}
