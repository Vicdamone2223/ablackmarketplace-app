// src/hooks/useUserLocation.ts
import { useEffect, useState } from 'react';
import { getUserCoords } from '../helpers/location';  // <- fix this path

export function useUserLocation() {
  const [coords, setCoords] = useState<GeolocationCoordinates | null>(null);
  const [status, setStatus] = useState<'idle' | 'granted' | 'denied'>('idle');

  useEffect(() => {
    (async () => {
      const pos = await getUserCoords();
      if (pos) {
        setCoords(pos);
        setStatus('granted');
      } else {
        setStatus('denied');
      }
    })();
  }, []);

  return { coords, status };
}
