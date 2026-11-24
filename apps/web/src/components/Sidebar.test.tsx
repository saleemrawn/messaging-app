import { describe, expect, test } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { API_URL, server } from "../test/server.ts";
import { renderRoute } from "../test/render-route.tsx";

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
  server.use(
    http.get(`${API_URL}/auth/me`, () =>
      isLoggedIn
        ? HttpResponse.json({ success: true, data: currentUser })
        : HttpResponse.json({ success: false }, { status: 401 }),
    ),
    http.post(`${API_URL}/auth/logout`, () => {
      if (logoutStatus !== 200) {
        return HttpResponse.json({ success: false }, { status: logoutStatus });
      }
      isLoggedIn = false;
      return HttpResponse.json({ success: true, message: "Logged out" });
    }),
  );
}

describe("sidebar navigation", () => {
  test("shows the logo, links and logout button with Messages active", async () => {
    mockSession();

    renderRoute("/");

    const sidebar = await screen.findByRole("complementary");
    expect(within(sidebar).getByText("Messenger")).toBeInTheDocument();
    const nav = within(sidebar).getByRole("navigation", { name: /main/i });
    expect(within(nav).getByRole("link", { name: /messages/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      within(nav).getByRole("link", { name: /profile/i }),
    ).not.toHaveAttribute("aria-current");
    expect(
      within(sidebar).getByRole("button", { name: /log out/i }),
    ).toBeInTheDocument();
  });

  test("navigates to the profile page and marks Profile as active", async () => {
    mockSession();
    const user = userEvent.setup();
    const { router } = renderRoute("/");

    await user.click(await screen.findByRole("link", { name: /profile/i }));

    expect(
      await screen.findByRole("heading", { name: /^profile$/i }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/profile");
    expect(screen.getByRole("link", { name: /profile/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("link", { name: /messages/i }),
    ).not.toHaveAttribute("aria-current");
  });

  test("logs out and shows the sign-up form", async () => {
    mockSession();
    const user = userEvent.setup();
    const { router } = renderRoute("/");

    await user.click(await screen.findByRole("button", { name: /log out/i }));

    expect(
      await screen.findByRole("heading", { name: /create an account/i }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/login");
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  });

  test("shows an error and stays put when logout fails", async () => {
    mockSession(500);
    const user = userEvent.setup();
    const { router } = renderRoute("/");

    await user.click(await screen.findByRole("button", { name: /log out/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /couldn't log out/i,
    );
    expect(router.state.location.pathname).toBe("/conversations");
    expect(screen.getByRole("button", { name: /log out/i })).toBeEnabled();
  });
});
