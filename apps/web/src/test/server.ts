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

// Default handlers survive resetHandlers(); tests override them with server.use().
const server = setupServer(
  http.get(`${API_URL}/conversations`, () =>
    HttpResponse.json({ success: true, data: [] }),
  ),
  unreadCountHandler(),
);

export { server, API_URL, unreadCountHandler };
