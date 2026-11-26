import { useCallback, useSyncExternalStore } from "react";
import { matchesMediaQuery } from "../utils/media-query.ts";

// Whether a CSS media query matches, re-rendering when it starts or stops
// matching (a resize or a device rotation).
function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => {
        list.removeEventListener("change", onChange);
      };
    },
    [query],
  );
  return useSyncExternalStore(subscribe, () => matchesMediaQuery(query));
}

export { useMediaQuery };
