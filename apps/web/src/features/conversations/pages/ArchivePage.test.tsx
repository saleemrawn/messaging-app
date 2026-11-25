import { describe, expect, test } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { API_URL, server, unreadCountHandler } from "../../../test/server.ts";
import { renderRoute } from "../../../test/render-route.tsx";
import type { ConversationSummary } from "../types.ts";

const currentUser = {
  id: 1,
  username: "johndoe01",
  firstName: "John",
  lastName: "Doe",
  email: "john.doe01@email.com",
};

const LONG_MESSAGE =
  "This is a very long message that keeps going well past the width of a single row in the archive list";

function todayAt(hours: number, minutes: number): string {
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

function buildArchived(): ConversationSummary[] {
  return [
    {
      id: 2,
      updatedAt: todayAt(10, 5),
      unreadCount: 0,
      recipient: { id: 3, firstName: "Phillipe", lastName: "Doe" },
      latestMessage: {
        id: 4,
        content: LONG_MESSAGE,
        createdAt: todayAt(10, 5),
        senderId: 3,
      },
    },
    {
      id: 1,
      updatedAt: todayAt(9, 0),
      unreadCount: 0,
      recipient: { id: 2, firstName: "Aisha", lastName: "Doe" },
      latestMessage: {
        id: 2,
        content: "See you soon",
        createdAt: todayAt(9, 0),
        senderId: 1,
      },
    },
  ];
}

interface MockApiOptions {
  archived?: ConversationSummary[];
  unarchiveStatus?: number;
}

// An in-memory archive: a successful unarchive removes the conversation, like
// the real API.
function mockApi({
  archived = buildArchived(),
  unarchiveStatus = 200,
}: MockApiOptions = {}) {
  let current = archived;
  const unarchiveRequests: number[] = [];
  let unreadCountRequests = 0;

  server.use(
    http.get(`${API_URL}/auth/me`, () =>
      HttpResponse.json({ success: true, data: currentUser }),
    ),
    unreadCountHandler(() => {
      unreadCountRequests += 1;
      return 0;
    }),
    http.get(`${API_URL}/conversations/archived`, () =>
      HttpResponse.json({ success: true, data: current }),
    ),
    http.post(`${API_URL}/conversations/:id/unarchive`, ({ params }) => {
      const id = Number(params.id);
      unarchiveRequests.push(id);
      if (unarchiveStatus !== 200) {
        return HttpResponse.json(
          { success: false, message: "Something went wrong" },
          { status: unarchiveStatus },
        );
      }
      current = current.filter((conversation) => conversation.id !== id);
      return HttpResponse.json({ success: true, data: { id } });
    }),
  );

  return {
    unarchiveRequests,
    getUnreadCountRequests: () => unreadCountRequests,
  };
}

async function findArchiveList() {
  return within(
    await screen.findByRole("list", { name: /archived conversations/i }),
  );
}

describe("archive page", () => {
  test("lists archived conversations with avatar, name, preview and time", async () => {
    mockApi();

    renderRoute("/archive");

    expect(
      await screen.findByRole("heading", { name: /^archive$/i }),
    ).toBeInTheDocument();
    const list = await findArchiveList();
    const rows = list.getAllByRole("listitem");
    expect(rows).toHaveLength(2);

    const phillipe = within(rows[0]);
    expect(phillipe.getByText("PD")).toBeInTheDocument();
    expect(phillipe.getByText("Phillipe Doe")).toBeInTheDocument();
    const preview = phillipe.getByText(`Phillipe: ${LONG_MESSAGE}`);
    // Long previews are cut to one line with an ellipsis.
    expect(preview).toHaveClass("truncate");
    expect(phillipe.getByText("10:05 AM")).toHaveAttribute(
      "datetime",
      todayAt(10, 5),
    );

    const aisha = within(rows[1]);
    expect(aisha.getByText("Aisha Doe")).toBeInTheDocument();
    expect(aisha.getByText("You: See you soon")).toBeInTheDocument();
    expect(aisha.getByText("9:00 AM")).toBeInTheDocument();
  });

  test("rows aren't links to the conversation", async () => {
    mockApi();

    renderRoute("/archive");

    const list = await findArchiveList();
    expect(list.queryAllByRole("link")).toHaveLength(0);
  });

  test("shows an empty state when nothing is archived", async () => {
    mockApi({ archived: [] });

    renderRoute("/archive");

    expect(
      await screen.findByText("No archived conversations"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("list", { name: /archived conversations/i }),
    ).not.toBeInTheDocument();
  });

  test("unarchives a conversation and removes it from the list", async () => {
    const api = mockApi();
    const user = userEvent.setup();
    renderRoute("/archive");

    await user.click(
      await screen.findByRole("button", {
        name: "Unarchive conversation with Phillipe Doe",
      }),
    );

    await waitFor(() => {
      expect(screen.queryByText("Phillipe Doe")).not.toBeInTheDocument();
    });
    expect(api.unarchiveRequests).toEqual([2]);
    expect(screen.getByText("Aisha Doe")).toBeInTheDocument();
    // The sidebar's unread total is refreshed, since the conversation's
    // messages count again once it's back in the Messages list.
    expect(api.getUnreadCountRequests()).toBeGreaterThan(1);
  });

  test("shows an error and keeps the row when unarchiving fails", async () => {
    mockApi({ unarchiveStatus: 500 });
    const user = userEvent.setup();
    renderRoute("/archive");

    await user.click(
      await screen.findByRole("button", {
        name: "Unarchive conversation with Aisha Doe",
      }),
    );

    expect(
      await screen.findByText(
        "Couldn't unarchive the conversation. Please try again.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Aisha Doe")).toBeInTheDocument();
  });

  test("redirects to login when the session has expired", async () => {
    let isLoggedIn = true;
    server.use(
      http.get(`${API_URL}/auth/me`, () =>
        isLoggedIn
          ? HttpResponse.json({ success: true, data: currentUser })
          : HttpResponse.json({ success: false }, { status: 401 }),
      ),
      http.get(`${API_URL}/conversations/archived`, () => {
        isLoggedIn = false;
        return HttpResponse.json({ success: false }, { status: 401 });
      }),
    );

    const { router } = renderRoute("/archive");

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/login");
    });
  });
});
