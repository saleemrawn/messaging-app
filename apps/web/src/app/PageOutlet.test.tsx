import { describe, expect, test } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { API_URL, holdRequest, server } from "../test/server.ts";
import { renderRoute } from "../test/render-route.tsx";
import { PENDING_INDICATOR_DELAY_MS } from "../shared/hooks/use-pending-pathname.ts";
import type {
  ConversationDetail,
  ConversationSummary,
} from "../features/conversations/types.ts";

const currentUser = {
  id: 1,
  username: "johndoe01",
  firstName: "John",
  lastName: "Doe",
  email: "john.doe01@email.com",
  avatarUrl: null,
};

const aisha = {
  id: 2,
  firstName: "Aisha",
  lastName: "Khan",
  email: "aisha.khan@email.com",
  avatarUrl: null,
};

const conversation: ConversationDetail = {
  id: 1,
  updatedAt: new Date().toISOString(),
  recipient: aisha,
  messages: [],
};

const summary: ConversationSummary = {
  id: 1,
  updatedAt: conversation.updatedAt,
  unreadCount: 0,
  recipient: aisha,
  latestMessage: null,
};

function mockApi() {
  server.use(
    http.get(`${API_URL}/auth/me`, () =>
      HttpResponse.json({ success: true, data: currentUser }),
    ),
    http.get(`${API_URL}/conversations`, () =>
      HttpResponse.json({ success: true, data: [summary] }),
    ),
    http.post(`${API_URL}/conversations`, () =>
      HttpResponse.json({ success: true, data: { id: 1 } }, { status: 201 }),
    ),
    http.get(`${API_URL}/conversations/archived`, () =>
      HttpResponse.json({ success: true, data: [] }),
    ),
    http.get(`${API_URL}/conversations/unread-count`, () =>
      HttpResponse.json({ success: true, data: { unreadCount: 0 } }),
    ),
    http.get(`${API_URL}/conversations/1`, () =>
      HttpResponse.json({ success: true, data: conversation }),
    ),
    http.post(`${API_URL}/conversations/1/messages/receipts`, () =>
      HttpResponse.json({ success: true, data: [] }, { status: 201 }),
    ),
    http.get(`${API_URL}/contacts`, () =>
      HttpResponse.json({ success: true, data: [aisha] }),
    ),
  );
}

function clickNavLink(
  user: ReturnType<typeof userEvent.setup>,
  name: string,
) {
  const nav = screen.getByRole("navigation", { name: "Main" });
  return user.click(within(nav).getByRole("link", { name }));
}

describe("page skeletons while navigating", () => {
  test("shows the contacts skeleton while the contacts load", async () => {
    mockApi();
    const user = userEvent.setup();
    renderRoute("/conversations/1");
    await screen.findByRole("heading", { level: 2, name: "Aisha Khan" });
    const release = holdRequest("get", "/contacts");

    await clickNavLink(user, "Contacts");

    expect(
      await screen.findByRole("status", { name: "Loading contacts" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { level: 2, name: "Aisha Khan" }),
    ).not.toBeInTheDocument();

    release();

    expect(
      await screen.findByRole("list", { name: "Contacts" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  test("shows the archive skeleton while archived conversations load", async () => {
    mockApi();
    const user = userEvent.setup();
    renderRoute("/conversations/1");
    await screen.findByRole("heading", { level: 2, name: "Aisha Khan" });
    const release = holdRequest("get", "/conversations/archived");

    await clickNavLink(user, "Archive");

    expect(
      await screen.findByRole("status", {
        name: "Loading archived conversations",
      }),
    ).toBeInTheDocument();

    release();

    expect(
      await screen.findByText("No archived conversations"),
    ).toBeInTheDocument();
  });

  test("shows the messages skeleton while a contact's conversation opens", async () => {
    mockApi();
    const user = userEvent.setup();
    renderRoute("/contacts");
    await screen.findByRole("list", { name: "Contacts" });
    const release = holdRequest("get", "/conversations/1");

    await user.click(screen.getByRole("button", { name: "Message Aisha Khan" }));

    expect(
      await screen.findByRole("status", { name: "Loading conversation" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: "Loading conversations" }),
    ).toBeInTheDocument();

    release();

    expect(
      await screen.findByRole("heading", { level: 2, name: "Aisha Khan" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  test("keeps the current page while one without data of its own loads", async () => {
    mockApi();
    const user = userEvent.setup();
    renderRoute("/contacts");
    await screen.findByRole("list", { name: "Contacts" });
    const release = holdRequest("get", "/conversations/unread-count");

    await user.click(screen.getByRole("link", { name: /my account/i }));
    await new Promise((resolve) =>
      setTimeout(resolve, PENDING_INDICATOR_DELAY_MS * 2),
    );

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Contacts" })).toBeInTheDocument();

    release();
  });
});

describe("first load", () => {
  test("shows a loading screen until the session check finishes", async () => {
    mockApi();
    const release = holdRequest("get", "/auth/me");

    renderRoute("/conversations");

    expect(
      await screen.findByRole("status", { name: "Loading" }),
    ).toBeInTheDocument();

    release();

    expect(
      await screen.findByRole("heading", { level: 2, name: "Aisha Khan" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
