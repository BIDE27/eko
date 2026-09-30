import { useState, useEffect } from 'react';

/**
 * Custom hook to detect scroll direction.
 * Returns 'up' or 'down'. It's optimized to avoid performance issues
 * by using requestAnimationFrame and a scroll threshold.
 */
export function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    let lastScrollY = window.pageYOffset;
    // Ticking state to prevent excessive re-renders
    let ticking = false;

    const updateScrollDirection = () => {
      const scrollY = window.pageYOffset;
      // Only update state if scroll position has changed significantly
      if (Math.abs(scrollY - lastScrollY) < 10) {
        ticking = false;
        return;
      }
      
      const direction = scrollY > lastScrollY ? 'down' : 'up';
      if (direction !== scrollDirection) {
        setScrollDirection(direction);
      }
      lastScrollY = scrollY > 0 ? scrollY : 0;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDirection);
        ticking = true;
      }
    };

    // Use passive listener for better scroll performance
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, [scrollDirection]);

  return scrollDirection;
}
