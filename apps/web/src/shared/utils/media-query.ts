// A one-off read of a CSS media query, for code outside React such as loaders.
// Components should use useMediaQuery so they re-render when it changes.
function matchesMediaQuery(query: string): boolean {
  return window.matchMedia(query).matches;
}

export { matchesMediaQuery };
