import { describe, expect, test } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { API_URL, server } from "./test/server.ts";
import { renderRoute } from "./test/render-route.tsx";

const currentUser = {
  id: 1,
  username: "johndoe01",
  firstName: "John",
  lastName: "Doe",
  email: "john.doe01@email.com",
};

function mockLoggedOut() {
  server.use(
    http.get(`${API_URL}/auth/me`, () =>
      HttpResponse.json({ success: false }, { status: 401 }),
    ),
  );
}

function mockLoggedIn() {
  server.use(
    http.get(`${API_URL}/auth/me`, () =>
      HttpResponse.json({ success: true, data: currentUser }),
    ),
  );
}

describe("routing by auth state", () => {
  test("redirects a logged-out visitor from / to the sign-up form", async () => {
    mockLoggedOut();

    const { router } = renderRoute("/");

    expect(
      await screen.findByRole("heading", { name: /create an account/i }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/login");
  });

  test("redirects a logged-in visitor from /login to the homepage", async () => {
    mockLoggedIn();

    const { router } = renderRoute("/login");

    expect(
      await screen.findByRole("heading", { name: /hello world/i }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/");
  });

  test("redirects unknown paths to the homepage", async () => {
    mockLoggedIn();

    const { router } = renderRoute("/does-not-exist");

    expect(
      await screen.findByRole("heading", { name: /hello world/i }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/");
  });

  test("shows an error page when the auth check fails unexpectedly", async () => {
    server.use(
      http.get(`${API_URL}/auth/me`, () =>
        HttpResponse.json({ success: false }, { status: 500 }),
      ),
    );

    renderRoute("/");

    expect(
      await screen.findByRole("heading", { name: /something went wrong/i }),
    ).toBeInTheDocument();
  });
});

describe("login page", () => {
  test("toggles between the sign-up and login forms", async () => {
    mockLoggedOut();
    const user = userEvent.setup();
    renderRoute("/login");

    await user.click(
      await screen.findByRole("button", { name: /already have an account/i }),
    );
    expect(
      screen.getByRole("heading", { name: /log in/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /need an account/i }));
    expect(
      screen.getByRole("heading", { name: /create an account/i }),
    ).toBeInTheDocument();
  });

  test("switches to the login form with a notice after signing up", async () => {
    mockLoggedOut();
    let signupBody: unknown;
    server.use(
      http.post(`${API_URL}/users`, async ({ request }) => {
        signupBody = await request.json();
        return HttpResponse.json(
          { success: true, data: currentUser },
          { status: 201 },
        );
      }),
    );
    const user = userEvent.setup();
    renderRoute("/login");

    await user.type(await screen.findByLabelText(/first name/i), "John");
    await user.type(screen.getByLabelText(/last name/i), "Doe");
    await user.type(screen.getByLabelText(/email/i), "john.doe01@email.com");
    await user.type(screen.getByLabelText(/username/i), "johndoe01");
    await user.type(screen.getByLabelText(/password/i), "Testpassword01!");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    expect(
      await screen.findByRole("heading", { name: /log in/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/account created/i);
    expect(signupBody).toEqual({
      firstName: "John",
      lastName: "Doe",
      email: "john.doe01@email.com",
      username: "johndoe01",
      password: "Testpassword01!",
    });
  });

  test("shows field errors when sign-up validation fails", async () => {
    mockLoggedOut();
    server.use(
      http.post(`${API_URL}/users`, () =>
        HttpResponse.json(
          {
            success: false,
            errors: [
              {
                type: "field",
                path: "password",
                msg: "Passwords must at least 8 characters long",
              },
            ],
          },
          { status: 400 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderRoute("/login");

    await user.type(await screen.findByLabelText(/first name/i), "John");
    await user.type(screen.getByLabelText(/last name/i), "Doe");
    await user.type(screen.getByLabelText(/email/i), "john.doe01@email.com");
    await user.type(screen.getByLabelText(/username/i), "johndoe01");
    await user.type(screen.getByLabelText(/password/i), "weak");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    expect(
      await screen.findByText(/passwords must at least 8 characters long/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /create an account/i }),
    ).toBeInTheDocument();
  });

  test("logs in and navigates to the homepage", async () => {
    let isLoggedIn = false;
    server.use(
      http.get(`${API_URL}/auth/me`, () =>
        isLoggedIn
          ? HttpResponse.json({ success: true, data: currentUser })
          : HttpResponse.json({ success: false }, { status: 401 }),
      ),
      http.post(`${API_URL}/auth/login`, () => {
        isLoggedIn = true;
        return HttpResponse.json({ success: true, token: "token" });
      }),
    );
    const user = userEvent.setup();
    const { router } = renderRoute("/login");

    await user.click(
      await screen.findByRole("button", { name: /already have an account/i }),
    );
    await user.type(screen.getByLabelText(/username/i), "johndoe01");
    await user.type(screen.getByLabelText(/password/i), "Testpassword01!");
    await user.click(screen.getByRole("button", { name: /^log in$/i }));

    expect(
      await screen.findByRole("heading", { name: /hello world/i }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/");
  });

  test("shows an error when login credentials are wrong", async () => {
    mockLoggedOut();
    server.use(
      http.post(`${API_URL}/auth/login`, () =>
        HttpResponse.json(
          {
            success: false,
            message: "Invalid username or password, please try again!",
          },
          { status: 401 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderRoute("/login");

    await user.click(
      await screen.findByRole("button", { name: /already have an account/i }),
    );
    await user.type(screen.getByLabelText(/username/i), "johndoe01");
    await user.type(screen.getByLabelText(/password/i), "wrong");
    await user.click(screen.getByRole("button", { name: /^log in$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /invalid username or password/i,
    );
  });
});
