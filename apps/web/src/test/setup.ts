import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { cleanup } from "@testing-library/react";
import { server } from "./server.ts";
import { axios } from "../shared/api/axios.ts";

// jsdom's XMLHttpRequest enforces CORS, which blocks credentialed requests to
// the mocked cross-origin API. Node's fetch doesn't, and MSW intercepts both.
axios.defaults.adapter = "fetch";

// jsdom has no modal dialog support. Mirror what the app relies on: showModal()
// opens, close() closes and fires "close", and Escape fires a cancelable
// "cancel" before closing.
if (typeof HTMLDialogElement.prototype.showModal !== "function") {
  HTMLDialogElement.prototype.showModal = function showModal(
    this: HTMLDialogElement,
  ) {
    this.open = true;
    this.addEventListener("keydown", closeOnEscape);
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    if (!this.open) return;
    this.open = false;
    this.removeEventListener("keydown", closeOnEscape);
    this.dispatchEvent(new Event("close"));
  };
}

function closeOnEscape(this: HTMLDialogElement, event: KeyboardEvent) {
  if (event.key !== "Escape") return;
  const cancel = new Event("cancel", { cancelable: true });
  if (this.dispatchEvent(cancel)) this.close();
}

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
