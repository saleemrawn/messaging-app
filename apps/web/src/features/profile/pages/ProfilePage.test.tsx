import { describe, expect, test } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { API_URL, server } from "../../../test/server.ts";
import { renderRoute } from "../../../test/render-route.tsx";

const currentUser = {
  id: 1,
  username: "johndoe01",
  firstName: "John",
  lastName: "Doe",
  email: "john.doe01@email.com",
};

type User = typeof currentUser;

function mockCurrentUser(getUser: () => User = () => currentUser) {
  server.use(
    http.get(`${API_URL}/auth/me`, () =>
      HttpResponse.json({ success: true, data: getUser() }),
    ),
  );
}

// Saves like the API does: /auth/me returns the updated user afterwards.
// Returns the request bodies the profile form sent.
function mockProfileUpdate(): Record<string, unknown>[] {
  let user = currentUser;
  const bodies: Record<string, unknown>[] = [];
  mockCurrentUser(() => user);
  server.use(
    http.put(`${API_URL}/users/1`, async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>;
      bodies.push(body);
      user = { ...user, ...(body as Partial<User>) };
      return HttpResponse.json({ success: true, data: user });
    }),
  );
  return bodies;
}

async function openEditForm() {
  const user = userEvent.setup();
  renderRoute("/profile");
  const page = await screen.findByRole("region", { name: /^profile$/i });
  await user.click(within(page).getByRole("button", { name: /edit profile/i }));
  return { user, page };
}

describe("profile page", () => {
  test("shows the logged-in user's avatar, full name and email", async () => {
    mockCurrentUser();

    renderRoute("/profile");

    const page = await screen.findByRole("region", { name: /^profile$/i });
    expect(
      within(page).getByRole("heading", { level: 1, name: "John Doe" }),
    ).toBeInTheDocument();
    expect(within(page).getByText("JD")).toBeInTheDocument();
    expect(within(page).getByText("john.doe01@email.com")).toBeInTheDocument();
  });

  test("Edit opens a form filled with the user's details", async () => {
    mockCurrentUser();

    const { page } = await openEditForm();

    expect(within(page).getByLabelText("First name")).toHaveValue("John");
    expect(within(page).getByLabelText("Last name")).toHaveValue("Doe");
    expect(within(page).getByLabelText("Email")).toHaveValue(
      "john.doe01@email.com",
    );
    const username = within(page).getByLabelText("Username");
    expect(username).toHaveValue("johndoe01");
    expect(username).toBeDisabled();
    expect(within(page).getByLabelText("Current password")).toHaveValue("");
    expect(within(page).getByLabelText("New password")).toHaveValue("");
    expect(within(page).getByLabelText("Confirm new password")).toHaveValue("");
    expect(
      within(page).queryByRole("button", { name: /edit profile/i }),
    ).not.toBeInTheDocument();
  });

  test("Cancel discards changes and returns to the profile", async () => {
    const bodies = mockProfileUpdate();
    const { user, page } = await openEditForm();

    await user.clear(within(page).getByLabelText("First name"));
    await user.type(within(page).getByLabelText("First name"), "Johnny");
    await user.click(within(page).getByRole("button", { name: "Cancel" }));

    expect(
      within(page).getByRole("heading", { level: 1, name: "John Doe" }),
    ).toBeInTheDocument();
    expect(within(page).queryByRole("form")).not.toBeInTheDocument();
    expect(bodies).toEqual([]);
  });

  test("Save updates the details and returns to the profile", async () => {
    const bodies = mockProfileUpdate();
    const { user, page } = await openEditForm();

    await user.clear(within(page).getByLabelText("First name"));
    await user.type(within(page).getByLabelText("First name"), "Johnny");
    await user.clear(within(page).getByLabelText("Email"));
    await user.type(within(page).getByLabelText("Email"), "johnny@email.com");
    await user.click(within(page).getByRole("button", { name: "Save" }));

    expect(
      await within(page).findByRole("heading", {
        level: 1,
        name: "Johnny Doe",
      }),
    ).toBeInTheDocument();
    expect(within(page).getByText("johnny@email.com")).toBeInTheDocument();
    expect(bodies).toEqual([
      {
        firstName: "Johnny",
        lastName: "Doe",
        email: "johnny@email.com",
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      },
    ]);
  });

  test("Save sends the password fields when changing the password", async () => {
    const bodies = mockProfileUpdate();
    const { user, page } = await openEditForm();

    await user.type(
      within(page).getByLabelText("Current password"),
      "Testpassword01!",
    );
    await user.type(within(page).getByLabelText("New password"), "Newpass02!");
    await user.type(
      within(page).getByLabelText("Confirm new password"),
      "Newpass02!",
    );
    await user.click(within(page).getByRole("button", { name: "Save" }));

    await within(page).findByRole("button", { name: /edit profile/i });
    expect(bodies).toEqual([
      {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe01@email.com",
        currentPassword: "Testpassword01!",
        newPassword: "Newpass02!",
        confirmNewPassword: "Newpass02!",
      },
    ]);
  });

  test("shows a field error when the current password is wrong", async () => {
    mockCurrentUser();
    server.use(
      http.put(`${API_URL}/users/1`, () =>
        HttpResponse.json(
          {
            success: false,
            errors: [
              {
                type: "field",
                path: "currentPassword",
                msg: "Current password is incorrect",
              },
            ],
          },
          { status: 400 },
        ),
      ),
    );
    const { user, page } = await openEditForm();

    await user.type(within(page).getByLabelText("Current password"), "wrong");
    await user.type(within(page).getByLabelText("New password"), "Newpass02!");
    await user.type(
      within(page).getByLabelText("Confirm new password"),
      "Newpass02!",
    );
    await user.click(within(page).getByRole("button", { name: "Save" }));

    const currentPassword = within(page).getByLabelText("Current password");
    expect(
      await within(page).findByText("Current password is incorrect"),
    ).toBeInTheDocument();
    expect(currentPassword).toHaveAttribute("aria-invalid", "true");
    expect(currentPassword).toHaveAccessibleDescription(
      "Current password is incorrect",
    );
    expect(within(page).getByRole("button", { name: "Save" })).toBeEnabled();
  });

  test("shows a message when the email is already taken", async () => {
    mockCurrentUser();
    server.use(
      http.put(`${API_URL}/users/1`, () =>
        HttpResponse.json(
          { success: false, message: "Conflict" },
          { status: 409 },
        ),
      ),
    );
    const { user, page } = await openEditForm();

    await user.click(within(page).getByRole("button", { name: "Save" }));

    expect(
      await within(page).findByText("That username or email is already taken"),
    ).toBeInTheDocument();
    expect(within(page).getByLabelText("First name")).toBeInTheDocument();
  });
});
