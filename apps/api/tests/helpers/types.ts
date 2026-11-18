import { expect } from "vitest";

const anyString = () => expect.any(String) as string;

const isoDateString = (): unknown =>
  expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

export { anyString, isoDateString };
