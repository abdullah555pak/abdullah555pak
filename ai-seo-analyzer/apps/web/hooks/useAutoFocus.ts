"use client";

import { useEffect, useRef } from "react";

/**
 * Focuses the returned ref's element once, when the component mounts.
 * Used on the heading of each major scan screen (starting, completed,
 * failed, unavailable, partial) so screen-reader and keyboard users
 * land on the new content after a state change, instead of keeping
 * focus on a button that's no longer there.
 */
export function useAutoFocus<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return ref;
}
