import { useEffect, useState } from 'react';

/** Ensures the splash is visible long enough to be perceived. */
export function useMinimumSplashElapsed(durationMs = 1100): boolean {
  const [elapsed, setElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setElapsed(true), durationMs);
    return () => clearTimeout(timer);
  }, [durationMs]);

  return elapsed;
}
