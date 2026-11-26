import { axios } from "./axios.ts";

// "https://…", "blob:…" or protocol-relative "//…".
const ABSOLUTE_URL = /^(?:[a-z][a-z\d+.-]*:|\/\/)/i;

// Resolves a URL the API returned relative to itself (e.g. an avatar at
// "/avatars/seed-01.jpg") against the API base URL. Absolute URLs, such as a
// CDN's, pass through unchanged.
function toApiUrl(url: string): string {
  if (ABSOLUTE_URL.test(url)) return url;
  const base = (axios.defaults.baseURL ?? "").replace(/\/+$/, "");
  return `${base}/${url.replace(/^\/+/, "")}`;
}

export { toApiUrl };
