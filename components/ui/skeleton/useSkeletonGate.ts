import { useEffect, useRef, useState } from 'react';

/** Keeps skeleton visible for a minimum duration to avoid flicker on fast loads. */
export function useSkeletonGate(isLoading: boolean, minDurationMs = 320) {
  const [showSkeleton, setShowSkeleton] = useState(isLoading);
  const startedAt = useRef<number | null>(isLoading ? Date.now() : null);

  useEffect(() => {
    if (isLoading) {
      startedAt.current = Date.now();
      setShowSkeleton(true);
      return;
    }

    const elapsed = startedAt.current ? Date.now() - startedAt.current : minDurationMs;
    const remaining = Math.max(0, minDurationMs - elapsed);
    const timer = setTimeout(() => setShowSkeleton(false), remaining);
    return () => clearTimeout(timer);
  }, [isLoading, minDurationMs]);

  return showSkeleton;
}
