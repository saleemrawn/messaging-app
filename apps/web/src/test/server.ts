import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { axios } from "../../lib/axios.ts";

// Mock the same base URL the app's axios instance actually calls.
const API_URL = axios.defaults.baseURL ?? "";

// Default handlers survive resetHandlers(); tests override them with server.use().
const server = setupServer(
  http.get(`${API_URL}/conversations`, () =>
    HttpResponse.json({ success: true, data: [] }),
  ),
);

export { server, API_URL };
