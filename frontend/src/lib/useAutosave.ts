"use client";

import { useCallback, useEffect, useRef } from "react";

/** Debounce a callback; the latest invocation wins. Flushes pending call on unmount. */
export function useDebounced<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delay = 500
) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const pendingArgs = useRef<Args | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
        if (pendingArgs.current) fnRef.current(...pendingArgs.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Args) => {
      pendingArgs.current = args;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        pendingArgs.current = null;
        fnRef.current(...args);
      }, delay);
    },
    [delay]
  );
}
