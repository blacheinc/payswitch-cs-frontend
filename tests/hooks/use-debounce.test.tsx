import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "@/hooks/use-debounce";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useDebounce", () => {
  it("returns the initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("first", 500));
    expect(result.current).toBe("first");
  });

  it("does not update before the delay has elapsed", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "first", delay: 500 } },
    );

    rerender({ value: "second", delay: 500 });
    act(() => vi.advanceTimersByTime(499));
    expect(result.current).toBe("first");
  });

  it("updates the debounced value once the delay has elapsed", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "first", delay: 500 } },
    );

    rerender({ value: "second", delay: 500 });
    act(() => vi.advanceTimersByTime(500));
    expect(result.current).toBe("second");
  });

  it("collapses rapid changes into the most recent value", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 200),
      { initialProps: { value: "a" } },
    );

    rerender({ value: "b" });
    act(() => vi.advanceTimersByTime(100));
    rerender({ value: "c" });
    act(() => vi.advanceTimersByTime(100));
    rerender({ value: "d" });
    act(() => vi.advanceTimersByTime(200));

    expect(result.current).toBe("d");
  });

  it("uses 500ms as the default delay", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      { initialProps: { value: "x" } },
    );

    rerender({ value: "y" });
    act(() => vi.advanceTimersByTime(499));
    expect(result.current).toBe("x");
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe("y");
  });
});
