import { createContext, useContext, ReactNode } from 'react';
import { useUserLocation } from '../hooks/useUserLocation';

type LocationContextValue = {
  coords: GeolocationCoordinates | null;
  status: 'idle' | 'granted' | 'denied';
};

const LocationContext = createContext<LocationContextValue>({
  coords: null,
  status: 'idle',
});

export function LocationProvider({ children }: { children: ReactNode }) {
  const { coords, status } = useUserLocation();
  return (
    <LocationContext.Provider value={{ coords, status }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationCtx() {
  return useContext(LocationContext);
}
