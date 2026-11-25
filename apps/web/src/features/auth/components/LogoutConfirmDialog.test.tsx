import { describe, expect, test, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LogoutConfirmDialog from "./LogoutConfirmDialog.tsx";

function renderDialog() {
  const onConfirm = vi.fn();
  const onClose = vi.fn();
  const user = userEvent.setup();
  render(<LogoutConfirmDialog onConfirm={onConfirm} onClose={onClose} />);
  const dialog = screen.getByRole("dialog", { name: /logout confirmation/i });
  return { user, dialog, onConfirm, onClose };
}

describe("LogoutConfirmDialog", () => {
  test("asks for confirmation with Cancel focused", () => {
    const { dialog } = renderDialog();

    expect(dialog).toHaveAccessibleDescription(
      "Are you sure you want to logout?",
    );
    expect(within(dialog).getByRole("button", { name: "Cancel" })).toHaveFocus();
    expect(
      within(dialog).getByRole("button", { name: "Logout" }),
    ).toBeInTheDocument();
  });

  test("confirms and then closes when Logout is clicked", async () => {
    const { user, dialog, onConfirm, onClose } = renderDialog();

    await user.click(within(dialog).getByRole("button", { name: "Logout" }));

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
    expect(onConfirm.mock.invocationCallOrder[0]).toBeLessThan(
      onClose.mock.invocationCallOrder[0] ?? 0,
    );
  });

  test("closes without confirming when Cancel is clicked", async () => {
    const { user, dialog, onConfirm, onClose } = renderDialog();

    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(onClose).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  test("closes without confirming on Escape", async () => {
    const { user, onConfirm, onClose } = renderDialog();

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  test("closes on a backdrop click but not on a click inside the panel", async () => {
    const { user, dialog, onConfirm, onClose } = renderDialog();

    await user.click(within(dialog).getByText(/are you sure/i));
    expect(onClose).not.toHaveBeenCalled();

    await user.click(dialog);
    expect(onClose).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
