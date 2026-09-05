// lib/useGeolocation.ts
// Auto-tracking location hook: requests permission on mount and keeps
// watching so the position stays fresh as the user moves.
"use client";

import { useEffect, useRef, useState } from "react";
import type { LatLng } from "./types";

interface GeolocationState {
  position: LatLng | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation(autoStart = true): GeolocationState & { refresh: () => void } {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    accuracy: null,
    error: null,
    loading: autoStart,
  });
  const watchIdRef = useRef<number | null>(null);

  const start = () => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setState({
        position: null,
        accuracy: null,
        error: "Geolocation is not supported on this device",
        loading: false,
      });
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    setState((s) => ({ ...s, loading: true, error: null }));

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setState({
          position: { lat: pos.coords.latitude, lon: pos.coords.longitude },
          accuracy: pos.coords.accuracy,
          error: null,
          loading: false,
        });
      },
      (err) => {
        setState({
          position: null,
          accuracy: null,
          loading: false,
          error:
            err.code === err.PERMISSION_DENIED
              ? "Location permission denied — enable it in your browser settings"
              : err.code === err.POSITION_UNAVAILABLE
              ? "Location unavailable right now"
              : "Could not get your location — please try again",
        });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    );
    watchIdRef.current = id;
  };

  useEffect(() => {
    if (autoStart) start();
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  return { ...state, refresh: start };
}
