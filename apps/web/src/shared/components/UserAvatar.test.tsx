import { describe, expect, test } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import UserAvatar from "./UserAvatar.tsx";
import { API_URL } from "../../test/server.ts";

function getImage(container: HTMLElement): HTMLImageElement {
  const image = container.querySelector("img");
  if (!image) throw new Error("Expected the avatar to show a photo");
  return image;
}

describe("UserAvatar", () => {
  test("shows initials when there is no photo", () => {
    const { container } = render(
      <UserAvatar firstName="John" lastName="Doe" avatarUrl={null} />,
    );

    expect(container).toHaveTextContent("JD");
    expect(container.querySelector("img")).toBeNull();
  });

  test("shows the photo from the API when there is one", () => {
    const { container } = render(
      <UserAvatar
        firstName="John"
        lastName="Doe"
        avatarUrl="/avatars/seed-01.jpg"
      />,
    );

    const image = container.querySelector("img");
    expect(image).toHaveAttribute("src", `${API_URL}/avatars/seed-01.jpg`);
    expect(image).toHaveAttribute("alt", "");
    expect(container).not.toHaveTextContent("JD");
  });

  test("falls back to initials when the photo fails to load", () => {
    const { container } = render(
      <UserAvatar
        firstName="John"
        lastName="Doe"
        avatarUrl="/avatars/missing.jpg"
      />,
    );

    fireEvent.error(getImage(container));

    expect(container.querySelector("img")).toBeNull();
    expect(container).toHaveTextContent("JD");
  });

  test("tries again when a failed photo is replaced", () => {
    const { container, rerender } = render(
      <UserAvatar firstName="John" lastName="Doe" avatarUrl="/avatars/a.jpg" />,
    );
    fireEvent.error(getImage(container));

    rerender(
      <UserAvatar firstName="John" lastName="Doe" avatarUrl="/avatars/b.jpg" />,
    );

    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      `${API_URL}/avatars/b.jpg`,
    );
  });

  test("is hidden from assistive technology", () => {
    const { container } = render(
      <UserAvatar firstName="John" lastName="Doe" avatarUrl={null} />,
    );

    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });
});
