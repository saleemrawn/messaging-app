import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { axios } from "../shared/api/axios.ts";

// Mock the same base URL the app's axios instance actually calls.
const API_URL = axios.defaults.baseURL ?? "";

// Pass it to server.use() before any "/conversations/:id" handler, which would
// otherwise match this path first.
function unreadCountHandler(getCount: () => number = () => 0) {
  return http.get(`${API_URL}/conversations/unread-count`, () =>
    HttpResponse.json({ success: true, data: { unreadCount: getCount() } }),
  );
}

// Holds every matching request until the returned release() is called, then
// lets them through to the handlers registered before it. Use it to keep a
// loader pending and assert on the loading UI.
function holdRequest(
  method: "get" | "post" | "delete",
  path: string,
): () => void {
  let release: () => void = () => undefined;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  server.use(
    http[method](`${API_URL}${path}`, async () => {
      await gate;
      // Returning nothing passes the request on to the next matching handler.
      return undefined;
    }),
  );
  return () => {
    release();
  };
}

// Default handlers survive resetHandlers(); tests override them with server.use().
const server = setupServer(
  http.get(`${API_URL}/conversations`, () =>
    HttpResponse.json({ success: true, data: [] }),
  ),
  unreadCountHandler(),
);

export { server, API_URL, holdRequest, unreadCountHandler };
