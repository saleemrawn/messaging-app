import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";
import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { API_URL, server } from "../../../test/server.ts";
import { renderRoute } from "../../../test/render-route.tsx";
import { findToast } from "../../../test/toasts.ts";

// jsdom can't decode images or draw on a canvas, so the cropper reports a
// fixed crop area as soon as it mounts and cropping returns a stub image.
vi.mock("react-easy-crop", async () => {
  const { useEffect } = await import("react");
  const area = { x: 0, y: 0, width: 400, height: 400 };
  interface FakeCropperProps {
    onCropComplete?: (croppedArea: typeof area, pixels: typeof area) => void;
  }
  function FakeCropper({ onCropComplete }: FakeCropperProps) {
    useEffect(() => {
      onCropComplete?.(area, area);
    }, [onCropComplete]);
    return <div data-testid="cropper" />;
  }
  return { default: FakeCropper };
});

vi.mock("../utils/crop-image.ts", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../utils/crop-image.ts")>()),
  cropImage: vi.fn(() =>
    Promise.resolve(new Blob(["cropped"], { type: "image/png" })),
  ),
}));

const currentUser = {
  id: 1,
  username: "johndoe01",
  firstName: "John",
  lastName: "Doe",
  email: "john.doe01@email.com",
  avatarUrl: null as string | null,
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
  test("titles the page Profile", async () => {
    mockCurrentUser();

    renderRoute("/profile");

    await screen.findByRole("region", { name: /^profile$/i });
    expect(document.title).toBe("Profile | messgr.");
  });

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
    expect(await findToast("Profile updated")).toBeInTheDocument();
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

  test.each([
    ["currentPassword", "Current password is incorrect"],
    ["newPassword", "Passwords must at least 8 characters long"],
    ["confirmNewPassword", "Passwords do not match"],
  ])(
    "an error on %s clears every password field and nothing else",
    async (path, msg) => {
      mockCurrentUser();
      server.use(
        http.put(`${API_URL}/users/1`, () =>
          HttpResponse.json(
            { success: false, errors: [{ type: "field", path, msg }] },
            { status: 400 },
          ),
        ),
      );
      const { user, page } = await openEditForm();

      await user.clear(within(page).getByLabelText("First name"));
      await user.type(within(page).getByLabelText("First name"), "Johnny");
      await user.type(
        within(page).getByLabelText("Current password"),
        "Testpassword01!",
      );
      await user.type(
        within(page).getByLabelText("New password"),
        "Newpass02!",
      );
      await user.type(
        within(page).getByLabelText("Confirm new password"),
        "Newpass02!",
      );
      await user.click(within(page).getByRole("button", { name: "Save" }));

      await within(page).findByText(msg);
      expect(within(page).getByLabelText("Current password")).toHaveValue("");
      expect(within(page).getByLabelText("New password")).toHaveValue("");
      expect(within(page).getByLabelText("Confirm new password")).toHaveValue(
        "",
      );
      expect(within(page).getByLabelText("First name")).toHaveValue("Johnny");
      expect(within(page).getByLabelText("Email")).toHaveValue(
        "john.doe01@email.com",
      );
    },
  );

  test("an error on a non-password field keeps every field", async () => {
    mockCurrentUser();
    server.use(
      http.put(`${API_URL}/users/1`, () =>
        HttpResponse.json(
          {
            success: false,
            errors: [
              {
                type: "field",
                path: "email",
                msg: "Email must be a valid format",
              },
            ],
          },
          { status: 400 },
        ),
      ),
    );
    const { user, page } = await openEditForm();

    await user.type(
      within(page).getByLabelText("Current password"),
      "Testpassword01!",
    );
    await user.click(within(page).getByRole("button", { name: "Save" }));

    await within(page).findByText("Email must be a valid format");
    expect(within(page).getByLabelText("Email")).toHaveValue(
      "john.doe01@email.com",
    );
    expect(within(page).getByLabelText("Current password")).toHaveValue(
      "Testpassword01!",
    );
  });

  test("keeps the fields when the error is not about a field", async () => {
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

    await user.type(within(page).getByLabelText("Current password"), "secret");
    await user.click(within(page).getByRole("button", { name: "Save" }));

    await within(page).findByText("That username or email is already taken");
    expect(within(page).getByLabelText("Email")).toHaveValue(
      "john.doe01@email.com",
    );
    expect(within(page).getByLabelText("Current password")).toHaveValue(
      "secret",
    );
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

describe("profile photo", () => {
  const UPLOADED_URL = "/avatars/user-1-0123456789abcdef.png";
  const originalCreateObjectURL = URL.createObjectURL.bind(URL);
  const originalRevokeObjectURL = URL.revokeObjectURL.bind(URL);

  beforeAll(() => {
    URL.createObjectURL = vi.fn(() => "blob:preview");
    URL.revokeObjectURL = vi.fn();
  });

  afterAll(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  function makeFile(name: string, type: string, size = 1024): File {
    return new File([new Uint8Array(size)], name, { type });
  }

  // Saves like the API does: /auth/me returns the new avatar afterwards.
  // Returns the raw multipart bodies (undici's formData() parser rejects
  // jsdom's File, so the parts are checked as text).
  function mockAvatarUpload(): string[] {
    let user = currentUser;
    const uploads: string[] = [];
    mockCurrentUser(() => user);
    server.use(
      http.put(`${API_URL}/users/1/avatar`, async ({ request }) => {
        uploads.push(await request.text());
        user = { ...user, avatarUrl: UPLOADED_URL };
        return HttpResponse.json({ success: true, data: user });
      }),
    );
    return uploads;
  }

  async function openPhotoDialog(options?: { applyAccept: boolean }) {
    const user = userEvent.setup(options);
    renderRoute("/profile");
    const page = await screen.findByRole("region", { name: /^profile$/i });
    await user.click(
      within(page).getByRole("button", { name: /edit profile/i }),
    );
    await user.click(
      within(page).getByRole("button", { name: "Change profile photo" }),
    );
    const dialog = screen.getByRole("dialog", { name: "Profile photo" });
    return { user, page, dialog };
  }

  // The avatar is decorative (aria-hidden), so the image has no role to query.
  function avatarImage(page: HTMLElement) {
    return page.querySelector("img");
  }

  test("the pencil button only shows while editing", async () => {
    mockCurrentUser();
    const user = userEvent.setup();
    renderRoute("/profile");
    const page = await screen.findByRole("region", { name: /^profile$/i });

    expect(
      within(page).queryByRole("button", { name: "Change profile photo" }),
    ).not.toBeInTheDocument();

    await user.click(
      within(page).getByRole("button", { name: /edit profile/i }),
    );

    expect(
      within(page).getByRole("button", { name: "Change profile photo" }),
    ).toBeInTheDocument();
  });

  test("shows the user's photo on the profile", async () => {
    mockCurrentUser(() => ({ ...currentUser, avatarUrl: UPLOADED_URL }));

    renderRoute("/profile");

    const page = await screen.findByRole("region", { name: /^profile$/i });
    expect(avatarImage(page)).toHaveAttribute(
      "src",
      `${API_URL}${UPLOADED_URL}`,
    );
  });

  test("the uploader explains the accepted files", async () => {
    mockCurrentUser();

    const { dialog } = await openPhotoDialog();

    expect(
      within(dialog).getByText(
        "JPG or PNG, up to 4 MB. 320 × 320 px recommended.",
      ),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByRole("button", { name: "Remove photo" }),
    ).not.toBeInTheDocument();
  });

  test("choosing, cropping and saving a photo uploads it", async () => {
    const uploads = mockAvatarUpload();
    const { user, page, dialog } = await openPhotoDialog();

    await user.upload(
      within(dialog).getByLabelText("Choose a file"),
      makeFile("me.png", "image/png"),
    );
    expect(within(dialog).getByTestId("cropper")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Save" }));

    await vi.waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(uploads).toHaveLength(1);
    expect(uploads[0]).toContain(
      'Content-Disposition: form-data; name="avatar"; filename="avatar.png"',
    );
    expect(uploads[0]).toContain("Content-Type: image/png");
    expect(uploads[0]).toContain("cropped");
    expect(avatarImage(page)).toHaveAttribute(
      "src",
      `${API_URL}${UPLOADED_URL}`,
    );
    expect(await findToast("Profile photo updated")).toBeInTheDocument();
  });

  test("a dropped photo opens the cropper", async () => {
    mockCurrentUser();
    const { dialog } = await openPhotoDialog();

    // jsdom has no DataTransfer, so stand in a one-file FileList.
    const file = makeFile("me.jpg", "image/jpeg");
    const files = { 0: file, length: 1, item: () => file };

    fireEvent.drop(within(dialog).getByTestId("avatar-dropzone"), {
      dataTransfer: { files, types: ["Files"] },
    });

    expect(await within(dialog).findByTestId("cropper")).toBeInTheDocument();
  });

  test("rejects a file that isn't a JPG or PNG", async () => {
    mockCurrentUser();
    const { user, dialog } = await openPhotoDialog({ applyAccept: false });

    await user.upload(
      within(dialog).getByLabelText("Choose a file"),
      makeFile("animation.gif", "image/gif"),
    );

    expect(
      within(dialog).getByText("Image must be a JPG or PNG file"),
    ).toBeInTheDocument();
    expect(within(dialog).queryByTestId("cropper")).not.toBeInTheDocument();
  });

  test("rejects a file over 4 MB", async () => {
    mockCurrentUser();
    const { user, dialog } = await openPhotoDialog();

    await user.upload(
      within(dialog).getByLabelText("Choose a file"),
      makeFile("huge.jpg", "image/jpeg", 4 * 1024 * 1024 + 1),
    );

    expect(
      within(dialog).getByText("Image must be 4 MB or smaller"),
    ).toBeInTheDocument();
  });

  test("Choose another goes back to picking a file", async () => {
    mockCurrentUser();
    const { user, dialog } = await openPhotoDialog();
    await user.upload(
      within(dialog).getByLabelText("Choose a file"),
      makeFile("me.png", "image/png"),
    );

    await user.click(
      within(dialog).getByRole("button", { name: "Choose another" }),
    );

    expect(within(dialog).queryByTestId("cropper")).not.toBeInTheDocument();
    expect(within(dialog).getByLabelText("Choose a file")).toBeInTheDocument();
  });

  test("shows the server's error and keeps the cropper open", async () => {
    mockCurrentUser();
    server.use(
      http.put(`${API_URL}/users/1/avatar`, () =>
        HttpResponse.json(
          { success: false, message: "Image must be square (1:1)" },
          { status: 400 },
        ),
      ),
    );
    const { user, dialog } = await openPhotoDialog();
    await user.upload(
      within(dialog).getByLabelText("Choose a file"),
      makeFile("me.png", "image/png"),
    );

    await user.click(within(dialog).getByRole("button", { name: "Save" }));

    expect(
      await within(dialog).findByText("Image must be square (1:1)"),
    ).toBeInTheDocument();
    expect(within(dialog).getByTestId("cropper")).toBeInTheDocument();
  });

  test("Remove photo clears it and shows initials again", async () => {
    let user: User = { ...currentUser, avatarUrl: UPLOADED_URL };
    mockCurrentUser(() => user);
    server.use(
      http.delete(`${API_URL}/users/1/avatar`, () => {
        user = { ...user, avatarUrl: null };
        return HttpResponse.json({ success: true, data: user });
      }),
    );
    const { user: actor, page, dialog } = await openPhotoDialog();

    await actor.click(
      within(dialog).getByRole("button", { name: "Remove photo" }),
    );

    await vi.waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(avatarImage(page)).toBeNull();
    expect(within(page).getByText("JD")).toBeInTheDocument();
    expect(await findToast("Profile photo removed")).toBeInTheDocument();
  });

  test("Cancel closes the uploader without changes", async () => {
    mockCurrentUser();
    const { user, dialog } = await openPhotoDialog();

    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
