import { describe, expect, test } from "vitest";
import { render, waitFor } from "@testing-library/react";
import PageTitle from "./PageTitle.tsx";

describe("PageTitle", () => {
  test("sets the document title to the page name followed by the app name", async () => {
    render(<PageTitle name="Contacts" />);

    await waitFor(() => {
      expect(document.title).toBe("Contacts | messgr.");
    });
  });

  test("updates the document title when the page name changes", async () => {
    const { rerender } = render(<PageTitle name="Sign up" />);
    await waitFor(() => {
      expect(document.title).toBe("Sign up | messgr.");
    });

    rerender(<PageTitle name="Login" />);

    await waitFor(() => {
      expect(document.title).toBe("Login | messgr.");
    });
  });
});
