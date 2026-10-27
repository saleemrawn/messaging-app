import { expect } from "vitest";

const anyString = () => expect.any(String) as string;

export { anyString };
