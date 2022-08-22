import { useState, useEffect } from 'react';

/**
 * React hook function to assign a value to state after a specified delay.
 *
 * @param value The new value to store
 * @param delay The amount of time in milliseconds to wait
 * @returns The debounced value
 */
export default function useDebounce<T>(value: T, delay: number): T {
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
