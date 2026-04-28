import { useEffect, useState } from "react";

/**
 * Canonical debounce delay for search-as-you-type inputs that fire backend
 * requests. Tuned for the common case: long enough that the network doesn't
 * fire on every keystroke during normal typing, short enough that the result
 * arrives without a perceptible "did this register?" pause once the user
 * pauses.
 *
 * Use this everywhere — don't pass a custom number. One knob, one feel.
 */
export const SEARCH_DEBOUNCE_MS = 500;

/**
 * Returns `value` after it has stayed unchanged for `delay` ms. Standard
 * pattern for wiring a controlled input into a `useQuery` queryKey so the
 * request only fires when the user pauses typing.
 *
 * Defaults to `SEARCH_DEBOUNCE_MS` — prefer the default to keep every
 * search bar feeling identical.
 */
export function useDebounce<T>(value: T, delay: number = SEARCH_DEBOUNCE_MS): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
