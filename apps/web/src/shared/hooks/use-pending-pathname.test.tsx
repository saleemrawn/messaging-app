import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import {
  createMemoryRouter,
  Form,
  Link,
  RouterProvider,
  type RouteObject,
} from "react-router";
import {
  PENDING_INDICATOR_DELAY_MS,
  usePendingPathname,
} from "./use-pending-pathname.ts";

function PendingProbe() {
  const pendingPathname = usePendingPathname();
  return (
    <>
      <p>pending: {pendingPathname ?? "none"}</p>
      <Link to="/slow">Slow page</Link>
      <Link to="/">Same page</Link>
      <Form method="post">
        <button type="submit">Submit</button>
      </Form>
    </>
  );
}

// Every loader waits for the test to release it, so navigations stay pending.
function renderWithHeldLoaders() {
  let release: () => void = () => undefined;
  const held = () =>
    new Promise<null>((resolve) => {
      release = () => {
        resolve(null);
      };
    });
  let isFirstLoad = true;
  const routes: RouteObject[] = [
    {
      path: "/",
      loader: () => {
        if (isFirstLoad) {
          isFirstLoad = false;
          return null;
        }
        return held();
      },
      action: () => null,
      Component: PendingProbe,
    },
    { path: "/slow", loader: held, Component: () => <p>Slow page loaded</p> },
  ];
  const router = createMemoryRouter(routes, { initialEntries: ["/"] });
  render(<RouterProvider router={router} />);
  return {
    release: () => {
      release();
    },
  };
}

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

describe("usePendingPathname", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("returns the pending pathname once the delay has passed", async () => {
    const { release } = renderWithHeldLoaders();
    await advance(0);

    fireEvent.click(screen.getByRole("link", { name: "Slow page" }));
    await advance(PENDING_INDICATOR_DELAY_MS - 1);
    expect(screen.getByText("pending: none")).toBeInTheDocument();

    await advance(1);
    expect(screen.getByText("pending: /slow")).toBeInTheDocument();

    release();
    await advance(0);
    expect(screen.getByText("Slow page loaded")).toBeInTheDocument();
  });

  test("ignores a navigation to the current pathname", async () => {
    renderWithHeldLoaders();
    await advance(0);

    fireEvent.click(screen.getByRole("link", { name: "Same page" }));
    await advance(PENDING_INDICATOR_DELAY_MS);

    expect(screen.getByText("pending: none")).toBeInTheDocument();
  });

  test("ignores form submissions and their revalidation", async () => {
    renderWithHeldLoaders();
    await advance(0);

    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    await advance(PENDING_INDICATOR_DELAY_MS);

    expect(screen.getByText("pending: none")).toBeInTheDocument();
  });
});
