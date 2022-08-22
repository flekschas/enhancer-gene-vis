import { useRef, useEffect } from 'react';

/**
 * React hook function to assign a value to a ref, and return the previous
 * value of it.
 *
 * @param value The new value to store
 * @returns The previous value for the ref, if it exists
 */
export default function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  // Happens before update in useEffect above
  return ref.current;
}
