import { describe, expect, test } from "vitest";
import { renderHook } from "@testing-library/react";
import { useMediaQuery } from "./use-media-query.ts";
import { setMatchingQueries } from "../../test/media-query.ts";

const QUERY = "(min-width: 40rem)";

describe("useMediaQuery", () => {
  test("returns whether the query currently matches", () => {
    setMatchingQueries([QUERY]);

    const { result } = renderHook(() => useMediaQuery(QUERY));

    expect(result.current).toBe(true);
  });

  test("returns false for a query that doesn't match", () => {
    setMatchingQueries([]);

    const { result } = renderHook(() => useMediaQuery(QUERY));

    expect(result.current).toBe(false);
  });

  test("updates when the query starts or stops matching", () => {
    setMatchingQueries([]);
    const { result } = renderHook(() => useMediaQuery(QUERY));

    setMatchingQueries([QUERY]);
    expect(result.current).toBe(true);

    setMatchingQueries([]);
    expect(result.current).toBe(false);
  });
});
