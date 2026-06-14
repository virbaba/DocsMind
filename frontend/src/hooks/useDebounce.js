import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce a value.
 * Delays updating the returned value until the specified delay has passed.
 * Useful for limiting performance-heavy operations like client-side list filtering.
 */
export const useDebounce = (value, delay = 300) => {
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
};
