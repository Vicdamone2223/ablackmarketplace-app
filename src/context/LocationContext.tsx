import React, {
  createContext,
  useContext,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Geolocation } from "@capacitor/geolocation";
import { App as CapApp } from "@capacitor/app";

type Status = "unknown" | "granted" | "denied" | "limited";
type Coords = { lat: number; lng: number; ts: number } | null;

type LocationContextValue = {
  coords: Coords;
  status: Status;
  ensurePermission: () => Promise<boolean>;
  ensureFresh: (maxAgeMs?: number) => Promise<void>;
};

const LocationContext = createContext<LocationContextValue>({
  coords: null,
  status: "unknown",
  ensurePermission: async () => false,
  ensureFresh: async () => {},
});

const CACHE_KEY = "abm_last_coords";

function readCache(): Coords {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw);
    if (
      typeof c?.lat === "number" &&
      typeof c?.lng === "number" &&
      typeof c?.ts === "number"
    ) {
      return c as Coords;
    }
  } catch {}
  return null;
}

function writeCache(c: NonNullable<Coords>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(c));
  } catch {}
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("unknown");
  const [coords, setCoords] = useState<Coords>(null);
  const busy = useRef(false);

  const ensurePermission = useCallback(async () => {
    try {
      const perm = await Geolocation.checkPermissions();
      if (perm.location === "granted") {
        setStatus("granted");
        return true;
      }
      if (perm.location === "denied") {
        setStatus("denied");
        return false;
      }
      const req = await Geolocation.requestPermissions();
      const ok =
  (req as any).location === "granted" || (req as any).location === "limited";
setStatus(ok ? ((req as any).location as Status) : "denied");

      return ok;
    } catch {
      setStatus("unknown");
      return false;
    }
  }, []);

  const freshFix = useCallback(async () => {
    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 0, // <- critical for iOS to avoid stale cache
    });
    const c = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      ts: Date.now(),
    };
    setCoords(c);
    writeCache(c);
    return c;
  }, []);

  const ensureFresh = useCallback(
    async (maxAgeMs = 120000) => {
      if (busy.current) return;
      busy.current = true;
      try {
        const ok = await ensurePermission();
        const cached = readCache();
        const stale = !cached || Date.now() - cached.ts > maxAgeMs;

        if (!ok) {
          if (cached) setCoords(cached);
          return;
        }

        if (stale) {
          await freshFix();
        } else {
          setCoords(cached);
          // fire-and-forget silent refresh to improve accuracy
          freshFix().catch(() => {});
        }
      } finally {
        busy.current = false;
      }
    },
    [ensurePermission, freshFix]
  );

  // Seed from cache and kick an immediate refresh
  useEffect(() => {
    const c = readCache();
    if (c) setCoords(c);
    ensureFresh(0).catch(() => {});
  }, [ensureFresh]);

  // On app resume (foreground), force refresh (fixes iOS half-stale behavior)
  useEffect(() => {
    useEffect(() => {
  let sub: any;
  CapApp.addListener("appStateChange", (s) => {
    if (s.isActive) ensureFresh(0);
  }).then((listener) => {
    sub = listener;
  });

  return () => {
    if (sub) sub.remove();
  };
}, [ensureFresh]);

  }, [ensureFresh]);

  return (
    <LocationContext.Provider
      value={{ coords, status, ensurePermission, ensureFresh }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationCtx() {
  return useContext(LocationContext);
}
