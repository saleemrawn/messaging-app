import { describe, expect, test } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { API_URL, server } from "../test/server.ts";
import { renderRoute } from "../test/render-route.tsx";
import { setViewport } from "../test/media-query.ts";

const currentUser = {
  id: 1,
  username: "johndoe01",
  firstName: "John",
  lastName: "Doe",
  email: "john.doe01@email.com",
  avatarUrl: null,
};

function mockSession() {
  server.use(
    http.get(`${API_URL}/auth/me`, () =>
      HttpResponse.json({ success: true, data: currentUser }),
    ),
  );
}

async function openMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole("button", { name: "Open menu" }));
  return screen.findByRole("dialog", { name: "Menu" });
}

describe("app layout below desktop", () => {
  test("shows a top bar with the menu button left of the logo instead of the sidebar", async () => {
    setViewport("mobile");
    mockSession();

    renderRoute("/profile");

    const menuButton = await screen.findByRole("button", { name: "Open menu" });
    const topBar = screen.getByRole("banner");
    expect(topBar).toContainElement(menuButton);
    const logo = within(topBar).getByText("messgr.");
    expect(
      menuButton.compareDocumentPosition(logo) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("shows the menu button on a landscape tablet too", async () => {
    setViewport("tablet-landscape");
    mockSession();

    renderRoute("/profile");

    expect(
      await screen.findByRole("button", { name: "Open menu" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  });

  test("opens the sidebar in a drawer from the menu button", async () => {
    setViewport("mobile");
    mockSession();
    const user = userEvent.setup();
    renderRoute("/profile");

    const drawer = await openMenu(user);

    const sidebar = within(drawer).getByRole("complementary");
    expect(
      within(sidebar).getByRole("navigation", { name: /main/i }),
    ).toBeInTheDocument();
    expect(
      within(sidebar).getByRole("link", { name: /john doe/i }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      within(drawer).getByRole("button", { name: "Close menu" }),
    ).toHaveFocus();
  });

  test("closes the drawer after navigating from it", async () => {
    setViewport("mobile");
    mockSession();
    const user = userEvent.setup();
    const { router } = renderRoute("/profile");

    const drawer = await openMenu(user);
    await user.click(within(drawer).getByRole("link", { name: /^messages/i }));

    expect(
      await screen.findByRole("heading", { name: "Messages" }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/conversations");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("closes the drawer with its close button and returns focus to the menu button", async () => {
    setViewport("mobile");
    mockSession();
    const user = userEvent.setup();
    renderRoute("/profile");

    const drawer = await openMenu(user);
    await user.click(within(drawer).getByRole("button", { name: "Close menu" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open menu" })).toHaveFocus();
  });

  test("closes the drawer on Escape", async () => {
    setViewport("mobile");
    mockSession();
    const user = userEvent.setup();
    renderRoute("/profile");

    await openMenu(user);
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open menu" })).toHaveFocus();
  });

  test("opens the logout confirmation from the drawer", async () => {
    setViewport("mobile");
    mockSession();
    const user = userEvent.setup();
    renderRoute("/profile");

    const drawer = await openMenu(user);
    await user.click(within(drawer).getByRole("button", { name: /^logout$/i }));

    expect(
      await screen.findByRole("dialog", { name: /logout confirmation/i }),
    ).toBeInTheDocument();
  });
});

describe("app layout on desktop", () => {
  test("shows the sidebar and no menu button", async () => {
    mockSession();

    renderRoute("/profile");

    expect(await screen.findByRole("complementary")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Open menu" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("banner")).not.toBeInTheDocument();
  });
});
