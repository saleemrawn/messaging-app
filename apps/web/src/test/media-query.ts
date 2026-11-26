import { act } from "@testing-library/react";
import { DESKTOP_QUERY } from "../app/layout-queries.ts";
import { SPLIT_VIEW_QUERY } from "../features/conversations/split-view.ts";

// jsdom has no window.matchMedia. This fake answers from a set of queries the
// test says match, and notifies "change" listeners when that set changes, the
// way a resize or rotation would.

type Viewport = "mobile" | "tablet-landscape" | "desktop";

const VIEWPORT_QUERIES: Record<Viewport, readonly string[]> = {
  // Phones in either orientation and portrait tablets match neither query.
  mobile: [],
  "tablet-landscape": [SPLIT_VIEW_QUERY],
  desktop: [DESKTOP_QUERY, SPLIT_VIEW_QUERY],
};

type ChangeListener = (event: MediaQueryListEvent) => void;

let matchingQueries = new Set<string>(VIEWPORT_QUERIES.desktop);
const listeners = new Map<string, Set<ChangeListener>>();

function listenersFor(query: string): Set<ChangeListener> {
  let set = listeners.get(query);
  if (!set) {
    set = new Set();
    listeners.set(query, set);
  }
  return set;
}

function createMediaQueryList(query: string): MediaQueryList {
  return {
    media: query,
    get matches() {
      return matchingQueries.has(query);
    },
    onchange: null,
    addEventListener(_type: string, listener: ChangeListener) {
      listenersFor(query).add(listener);
    },
    removeEventListener(_type: string, listener: ChangeListener) {
      listenersFor(query).delete(listener);
    },
    dispatchEvent: () => true,
    // The deprecated addListener/removeListener are left out; the app doesn't
    // use them.
  } as unknown as MediaQueryList;
}

function installMatchMedia() {
  window.matchMedia = createMediaQueryList;
}

// Changes which queries match and notifies listeners of each query whose
// result flipped. Wrapped in act() so components re-render before asserting.
function setMatchingQueries(queries: readonly string[]) {
  const previous = matchingQueries;
  matchingQueries = new Set(queries);
  act(() => {
    for (const [query, set] of listeners) {
      const matches = matchingQueries.has(query);
      if (matches === previous.has(query)) continue;
      const event = { matches, media: query } as MediaQueryListEvent;
      for (const listener of set) listener(event);
    }
  });
}

function setViewport(viewport: Viewport) {
  setMatchingQueries(VIEWPORT_QUERIES[viewport]);
}

// Back to desktop, the layout every test assumes unless it says otherwise.
function resetMatchMedia() {
  matchingQueries = new Set(VIEWPORT_QUERIES.desktop);
  listeners.clear();
}

export { installMatchMedia, resetMatchMedia, setMatchingQueries, setViewport };
export type { Viewport };
