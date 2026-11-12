"use client";

import { useCallback, useState } from "react";

/**
 * Tracks whether a server-rendered <img> failed to load.
 * React's onError misses failures that happen before hydration (fast DNS/abort errors on SSR markup),
 * so the ref callback also inspects the element's state when it attaches.
 */
export function useImageFallback() {
  const [failed, setFailed] = useState(false);
  const onError = useCallback(() => setFailed(true), []);
  const ref = useCallback((img: HTMLImageElement | null) => {
    if (img && img.complete && img.naturalWidth === 0 && img.currentSrc) setFailed(true);
  }, []);
  return { failed, ref, onError };
}
