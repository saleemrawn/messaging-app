import { describe, expect, test } from "vitest";
import { screen, within } from "@testing-library/react";
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

function mockCurrentUser() {
  server.use(
    http.get(`${API_URL}/auth/me`, () =>
      HttpResponse.json({ success: true, data: currentUser }),
    ),
  );
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
});
