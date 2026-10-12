import { useState, useEffect, useRef } from 'react';

/**
 * Hook to throttle a value.
 * @param {any} value - The value to throttle
 * @param {number} interval - The throttle interval in ms
 * @returns {any} The throttled value
 */
export default function useThrottle(value, interval = 500) {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastUpdated = useRef(Date.now());

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdated.current;

    if (timeSinceLastUpdate >= interval) {
      setThrottledValue(value);
      lastUpdated.current = now;
    } else {
      const handler = setTimeout(() => {
        setThrottledValue(value);
        lastUpdated.current = Date.now();
      }, interval - timeSinceLastUpdate);

      return () => clearTimeout(handler);
    }
  }, [value, interval]);

  return throttledValue;
}
