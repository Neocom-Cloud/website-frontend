import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TypewriterWord } from "./TypewriterWord";

function setReducedMotion(reduced: boolean) {
  vi.mocked(window.matchMedia).mockImplementation(
    (query: string) =>
      ({
        matches: reduced && query === "(prefers-reduced-motion: reduce)",
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }) as unknown as MediaQueryList
  );
}

describe("TypewriterWord", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("types the first phrase, holds it, then deletes and moves on", () => {
    setReducedMotion(false);
    render(<TypewriterWord phrases={["ab", "xy"]} />);

    const text = screen.getByTestId("typewriter-text");

    expect(text).toHaveTextContent("");
    expect(screen.getByTestId("typewriter-cursor")).toBeInTheDocument();

    act(() => void vi.advanceTimersByTime(105));
    expect(text).toHaveTextContent("a");

    act(() => void vi.advanceTimersByTime(105));
    expect(text).toHaveTextContent("ab");

    // Held for the pause, then deleted one character at a time.
    act(() => void vi.advanceTimersByTime(1900));
    act(() => void vi.advanceTimersByTime(42));
    expect(text).toHaveTextContent("a");

    act(() => void vi.advanceTimersByTime(42));
    expect(text).toHaveTextContent("");

    act(() => void vi.advanceTimersByTime(105));
    expect(text).toHaveTextContent("x");
  });

  it("renders the first phrase statically when motion is reduced", () => {
    setReducedMotion(true);
    render(<TypewriterWord phrases={["ab", "xy"]} />);

    act(() => void vi.advanceTimersByTime(10_000));

    expect(screen.getByTestId("typewriter-text")).toHaveTextContent("ab");
    expect(screen.queryByTestId("typewriter-cursor")).not.toBeInTheDocument();
  });
});
