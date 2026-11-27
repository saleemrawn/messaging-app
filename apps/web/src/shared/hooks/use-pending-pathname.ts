import { useEffect, useState } from "react";
import { useLocation, useNavigation } from "react-router";

// How long a navigation must be pending before its loading UI shows, so a fast
// load swaps straight to the new screen instead of flashing a placeholder.
const PENDING_INDICATOR_DELAY_MS = 150;

// The pathname a link (or redirect) navigation is loading. Form submissions
// and their revalidation, and reloads of the current pathname, don't count:
// the screen on show is still the right one for those.
function useLoadingPathname(): string | null {
  const navigation = useNavigation();
  const { pathname } = useLocation();
  if (navigation.state !== "loading" || navigation.formMethod !== undefined) {
    return null;
  }
  const nextPathname = navigation.location.pathname;
  return nextPathname === pathname ? null : nextPathname;
}

// The pathname being loaded, once it has been loading for longer than
// PENDING_INDICATOR_DELAY_MS; null otherwise.
function usePendingPathname(): string | null {
  const loadingPathname = useLoadingPathname();
  const [delayedPathname, setDelayedPathname] = useState<string | null>(null);

  useEffect(() => {
    if (loadingPathname === null) return;
    const timeoutId = setTimeout(() => {
      setDelayedPathname(loadingPathname);
    }, PENDING_INDICATOR_DELAY_MS);
    return () => {
      clearTimeout(timeoutId);
    };
  }, [loadingPathname]);

  // A stale value from an earlier navigation never shows.
  return delayedPathname === loadingPathname ? loadingPathname : null;
}

export { PENDING_INDICATOR_DELAY_MS, usePendingPathname };
