import { Geolocation } from '@capacitor/geolocation';

export async function ensureLocationPermission(): Promise<boolean> {
  const current = await Geolocation.checkPermissions();
  if (current.location === 'granted') return true;

  const requested = await Geolocation.requestPermissions(); // prompts user
  return requested.location === 'granted';
}

export async function getUserCoords() {
  const ok = await ensureLocationPermission();
  if (!ok) return null;

  const pos = await Geolocation.getCurrentPosition({
    enableHighAccuracy: true,
    timeout: 10000
  });
  return pos.coords; // { latitude, longitude, accuracy, ... }
}
