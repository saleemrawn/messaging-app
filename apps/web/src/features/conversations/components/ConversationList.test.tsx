import { describe, expect, test } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import {
  API_URL,
  server,
  unreadCountHandler,
} from "../../../test/server.ts";
import { renderRoute } from "../../../test/render-route.tsx";
import type { ConversationSummary } from "../types.ts";

const currentUser = {
  id: 1,
  username: "johndoe01",
  firstName: "John",
  lastName: "Doe",
  email: "john.doe01@email.com",
};

function todayAt(hours: number, minutes: number): string {
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

function yesterdayAtNoon(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  date.setHours(12, 0, 0, 0);
  return date.toISOString();
}

// Newest first, as the API returns them
const conversations: ConversationSummary[] = [
  {
    id: 2,
    updatedAt: todayAt(10, 0),
    unreadCount: 3,
    recipient: { id: 3, firstName: "Phillipe", lastName: "Doe" },
    latestMessage: {
      id: 4,
      content: "Are we still on for tomorrow?",
      createdAt: todayAt(10, 0),
      senderId: 3,
    },
  },
  {
    id: 1,
    updatedAt: yesterdayAtNoon(),
    unreadCount: 0,
    recipient: { id: 2, firstName: "Aisha", lastName: "Khan" },
    latestMessage: {
      id: 2,
      content: "See you then",
      createdAt: yesterdayAtNoon(),
      senderId: 1,
    },
  },
  {
    id: 3,
    updatedAt: new Date(2023, 5, 12, 9, 0).toISOString(),
    unreadCount: 1,
    recipient: { id: 4, firstName: "Jane", lastName: "Smith" },
    latestMessage: null,
  },
];

function mockApi({
  list = conversations,
  status = 200,
}: { list?: ConversationSummary[]; status?: number } = {}) {
  server.use(
    http.get(`${API_URL}/auth/me`, () =>
      HttpResponse.json({ success: true, data: currentUser }),
    ),
    http.get(`${API_URL}/conversations`, () =>
      status === 200
        ? HttpResponse.json({ success: true, data: list })
        : HttpResponse.json({ success: false }, { status }),
    ),
    unreadCountHandler(),
    // The newest conversation opens in the viewer. These tests only cover the
    // list, so the list above stays static even after it is marked read.
    http.get(`${API_URL}/conversations/:id`, ({ params }) => {
      const summary = list.find(({ id }) => id === Number(params.id));
      return summary
        ? HttpResponse.json({
            success: true,
            data: {
              id: summary.id,
              updatedAt: summary.updatedAt,
              recipient: summary.recipient,
              messages: [],
            },
          })
        : HttpResponse.json({ success: false }, { status: 404 });
    }),
    http.post(`${API_URL}/conversations/:id/messages/receipts`, () =>
      HttpResponse.json({ success: true, data: [] }, { status: 201 }),
    ),
  );
}

async function findRows() {
  const panel = await screen.findByRole("tabpanel");
  return within(panel).queryAllByRole("listitem");
}

describe("conversation list", () => {
  test("shows the heading and tabs with All messages selected", async () => {
    mockApi();

    renderRoute("/");

    expect(
      await screen.findByRole("heading", { name: /^messages$/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /all messages/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: /unread/i })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  test("links each row to its conversation", async () => {
    mockApi();

    renderRoute("/");

    const [phillipe, aisha] = await findRows();
    expect(within(phillipe).getByRole("link")).toHaveAttribute(
      "href",
      "/conversations/2",
    );
    expect(within(aisha).getByRole("link")).toHaveAttribute(
      "href",
      "/conversations/1",
    );
  });

  test("lists every conversation newest first", async () => {
    mockApi();

    renderRoute("/");

    const rows = await findRows();
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent("Phillipe Doe");
    expect(rows[1]).toHaveTextContent("Aisha Khan");
    expect(rows[2]).toHaveTextContent("Jane Smith");
  });

  test("shows initials, full name and a prefixed message preview", async () => {
    mockApi();

    renderRoute("/");

    const [phillipe, aisha] = await findRows();
    expect(within(phillipe).getByText("PD")).toBeInTheDocument();
    expect(within(phillipe).getByText("Phillipe Doe")).toBeInTheDocument();
    expect(
      within(phillipe).getByText("Phillipe: Are we still on for tomorrow?"),
    ).toBeInTheDocument();
    expect(within(aisha).getByText("AK")).toBeInTheDocument();
    expect(within(aisha).getByText("You: See you then")).toBeInTheDocument();
  });

  test("formats timestamps for today, yesterday and older", async () => {
    mockApi();

    renderRoute("/");

    const [phillipe, aisha, jane] = await findRows();
    expect(within(phillipe).getByText("10:00 AM")).toBeInTheDocument();
    expect(within(aisha).getByText("Yesterday")).toBeInTheDocument();
    expect(within(jane).getByText("Mon 12th Jun")).toBeInTheDocument();
  });

  test("shows the unread badge only when there are unread messages", async () => {
    mockApi();

    renderRoute("/");

    const [phillipe, aisha, jane] = await findRows();
    expect(within(phillipe).getByText("3 unread messages")).toBeInTheDocument();
    expect(within(jane).getByText("1 unread message")).toBeInTheDocument();
    expect(within(aisha).queryByText(/unread/i)).not.toBeInTheDocument();
  });

  test("filters to unread conversations on the Unread tab", async () => {
    mockApi();
    const user = userEvent.setup();
    renderRoute("/");

    await user.click(await screen.findByRole("tab", { name: /unread/i }));

    expect(screen.getByRole("tab", { name: /unread/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    const rows = await findRows();
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("Phillipe Doe");
    expect(rows[1]).toHaveTextContent("Jane Smith");

    await user.click(screen.getByRole("tab", { name: /all messages/i }));

    expect(await findRows()).toHaveLength(3);
  });

  test("shows an empty state when there are no conversations", async () => {
    mockApi({ list: [] });

    renderRoute("/");

    expect(
      await screen.findByText(/no conversations yet/i),
    ).toBeInTheDocument();
  });

  test("shows an empty state when nothing is unread", async () => {
    mockApi({ list: [conversations[1]] });
    const user = userEvent.setup();
    renderRoute("/");

    await user.click(await screen.findByRole("tab", { name: /unread/i }));

    expect(screen.getByText(/no unread conversations/i)).toBeInTheDocument();
  });

  test("shows the error page when conversations fail to load", async () => {
    mockApi({ status: 500 });

    renderRoute("/");

    expect(
      await screen.findByRole("heading", { name: /something went wrong/i }),
    ).toBeInTheDocument();
  });

  test("redirects to login when the conversations request is unauthorized", async () => {
    server.use(
      http.get(`${API_URL}/auth/me`, () =>
        HttpResponse.json({ success: false }, { status: 401 }),
      ),
      http.get(`${API_URL}/conversations`, () =>
        HttpResponse.json({ success: false }, { status: 401 }),
      ),
    );

    const { router } = renderRoute("/");

    expect(
      await screen.findByRole("heading", { name: /create an account/i }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/login");
  });
});
