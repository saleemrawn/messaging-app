import { afterEach, describe, expect, test, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import {
  API_URL,
  server,
  unreadCountHandler,
} from "../../../test/server.ts";
import { renderRoute } from "../../../test/render-route.tsx";
import type {
  ConversationDetail,
  ConversationMessage,
  ConversationSummary,
} from "../types.ts";

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

// Conversation 2 (with Phillipe) is the newest; conversation 1 (with Aisha) is older.
function buildConversations(): ConversationDetail[] {
  return [
    {
      id: 2,
      updatedAt: todayAt(10, 10),
      recipient: { id: 3, firstName: "Phillipe", lastName: "Doe" },
      messages: [
        {
          id: 3,
          content: "Dinner tomorrow?",
          createdAt: todayAt(10, 0),
          senderId: 1,
          readAt: todayAt(10, 1),
        },
        {
          id: 4,
          content: "Are we still on for tomorrow?",
          createdAt: todayAt(10, 5),
          senderId: 3,
          readAt: null,
        },
        {
          id: 5,
          content: "Yes, 7pm",
          createdAt: todayAt(10, 10),
          senderId: 1,
          readAt: null,
        },
      ],
    },
    {
      id: 1,
      updatedAt: todayAt(9, 0),
      recipient: { id: 2, firstName: "Aisha", lastName: "Khan" },
      messages: [
        {
          id: 1,
          content: "Hi John",
          createdAt: todayAt(9, 0),
          senderId: 2,
          readAt: null,
        },
      ],
    },
  ];
}

interface MockApiOptions {
  conversations?: ConversationDetail[];
  sendStatus?: number;
}

// A small in-memory backend: receipts clear the unread count and sending
// appends a message and moves its conversation to the top, like the real API.
function mockApi({
  conversations = buildConversations(),
  sendStatus = 201,
}: MockApiOptions = {}) {
  let details = conversations;
  const unreadCounts = new Map<number, number>([
    [2, 1],
    [1, 1],
  ]);
  const receiptRequests: number[] = [];
  const sentBodies: unknown[] = [];

  const toSummary = (detail: ConversationDetail): ConversationSummary => {
    const latest = detail.messages.at(-1);
    return {
      id: detail.id,
      updatedAt: detail.updatedAt,
      unreadCount: unreadCounts.get(detail.id) ?? 0,
      recipient: detail.recipient,
      latestMessage: latest
        ? {
            id: latest.id,
            content: latest.content,
            createdAt: latest.createdAt,
            senderId: latest.senderId,
          }
        : null,
    };
  };

  const notFound = () =>
    HttpResponse.json(
      { success: false, message: "Conversation not found" },
      { status: 404 },
    );

  server.use(
    http.get(`${API_URL}/auth/me`, () =>
      HttpResponse.json({ success: true, data: currentUser }),
    ),
    http.get(`${API_URL}/conversations`, () =>
      HttpResponse.json({ success: true, data: details.map(toSummary) }),
    ),
    unreadCountHandler(() =>
      [...unreadCounts.values()].reduce((sum, count) => sum + count, 0),
    ),
    http.get(`${API_URL}/conversations/:id`, ({ params }) => {
      const detail = details.find(({ id }) => id === Number(params.id));
      return detail
        ? HttpResponse.json({ success: true, data: detail })
        : notFound();
    }),
    http.post(
      `${API_URL}/conversations/:id/messages/receipts`,
      ({ params }) => {
        const id = Number(params.id);
        receiptRequests.push(id);
        if (!details.some((detail) => detail.id === id)) return notFound();
        unreadCounts.set(id, 0);
        return HttpResponse.json({ success: true, data: [] }, { status: 201 });
      },
    ),
    http.post(
      `${API_URL}/conversations/:id/messages`,
      async ({ params, request }) => {
        const body = (await request.json()) as { content: string };
        sentBodies.push(body);
        if (sendStatus !== 201) {
          return HttpResponse.json(
            { success: false, message: "Could not send" },
            { status: sendStatus },
          );
        }

        const id = Number(params.id);
        const now = new Date().toISOString();
        const message: ConversationMessage = {
          id: 100 + sentBodies.length,
          content: body.content,
          createdAt: now,
          senderId: currentUser.id,
          readAt: null,
        };
        const target = details.find((detail) => detail.id === id);
        if (!target) return notFound();
        const updated = {
          ...target,
          updatedAt: now,
          messages: [...target.messages, message],
        };
        details = [updated, ...details.filter((detail) => detail.id !== id)];
        return HttpResponse.json(
          { success: true, data: { id } },
          { status: 201 },
        );
      },
    ),
  );

  return { receiptRequests, sentBodies };
}

async function findViewerHeading(name: string) {
  return screen.findByRole("heading", { level: 2, name });
}

function getMessageItems() {
  return within(screen.getByRole("log", { name: /^messages$/i })).getAllByRole(
    "listitem",
  );
}

function getConversationRow(name: string) {
  const panel = screen.getByRole("tabpanel");
  const row = within(panel)
    .getAllByRole("listitem")
    .find((item) => item.textContent.includes(name));
  if (!row) throw new Error(`No conversation row for ${name}`);
  return row;
}

describe("conversation viewer", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("opens the newest conversation by default", async () => {
    mockApi();

    const { router } = renderRoute("/");

    expect(await findViewerHeading("Phillipe Doe")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/conversations/2");
    expect(
      within(getConversationRow("Phillipe Doe")).getByRole("link"),
    ).toHaveAttribute("aria-current", "page");
  });

  test("lists messages oldest to newest", async () => {
    mockApi();

    renderRoute("/");
    await findViewerHeading("Phillipe Doe");

    const items = getMessageItems();
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent("Dinner tomorrow?");
    expect(items[1]).toHaveTextContent("Are we still on for tomorrow?");
    expect(items[2]).toHaveTextContent("Yes, 7pm");
  });

  test("marks the opened conversation as read", async () => {
    const { receiptRequests } = mockApi();

    renderRoute("/");
    await findViewerHeading("Phillipe Doe");

    expect(receiptRequests).toEqual([2]);
    expect(
      within(getConversationRow("Phillipe Doe")).queryByText(/unread/i),
    ).not.toBeInTheDocument();
    expect(
      within(getConversationRow("Aisha Khan")).getByText("1 unread message"),
    ).toBeInTheDocument();
  });

  test("switches conversation when another one is clicked and marks it read", async () => {
    const { receiptRequests } = mockApi();
    const user = userEvent.setup();
    const { router } = renderRoute("/");
    await findViewerHeading("Phillipe Doe");

    await user.click(
      within(getConversationRow("Aisha Khan")).getByRole("link"),
    );

    expect(await findViewerHeading("Aisha Khan")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/conversations/1");
    expect(getMessageItems()[0]).toHaveTextContent("Hi John");
    expect(receiptRequests).toEqual([2, 1]);
    expect(
      within(getConversationRow("Aisha Khan")).queryByText(/unread/i),
    ).not.toBeInTheDocument();
  });

  test("updates the nav unread total as conversations are read", async () => {
    mockApi();
    const user = userEvent.setup();
    renderRoute("/");
    await findViewerHeading("Phillipe Doe");
    const nav = screen.getByRole("navigation", { name: /main/i });
    const messagesLink = within(nav).getByRole("link", { name: /^messages/i });

    // Phillipe's conversation was read on open, leaving Aisha's one message.
    expect(
      within(messagesLink).getByText("1 unread message"),
    ).toBeInTheDocument();

    await user.click(
      within(getConversationRow("Aisha Khan")).getByRole("link"),
    );
    await findViewerHeading("Aisha Khan");

    expect(within(nav).queryByText(/unread/i)).not.toBeInTheDocument();
  });

  test("keeps the nav unread total current after leaving the messages page", async () => {
    mockApi();
    const user = userEvent.setup();
    renderRoute("/");
    await findViewerHeading("Phillipe Doe");
    await user.click(
      within(getConversationRow("Aisha Khan")).getByRole("link"),
    );
    await findViewerHeading("Aisha Khan");

    await user.click(screen.getByRole("link", { name: /profile/i }));

    expect(
      await screen.findByRole("heading", { name: /^profile$/i }),
    ).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: /main/i });
    expect(within(nav).queryByText(/unread/i)).not.toBeInTheDocument();
  });

  test("shows the recipient's avatar, name, message and time on received messages", async () => {
    mockApi();

    renderRoute("/");
    await findViewerHeading("Phillipe Doe");

    const received = getMessageItems()[1];
    expect(within(received).getByText("PD")).toBeInTheDocument();
    expect(within(received).getByText("Phillipe Doe")).toBeInTheDocument();
    expect(
      within(received).getByText("Are we still on for tomorrow?"),
    ).toBeInTheDocument();
    expect(within(received).getByText("10:05 AM")).toBeInTheDocument();
    expect(within(received).queryByText("Read")).not.toBeInTheDocument();
  });

  test("keeps a conversation on the Unread tab after opening it from there", async () => {
    mockApi();
    const user = userEvent.setup();
    renderRoute("/");
    await findViewerHeading("Phillipe Doe");

    // Phillipe's conversation was read on open, so only Aisha's is unread.
    await user.click(screen.getByRole("tab", { name: /unread/i }));
    expect(
      within(screen.getByRole("tabpanel")).getAllByRole("listitem"),
    ).toHaveLength(1);

    await user.click(
      within(getConversationRow("Aisha Khan")).getByRole("link"),
    );
    await findViewerHeading("Aisha Khan");

    const rows = within(screen.getByRole("tabpanel")).getAllByRole("listitem");
    expect(rows).toHaveLength(1);
    expect(within(rows[0]).getByRole("link")).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(within(rows[0]).queryByText(/unread/i)).not.toBeInTheDocument();
  });

  test("labels sent messages as yours for screen readers", async () => {
    mockApi();

    renderRoute("/");
    await findViewerHeading("Phillipe Doe");

    expect(getMessageItems()[0]).toHaveTextContent(/^You: Dinner tomorrow\?/);
  });

  test("shows Read on sent messages only once the recipient has read them", async () => {
    mockApi();

    renderRoute("/");
    await findViewerHeading("Phillipe Doe");

    const [read, , unread] = getMessageItems();
    expect(within(read).getByText("10:00 AM")).toBeInTheDocument();
    expect(within(read).getByText("Read")).toBeInTheDocument();
    expect(within(read).queryByText("Phillipe Doe")).not.toBeInTheDocument();
    expect(within(unread).getByText("10:10 AM")).toBeInTheDocument();
    expect(within(unread).queryByText("Read")).not.toBeInTheDocument();
  });

  test("sends a message, clears the box and shows it in the conversation", async () => {
    const { sentBodies } = mockApi();
    const user = userEvent.setup();
    renderRoute("/");
    await findViewerHeading("Phillipe Doe");

    const textbox = screen.getByRole("textbox", { name: /^message$/i });
    await user.type(textbox, "  See you there  ");
    await user.click(screen.getByRole("button", { name: /^send$/i }));

    await waitFor(() => {
      expect(getMessageItems()).toHaveLength(4);
    });
    expect(getMessageItems()[3]).toHaveTextContent("See you there");
    expect(sentBodies).toEqual([{ content: "See you there", recipientId: 3 }]);
    expect(textbox).toHaveValue("");
    expect(textbox).toHaveFocus();
    expect(
      within(getConversationRow("Phillipe Doe")).getByText(
        "You: See you there",
      ),
    ).toBeInTheDocument();
  });

  test("does not send an empty message", async () => {
    const { sentBodies } = mockApi();
    const user = userEvent.setup();
    renderRoute("/");
    await findViewerHeading("Phillipe Doe");

    await user.type(screen.getByRole("textbox", { name: /^message$/i }), "   ");
    await user.click(screen.getByRole("button", { name: /^send$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /can't be empty/i,
    );
    expect(sentBodies).toEqual([]);
  });

  test("keeps the draft and shows an error when sending fails", async () => {
    mockApi({ sendStatus: 500 });
    const user = userEvent.setup();
    renderRoute("/");
    await findViewerHeading("Phillipe Doe");

    const textbox = screen.getByRole("textbox", { name: /^message$/i });
    await user.type(textbox, "Hello?");
    await user.click(screen.getByRole("button", { name: /^send$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not send",
    );
    expect(textbox).toHaveValue("Hello?");
    expect(textbox).toHaveAttribute("aria-invalid", "true");
    expect(textbox).toHaveAccessibleDescription("Could not send");
    expect(getMessageItems()).toHaveLength(3);
  });

  test("shows a placeholder when there are no conversations", async () => {
    mockApi({ conversations: [] });

    const { router } = renderRoute("/");

    expect(
      await screen.findByText(/no conversation selected/i),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/conversations");
    expect(
      screen.queryByRole("textbox", { name: /^message$/i }),
    ).not.toBeInTheDocument();
  });

  test("falls back to the newest conversation for an unknown id", async () => {
    mockApi();

    const { router } = renderRoute("/conversations/999");

    expect(await findViewerHeading("Phillipe Doe")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/conversations/2");
  });

  test("scrolls to the newest message when a conversation is selected", async () => {
    vi.spyOn(Element.prototype, "scrollHeight", "get").mockReturnValue(640);
    const setScrollTop = vi.spyOn(Element.prototype, "scrollTop", "set");
    mockApi();
    const user = userEvent.setup();
    renderRoute("/");
    await findViewerHeading("Phillipe Doe");

    expect(setScrollTop).toHaveBeenLastCalledWith(640);
    setScrollTop.mockClear();

    await user.click(
      within(getConversationRow("Aisha Khan")).getByRole("link"),
    );
    await findViewerHeading("Aisha Khan");

    expect(setScrollTop).toHaveBeenLastCalledWith(640);
  });
});
