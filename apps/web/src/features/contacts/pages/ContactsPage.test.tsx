import { describe, expect, test } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { API_URL, server } from "../../../test/server.ts";
import { renderRoute } from "../../../test/render-route.tsx";
import { currentUser, mockContactsApi } from "../test-api.ts";

async function findContactList() {
  return within(await screen.findByRole("list", { name: "Contacts" }));
}

describe("contacts page", () => {
  test("titles the page Contacts", async () => {
    mockContactsApi();

    renderRoute("/contacts");

    await findContactList();
    expect(document.title).toBe("Contacts | messgr.");
  });

  test("shows the heading with an add button beside it", async () => {
    mockContactsApi();

    renderRoute("/contacts");

    const heading = await screen.findByRole("heading", {
      level: 1,
      name: "Contacts",
    });
    const addButton = screen.getByRole("button", { name: "Add contact" });
    expect(addButton).toHaveAttribute("aria-haspopup", "dialog");
    expect(heading.parentElement).toContainElement(addButton);
  });

  test("lists contacts with avatar, full name, email, Message and Remove buttons", async () => {
    mockContactsApi();

    renderRoute("/contacts");

    const list = await findContactList();
    const rows = list.getAllByRole("listitem");
    expect(rows).toHaveLength(2);

    const aisha = within(rows[0]);
    expect(aisha.getByText("AK")).toBeInTheDocument();
    expect(aisha.getByText("Aisha Khan")).toBeInTheDocument();
    expect(aisha.getByText("aisha.khan@email.com")).toBeInTheDocument();
    expect(
      aisha.getByRole("button", { name: "Message Aisha Khan" }),
    ).toHaveTextContent("Message");
    expect(
      aisha.getByRole("button", { name: "Remove Aisha Khan from contacts" }),
    ).toHaveTextContent("Remove");

    expect(within(rows[1]).getByText("Phillipe Martin")).toBeInTheDocument();
  });

  test("shows an empty state when there are no contacts", async () => {
    mockContactsApi({ contacts: [] });

    renderRoute("/contacts");

    expect(await screen.findByText("No contacts yet")).toBeInTheDocument();
    expect(
      screen.queryByRole("list", { name: "Contacts" }),
    ).not.toBeInTheDocument();
  });

  test("removes a contact from the list", async () => {
    const api = mockContactsApi();
    const user = userEvent.setup();
    renderRoute("/contacts");

    await user.click(
      await screen.findByRole("button", {
        name: "Remove Phillipe Martin from contacts",
      }),
    );

    await waitFor(() => {
      expect(screen.queryByText("Phillipe Martin")).not.toBeInTheDocument();
    });
    expect(api.removeRequests).toEqual([3]);
    expect(screen.getByText("Aisha Khan")).toBeInTheDocument();
  });

  test("shows an error and keeps the row when removing fails", async () => {
    mockContactsApi({ removeStatus: 500 });
    const user = userEvent.setup();
    renderRoute("/contacts");

    await user.click(
      await screen.findByRole("button", {
        name: "Remove Aisha Khan from contacts",
      }),
    );

    expect(
      await screen.findByText("Couldn't remove the contact. Please try again."),
    ).toBeInTheDocument();
    expect(screen.getByText("Aisha Khan")).toBeInTheDocument();
  });

  test("opens a conversation with the contact on the Messages page", async () => {
    const api = mockContactsApi();
    const user = userEvent.setup();
    const { router } = renderRoute("/contacts");

    await user.click(
      await screen.findByRole("button", { name: "Message Aisha Khan" }),
    );

    expect(
      await screen.findByRole("heading", { level: 2, name: "Aisha Khan" }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/conversations/12");
    expect(api.createConversationBodies).toEqual([{ recipientId: 2 }]);
  });

  test("reopens the existing conversation when messaging a contact again", async () => {
    const api = mockContactsApi();
    const user = userEvent.setup();
    const { router } = renderRoute("/contacts");

    await user.click(
      await screen.findByRole("button", { name: "Message Aisha Khan" }),
    );
    await screen.findByRole("heading", { level: 2, name: "Aisha Khan" });
    await router.navigate("/contacts");
    await user.click(
      await screen.findByRole("button", { name: "Message Aisha Khan" }),
    );

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/conversations/12");
    });
    expect(api.createConversationBodies).toEqual([
      { recipientId: 2 },
      { recipientId: 2 },
    ]);
  });

  test("shows an error and stays on the page when opening a conversation fails", async () => {
    mockContactsApi({ createConversationStatus: 500 });
    const user = userEvent.setup();
    const { router } = renderRoute("/contacts");

    await user.click(
      await screen.findByRole("button", { name: "Message Aisha Khan" }),
    );

    const list = await findContactList();
    const aishaRow = list.getAllByRole("listitem")[0];
    expect(
      await within(aishaRow).findByText("Something broke"),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/contacts");
  });

  test("redirects to login when the session has expired", async () => {
    let isLoggedIn = true;
    server.use(
      http.get(`${API_URL}/auth/me`, () =>
        isLoggedIn
          ? HttpResponse.json({ success: true, data: currentUser })
          : HttpResponse.json({ success: false }, { status: 401 }),
      ),
      http.get(`${API_URL}/contacts`, () => {
        isLoggedIn = false;
        return HttpResponse.json({ success: false }, { status: 401 });
      }),
    );

    const { router } = renderRoute("/contacts");

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/login");
    });
  });
});
