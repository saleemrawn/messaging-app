import { screen, within } from "@testing-library/react";

// Finds a toast by its text inside Sonner's notifications region, which
// RootLayout mounts for every route.
async function findToast(text: string | RegExp): Promise<HTMLElement> {
  const region = await screen.findByRole("region", { name: /notifications/i });
  return within(region).findByText(text);
}

export { findToast };
