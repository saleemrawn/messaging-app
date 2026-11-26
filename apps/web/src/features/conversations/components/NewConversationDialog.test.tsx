import { describe, expect, test } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { API_URL, server, unreadCountHandler } from "../../../test/server.ts";
import { renderRoute } from "../../../test/render-route.tsx";
import type {
  ConversationDetail,
  ConversationSummary,
  Recipient,
} from "../types.ts";

const currentUser = {
  id: 1,
  username: "johndoe01",
  firstName: "John",
  lastName: "Doe",
  email: "john.doe01@email.com",
};

const aisha: Recipient = {
  id: 2,
  firstName: "Aisha",
  lastName: "Khan",
  email: "aisha.khan@email.com",
};

const jane: Recipient = {
  id: 4,
  firstName: "Jane",
  lastName: "Smith",
  email: "jane.smith@email.com",
};

// Lets the dialog's debounce elapse before asserting that nothing was sent.
const PAST_DEBOUNCE_MS = 500;

interface MockApiOptions {
  createStatus?: number;
  contacts?: Recipient[];
  contactsStatus?: number;
}

function makeContacts(count: number): Recipient[] {
  return Array.from({ length: count }, (_, index) => ({
    id: 10 + index,
    firstName: "Contact",
    lastName: String(index + 1),
    email: `contact${String(index + 1)}@email.com`,
  }));
}

// An in-memory backend with one conversation (with Aisha). Lookup knows Aisha
// and Jane; creating a conversation prepends an empty one, like the real API.
// The saved contacts list is empty unless given.
function mockApi({
  createStatus = 201,
  contacts = [],
  contactsStatus = 200,
}: MockApiOptions = {}) {
  let details: ConversationDetail[] = [
    {
      id: 1,
      updatedAt: "2026-01-01T09:00:00.000Z",
      recipient: aisha,
      messages: [
        {
          id: 1,
          content: "Hi John",
          createdAt: "2026-01-01T09:00:00.000Z",
          senderId: aisha.id,
          readAt: null,
        },
      ],
    },
  ];
  const lookupEmails: string[] = [];
  const createBodies: unknown[] = [];

  const toSummary = (detail: ConversationDetail): ConversationSummary => {
    const latest = detail.messages.at(-1);
    return {
      id: detail.id,
      updatedAt: detail.updatedAt,
      unreadCount: 0,
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

  server.use(
    http.get(`${API_URL}/auth/me`, () =>
      HttpResponse.json({ success: true, data: currentUser }),
    ),
    http.get(`${API_URL}/conversations`, () =>
      HttpResponse.json({ success: true, data: details.map(toSummary) }),
    ),
    unreadCountHandler(),
    http.get(`${API_URL}/conversations/:id`, ({ params }) => {
      const detail = details.find(({ id }) => id === Number(params.id));
      return detail
        ? HttpResponse.json({ success: true, data: detail })
        : HttpResponse.json({ success: false }, { status: 404 });
    }),
    http.post(`${API_URL}/conversations/:id/messages/receipts`, () =>
      HttpResponse.json({ success: true, data: [] }, { status: 201 }),
    ),
    http.get(`${API_URL}/contacts`, () =>
      contactsStatus === 200
        ? HttpResponse.json({ success: true, data: contacts })
        : HttpResponse.json(
            { success: false, message: "Something broke" },
            { status: contactsStatus },
          ),
    ),
    http.get(`${API_URL}/users/lookup`, ({ request }) => {
      const email = new URL(request.url).searchParams.get("email") ?? "";
      lookupEmails.push(email);
      const found = [aisha, jane].find(
        (recipient) => recipient.email === email.toLowerCase(),
      );
      return found
        ? HttpResponse.json({ success: true, data: found })
        : HttpResponse.json(
            { success: false, message: "User not found" },
            { status: 404 },
          );
    }),
    http.post(`${API_URL}/conversations`, async ({ request }) => {
      const body = (await request.json()) as { recipientId: number };
      createBodies.push(body);
      if (createStatus !== 201) {
        return HttpResponse.json(
          { success: false, message: "Something broke" },
          { status: createStatus },
        );
      }
      const created: ConversationDetail = {
        id: 3,
        updatedAt: new Date().toISOString(),
        recipient: jane,
        messages: [],
      };
      details = [created, ...details];
      return HttpResponse.json(
        { success: true, data: { id: created.id } },
        { status: 201 },
      );
    }),
  );

  return { lookupEmails, createBodies };
}

async function openDialog() {
  const user = userEvent.setup();
  const rendered = renderRoute("/conversations/1");
  await screen.findByRole("heading", { level: 2, name: "Aisha Khan" });

  await user.click(screen.getByRole("button", { name: "New conversation" }));
  const dialog = screen.getByRole("dialog", { name: "New conversation" });
  return { user, dialog, ...rendered };
}

function getEmailInput(dialog: HTMLElement) {
  return within(dialog).getByLabelText("To");
}

async function findContactsSection(dialog: HTMLElement) {
  return within(dialog).findByRole("region", { name: "Contacts" });
}

interface ScrollMetrics {
  scrollTop: number;
  clientHeight: number;
  scrollHeight: number;
}

// jsdom has no layout, so scroll metrics are set by hand.
function scrollTo(
  element: HTMLElement,
  { scrollTop, clientHeight, scrollHeight }: ScrollMetrics,
) {
  Object.defineProperty(element, "clientHeight", {
    configurable: true,
    value: clientHeight,
  });
  Object.defineProperty(element, "scrollHeight", {
    configurable: true,
    value: scrollHeight,
  });
  element.scrollTop = scrollTop;
  fireEvent.scroll(element);
}

describe("new conversation dialog", () => {
  test("opens from the add button with the email field focused", async () => {
    mockApi();

    const { dialog } = await openDialog();

    expect(getEmailInput(dialog)).toHaveFocus();
    expect(
      within(dialog).getByText("Enter their full email address"),
    ).toBeInTheDocument();
  });

  test("closes from the close button and returns focus to the add button", async () => {
    mockApi();
    const { user, dialog } = await openDialog();

    await user.click(within(dialog).getByRole("button", { name: "Close" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "New conversation" }),
    ).toHaveFocus();
  });

  test("closes on Escape", async () => {
    mockApi();
    const { user } = await openDialog();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("doesn't look up an incomplete email address", async () => {
    const { lookupEmails } = mockApi();
    const { user, dialog } = await openDialog();

    await user.type(getEmailInput(dialog), "jane.smith@email");
    await new Promise((resolve) => setTimeout(resolve, PAST_DEBOUNCE_MS));

    expect(lookupEmails).toEqual([]);
    expect(
      within(dialog).getByText("Enter their full email address"),
    ).toBeInTheDocument();
  });

  test("says when no user has the email address", async () => {
    mockApi();
    const { user, dialog } = await openDialog();

    await user.type(getEmailInput(dialog), "nobody@email.com");

    expect(
      await within(dialog).findByText("No user found with that email address"),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByRole("list", { name: "Search results" }),
    ).not.toBeInTheDocument();
  });

  test("says when the email is the user's own, without looking it up", async () => {
    const { lookupEmails } = mockApi();
    const { user, dialog } = await openDialog();

    await user.type(getEmailInput(dialog), "John.Doe01@email.com");
    await new Promise((resolve) => setTimeout(resolve, PAST_DEBOUNCE_MS));

    expect(
      within(dialog).getByText("That's your own email address"),
    ).toBeInTheDocument();
    expect(lookupEmails).toEqual([]);
  });

  test("looks up only the finished address once typing pauses", async () => {
    const { lookupEmails } = mockApi();
    const { user, dialog } = await openDialog();

    await user.type(getEmailInput(dialog), "jane.smith@email.com");
    await within(dialog).findByRole("button", { name: /jane smith/i });

    expect(lookupEmails).toEqual(["jane.smith@email.com"]);
  });

  test("starts a conversation with the selected recipient and opens it", async () => {
    const { createBodies } = mockApi();
    const { user, dialog, router } = await openDialog();

    await user.type(getEmailInput(dialog), "jane.smith@email.com");
    const option = await within(dialog).findByRole("button", {
      name: /jane smith.*jane\.smith@email\.com.*start conversation/i,
    });
    await user.click(option);

    expect(
      await screen.findByRole("heading", { level: 2, name: "Jane Smith" }),
    ).toBeInTheDocument();
    expect(createBodies).toEqual([{ recipientId: 4 }]);
    expect(router.state.location.pathname).toBe("/conversations/3");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    const panel = screen.getByRole("tabpanel");
    const rows = within(panel).getAllByRole("listitem");
    expect(rows[0]).toHaveTextContent("Jane Smith");
    expect(rows[0]).toHaveTextContent("No messages yet");
    expect(screen.getByRole("textbox", { name: "Message" })).toHaveFocus();
  });

  test("starts the conversation when Enter is pressed on a found recipient", async () => {
    const { createBodies } = mockApi();
    const { user, dialog, router } = await openDialog();

    await user.type(getEmailInput(dialog), "jane.smith@email.com");
    await within(dialog).findByRole("button", { name: /jane smith/i });
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/conversations/3");
    });
    expect(createBodies).toEqual([{ recipientId: 4 }]);
  });

  test("opens the existing conversation instead of starting another", async () => {
    const { createBodies } = mockApi();
    const { user, dialog, router } = await openDialog();
    const { key: keyBefore } = router.state.location;

    await user.type(getEmailInput(dialog), "Aisha.Khan@email.com");
    await user.click(
      await within(dialog).findByRole("button", {
        name: /aisha khan.*message/i,
      }),
    );

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(router.state.location.pathname).toBe("/conversations/1");
    expect(router.state.location.key).not.toBe(keyBefore);
    expect(createBodies).toEqual([]);
  });

  test("shows an error and stays open when the conversation can't be created", async () => {
    mockApi({ createStatus: 500 });
    const { user, dialog, router } = await openDialog();

    await user.type(getEmailInput(dialog), "jane.smith@email.com");
    await user.click(
      await within(dialog).findByRole("button", { name: /jane smith/i }),
    );

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "Something broke",
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/conversations/1");
  });
});

describe("new conversation dialog contacts", () => {
  test("lists the saved contacts under the email field", async () => {
    mockApi({ contacts: [aisha, jane] });
    const { dialog } = await openDialog();

    const section = await findContactsSection(dialog);
    const options = await within(section).findAllByRole("button");

    expect(options).toHaveLength(2);
    expect(options[0]).toHaveAccessibleName(
      /aisha khan.*aisha\.khan@email\.com.*message/i,
    );
    expect(options[1]).toHaveAccessibleName(
      /jane smith.*jane\.smith@email\.com.*start conversation/i,
    );
    expect(
      getEmailInput(dialog).compareDocumentPosition(section) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  test("opens the existing conversation with a contact", async () => {
    const { createBodies } = mockApi({ contacts: [aisha, jane] });
    const { user, dialog, router } = await openDialog();
    const { key: keyBefore } = router.state.location;

    const section = await findContactsSection(dialog);
    await user.click(
      await within(section).findByRole("button", { name: /aisha khan/i }),
    );

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(router.state.location.pathname).toBe("/conversations/1");
    expect(router.state.location.key).not.toBe(keyBefore);
    expect(createBodies).toEqual([]);
  });

  test("starts a conversation with a contact who has none", async () => {
    const { createBodies } = mockApi({ contacts: [aisha, jane] });
    const { user, dialog, router } = await openDialog();

    const section = await findContactsSection(dialog);
    await user.click(
      await within(section).findByRole("button", { name: /jane smith/i }),
    );

    expect(
      await screen.findByRole("heading", { level: 2, name: "Jane Smith" }),
    ).toBeInTheDocument();
    expect(createBodies).toEqual([{ recipientId: 4 }]);
    expect(router.state.location.pathname).toBe("/conversations/3");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("narrows the list to a searched contact instead of listing them twice", async () => {
    const { createBodies } = mockApi({ contacts: [aisha, jane] });
    const { user, dialog, router } = await openDialog();
    const section = await findContactsSection(dialog);
    await within(section).findByRole("button", { name: /aisha khan/i });

    await user.type(getEmailInput(dialog), "jane.smith@email.com");

    await waitFor(() => {
      expect(within(section).getAllByRole("button")).toHaveLength(1);
    });
    expect(within(section).getByRole("button")).toHaveAccessibleName(
      /jane smith.*start conversation/i,
    );
    expect(
      within(dialog).queryByRole("list", { name: "Search results" }),
    ).not.toBeInTheDocument();

    await user.keyboard("{Enter}");
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/conversations/3");
    });
    expect(createBodies).toEqual([{ recipientId: 4 }]);
  });

  test("keeps a searched user who isn't a contact as a separate result", async () => {
    mockApi({ contacts: [aisha] });
    const { user, dialog } = await openDialog();
    const section = await findContactsSection(dialog);
    await within(section).findByRole("button", { name: /aisha khan/i });

    await user.type(getEmailInput(dialog), "jane.smith@email.com");

    const results = await within(dialog).findByRole("list", {
      name: "Search results",
    });
    expect(
      within(results).getByRole("button", { name: /jane smith/i }),
    ).toBeInTheDocument();
    const contactButtons = within(section).getAllByRole("button");
    expect(contactButtons).toHaveLength(1);
    expect(contactButtons[0]).toHaveAccessibleName(/aisha khan/i);
  });

  test("restores the full list when the search is cleared", async () => {
    mockApi({ contacts: [aisha, jane] });
    const { user, dialog } = await openDialog();
    const section = await findContactsSection(dialog);
    await within(section).findByRole("button", { name: /aisha khan/i });
    await user.type(getEmailInput(dialog), "jane.smith@email.com");
    await waitFor(() => {
      expect(within(section).getAllByRole("button")).toHaveLength(1);
    });

    await user.clear(getEmailInput(dialog));

    expect(within(section).getAllByRole("button")).toHaveLength(2);
  });

  test("says when there are no saved contacts", async () => {
    mockApi({ contacts: [] });
    const { dialog } = await openDialog();

    const section = await findContactsSection(dialog);

    expect(
      await within(section).findByText("No saved contacts yet"),
    ).toBeInTheDocument();
  });

  test("says when the contacts can't be loaded and still searches by email", async () => {
    mockApi({ contactsStatus: 500 });
    const { user, dialog } = await openDialog();

    const section = await findContactsSection(dialog);
    expect(
      await within(section).findByText("Couldn't load your contacts"),
    ).toBeInTheDocument();

    await user.type(getEmailInput(dialog), "jane.smith@email.com");
    expect(
      await within(dialog).findByRole("button", { name: /jane smith/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  test("doesn't fade the list when every contact fits", async () => {
    mockApi({ contacts: makeContacts(5) });
    const { dialog } = await openDialog();

    const section = await findContactsSection(dialog);
    await within(section).findAllByRole("button");

    expect(
      within(section).queryByTestId("contacts-scroll-fade"),
    ).not.toBeInTheDocument();
  });

  test("fades the bottom of a longer list until it is scrolled to the end", async () => {
    mockApi({ contacts: makeContacts(6) });
    const { dialog } = await openDialog();

    const section = await findContactsSection(dialog);
    const list = await within(section).findByRole("list", {
      name: "Contacts",
    });
    expect(within(list).getAllByRole("listitem")).toHaveLength(6);
    expect(
      within(section).getByTestId("contacts-scroll-fade"),
    ).toBeInTheDocument();

    scrollTo(list, { scrollTop: 40, clientHeight: 320, scrollHeight: 384 });
    expect(
      within(section).getByTestId("contacts-scroll-fade"),
    ).toBeInTheDocument();

    scrollTo(list, { scrollTop: 64, clientHeight: 320, scrollHeight: 384 });
    expect(
      within(section).queryByTestId("contacts-scroll-fade"),
    ).not.toBeInTheDocument();
  });
});
