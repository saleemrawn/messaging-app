import { setupServer } from "msw/node";
import { axios } from "../../lib/axios.ts";

// Mock the same base URL the app's axios instance actually calls.
const API_URL = axios.defaults.baseURL ?? "";

const server = setupServer();

export { server, API_URL };
