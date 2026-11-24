import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { cleanup } from "@testing-library/react";
import { server } from "./server.ts";
import { axios } from "../../lib/axios.ts";

// jsdom's XMLHttpRequest enforces CORS, which blocks credentialed requests to
// the mocked cross-origin API. Node's fetch doesn't, and MSW intercepts both.
axios.defaults.adapter = "fetch";

beforeAll(() => {
  server.listen({ onUnhandledFrame: "error" });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
