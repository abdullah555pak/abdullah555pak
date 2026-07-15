import { useEffect, useRef, useState } from 'react';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

const LAHORE_ORIGIN: Coordinates = { latitude: 31.5204, longitude: 74.3587 };

/**
 * Simulates a live GPS feed by nudging coordinates slightly on an interval,
 * mimicking small drift you'd see from a real device fix.
 */
export function useMockGps(intervalMs = 3000) {
  const [coords, setCoords] = useState<Coordinates>(LAHORE_ORIGIN);
  const originRef = useRef(LAHORE_ORIGIN);

  useEffect(() => {
    const id = setInterval(() => {
      setCoords((prev) => {
        const jitter = () => (Math.random() - 0.5) * 0.0008;
        const next = {
          latitude: originRef.current.latitude + jitter(),
          longitude: originRef.current.longitude + jitter(),
        };
        return next;
      });
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return coords;
}

export function formatCoordinate(value: number): string {
  return value.toFixed(6);
}
