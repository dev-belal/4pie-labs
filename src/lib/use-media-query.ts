import { useCallback, useSyncExternalStore } from "react";

/**
 * SSR-safe media-query hook. Returns `false` on the server and the initial
 * client render, then the real match after hydration — and updates when the
 * query starts/stops matching.
 *
 * Built on `useSyncExternalStore` so there is no `setState` inside an effect
 * (subscribing to `matchMedia` is exactly the external-store case the hook is
 * designed for).
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    [query],
  );

  const getSnapshot = useCallback(
    () => window.matchMedia(query).matches,
    [query],
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
