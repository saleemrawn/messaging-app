import { describe, expect, test } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderRoute } from "../../../test/render-route.tsx";
import { mockContactsApi } from "../test-api.ts";

// Lets the dialog's debounce elapse before asserting that nothing was sent.
const PAST_DEBOUNCE_MS = 500;

async function openDialog() {
  const user = userEvent.setup();
  const rendered = renderRoute("/contacts");
  await user.click(await screen.findByRole("button", { name: "Add contact" }));
  const dialog = screen.getByRole("dialog", { name: "Add contact" });
  return { user, dialog, ...rendered };
}

function getEmailInput(dialog: HTMLElement) {
  return within(dialog).getByLabelText("Email");
}

describe("add contact dialog", () => {
  test("opens from the add button with the email field focused", async () => {
    mockContactsApi();

    const { dialog } = await openDialog();

    expect(getEmailInput(dialog)).toHaveFocus();
    expect(
      within(dialog).getByText("Enter their full email address"),
    ).toBeInTheDocument();
  });

  test("closes from the close button and returns focus to the add button", async () => {
    mockContactsApi();
    const { user, dialog } = await openDialog();

    await user.click(within(dialog).getByRole("button", { name: "Close" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add contact" })).toHaveFocus();
  });

  test("closes on Escape and returns focus to the add button", async () => {
    mockContactsApi();
    const { user } = await openDialog();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add contact" })).toHaveFocus();
  });

  test("says when no user has the email address", async () => {
    mockContactsApi();
    const { user, dialog } = await openDialog();

    await user.type(getEmailInput(dialog), "nobody@email.com");

    expect(
      await within(dialog).findByText("No user found with that email address"),
    ).toBeInTheDocument();
    expect(within(dialog).queryByRole("list")).not.toBeInTheDocument();
  });

  test("says when the email is the user's own, without looking it up", async () => {
    const { lookupEmails } = mockContactsApi();
    const { user, dialog } = await openDialog();

    await user.type(getEmailInput(dialog), "john.doe01@email.com");
    await new Promise((resolve) => setTimeout(resolve, PAST_DEBOUNCE_MS));

    expect(
      within(dialog).getByText("That's your own email address"),
    ).toBeInTheDocument();
    expect(lookupEmails).toEqual([]);
  });

  test("adds the found user, closes the dialog and lists them", async () => {
    const { addBodies } = mockContactsApi();
    const { user, dialog } = await openDialog();

    await user.type(getEmailInput(dialog), "jane.smith@email.com");
    await user.click(
      await within(dialog).findByRole("button", {
        name: /jane smith.*jane\.smith@email\.com.*add contact/i,
      }),
    );

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(addBodies).toEqual([{ contactId: 4 }]);
    const list = within(screen.getByRole("list", { name: "Contacts" }));
    await waitFor(() => {
      expect(list.getAllByRole("listitem")).toHaveLength(3);
    });
    expect(list.getAllByRole("listitem")[1]).toHaveTextContent("Jane Smith");
  });

  test("adds the found user when Enter is pressed", async () => {
    const { addBodies } = mockContactsApi();
    const { user, dialog } = await openDialog();

    await user.type(getEmailInput(dialog), "jane.smith@email.com");
    await within(dialog).findByRole("button", { name: /jane smith/i });
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(addBodies).toEqual([{ contactId: 4 }]);
  });

  test("marks an existing contact and doesn't add them again", async () => {
    const { addBodies } = mockContactsApi();
    const { user, dialog } = await openDialog();

    await user.type(getEmailInput(dialog), "aisha.khan@email.com");
    const option = await within(dialog).findByRole("button", {
      name: /aisha khan.*already a contact/i,
    });
    expect(option).toHaveAttribute("aria-disabled", "true");
    await user.click(option);
    await user.keyboard("{Enter}");

    expect(addBodies).toEqual([]);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  test("shows an error and stays open when the contact can't be added", async () => {
    mockContactsApi({ addStatus: 500 });
    const { user, dialog } = await openDialog();

    await user.type(getEmailInput(dialog), "jane.smith@email.com");
    await user.click(
      await within(dialog).findByRole("button", { name: /jane smith/i }),
    );

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "Something broke",
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
