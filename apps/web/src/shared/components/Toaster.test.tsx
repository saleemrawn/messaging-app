import { act, render, screen, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import Toaster from "./Toaster.tsx";
import { showErrorToast, showSuccessToast } from "../utils/toast.ts";

function getNotifications(): HTMLElement {
  return screen.getByRole("region", { name: /notifications/i });
}

describe("Toaster", () => {
  test("shows a success toast in the notifications region", async () => {
    render(<Toaster />);

    act(() => {
      showSuccessToast("Contact removed");
    });

    expect(
      await within(getNotifications()).findByText("Contact removed"),
    ).toBeInTheDocument();
  });

  test("shows an error toast in the notifications region", async () => {
    render(<Toaster />);

    act(() => {
      showErrorToast("Couldn't remove the contact. Please try again.");
    });

    expect(
      await within(getNotifications()).findByText(
        "Couldn't remove the contact. Please try again.",
      ),
    ).toBeInTheDocument();
  });
});
