import { describe, expect, test } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { API_URL, server, unreadCountHandler } from "../test/server.ts";
import { renderRoute } from "../test/render-route.tsx";
import { findToast } from "../test/toasts.ts";

const currentUser = {
  id: 1,
  username: "johndoe01",
  firstName: "John",
  lastName: "Doe",
  email: "john.doe01@email.com",
};

// Logged in until a successful POST /auth/logout, like the real cookie session.
function mockSession(logoutStatus = 200) {
  let isLoggedIn = true;
  const calls = { logout: 0 };
  server.use(
    http.get(`${API_URL}/auth/me`, () =>
      isLoggedIn
        ? HttpResponse.json({ success: true, data: currentUser })
        : HttpResponse.json({ success: false }, { status: 401 }),
    ),
    http.post(`${API_URL}/auth/logout`, () => {
      calls.logout += 1;
      if (logoutStatus !== 200) {
        return HttpResponse.json({ success: false }, { status: logoutStatus });
      }
      isLoggedIn = false;
      return HttpResponse.json({ success: true, message: "Logged out" });
    }),
  );
  return calls;
}

async function openLogoutDialog(user: ReturnType<typeof userEvent.setup>) {
  const sidebar = await screen.findByRole("complementary");
  await user.click(within(sidebar).getByRole("button", { name: /^logout$/i }));
  return screen.findByRole("dialog", { name: /logout confirmation/i });
}

describe("sidebar navigation", () => {
  test("shows the logo, links and logout button with Messages active", async () => {
    mockSession();

    renderRoute("/");

    const sidebar = await screen.findByRole("complementary");
    expect(within(sidebar).getByText("messgr.")).toBeInTheDocument();
    const nav = within(sidebar).getByRole("navigation", { name: /main/i });
    expect(within(nav).getByRole("link", { name: /messages/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      within(sidebar).getByRole("button", { name: /^logout$/i }),
    ).toBeInTheDocument();
  });

  test("shows the account link with the user's name above a separator and the logout button", async () => {
    mockSession();

    renderRoute("/");

    const sidebar = await screen.findByRole("complementary");
    const accountLink = within(sidebar).getByRole("link", { name: /john doe/i });
    expect(accountLink).toHaveAttribute("href", "/profile");
    expect(accountLink).toHaveTextContent("My account");
    expect(accountLink).toHaveTextContent("JD");
    expect(accountLink).not.toHaveAttribute("aria-current");
    const nav = within(sidebar).getByRole("navigation", { name: /main/i });
    expect(nav).not.toContainElement(accountLink);

    const separator = within(sidebar).getByRole("separator");
    const logoutButton = within(sidebar).getByRole("button", {
      name: /^logout$/i,
    });
    expect(
      accountLink.compareDocumentPosition(separator) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      separator.compareDocumentPosition(logoutButton) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  test("lists Contacts between Messages and Archive", async () => {
    mockSession();

    renderRoute("/");

    const nav = await screen.findByRole("navigation", { name: /main/i });
    const labels = within(nav)
      .getAllByRole("link")
      .map((link) => link.textContent);
    expect(labels).toEqual(["Messages", "Contacts", "Archive"]);
  });

  test("navigates to the archive page and marks only Archive as active", async () => {
    mockSession();
    server.use(
      http.get(`${API_URL}/conversations/archived`, () =>
        HttpResponse.json({ success: true, data: [] }),
      ),
    );
    const user = userEvent.setup();
    const { router } = renderRoute("/");

    await user.click(await screen.findByRole("link", { name: /archive/i }));

    expect(
      await screen.findByRole("heading", { name: /^archive$/i }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/archive");
    expect(screen.getByRole("link", { name: /archive/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("link", { name: /messages/i }),
    ).not.toHaveAttribute("aria-current");
  });

  test("navigates to the profile page and marks the account link as active", async () => {
    mockSession();
    const user = userEvent.setup();
    const { router } = renderRoute("/");

    await user.click(await screen.findByRole("link", { name: /john doe/i }));

    expect(
      await screen.findByRole("region", { name: /^profile$/i }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/profile");
    expect(screen.getByRole("link", { name: /john doe/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("link", { name: /messages/i }),
    ).not.toHaveAttribute("aria-current");
  });

  test("shows the total unread count on the Messages link", async () => {
    mockSession();
    server.use(unreadCountHandler(() => 7));

    renderRoute("/profile");

    const messagesLink = await screen.findByRole("link", {
      name: /^messages/i,
    });
    expect(
      await within(messagesLink).findByText("7 unread messages"),
    ).toBeInTheDocument();
    expect(within(messagesLink).getByText("7")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /john doe/i }),
    ).not.toHaveTextContent(/unread/i);
  });

  test("hides the unread badge when nothing is unread", async () => {
    mockSession();

    renderRoute("/profile");

    const nav = await screen.findByRole("navigation", { name: /main/i });
    expect(within(nav).getByRole("link", { name: "Messages" })).toBeVisible();
    expect(within(nav).queryByText(/unread/i)).not.toBeInTheDocument();
  });

  test("asks for confirmation before logging out", async () => {
    const calls = mockSession();
    const user = userEvent.setup();
    const { router } = renderRoute("/");

    const dialog = await openLogoutDialog(user);

    expect(dialog).toHaveAccessibleDescription(
      "Are you sure you want to logout?",
    );
    expect(router.state.location.pathname).toBe("/conversations");
    expect(calls.logout).toBe(0);
  });

  test("cancelling keeps the user logged in", async () => {
    const calls = mockSession();
    const user = userEvent.setup();
    const { router } = renderRoute("/");

    const dialog = await openLogoutDialog(user);
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("complementary")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/conversations");
    expect(calls.logout).toBe(0);
  });

  test("logs out after confirming and shows the login form", async () => {
    const calls = mockSession();
    const user = userEvent.setup();
    const { router } = renderRoute("/");

    const dialog = await openLogoutDialog(user);
    await user.click(within(dialog).getByRole("button", { name: /^logout$/i }));

    expect(
      await screen.findByRole("heading", { name: /log in/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /create an account/i }),
    ).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/login");
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
    expect(calls.logout).toBe(1);
    expect(await findToast("You've been logged out")).toBeInTheDocument();
  });

  test("shows an error and stays put when logout fails", async () => {
    mockSession(500);
    const user = userEvent.setup();
    const { router } = renderRoute("/");

    const dialog = await openLogoutDialog(user);
    await user.click(within(dialog).getByRole("button", { name: /^logout$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /couldn't log out/i,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/conversations");
    expect(
      within(screen.getByRole("complementary")).getByRole("button", {
        name: /^logout$/i,
      }),
    ).toBeEnabled();
  });
});
