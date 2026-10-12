import { useState, useEffect } from 'react';

/**
 * Hook to debounce a value.
 * @param {any} value - The value to debounce
 * @param {number} delay - The debounce delay in ms
 * @returns {any} The debounced value
 */
export default function useDebounce(value, delay = 300) {
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
