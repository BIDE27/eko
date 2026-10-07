import { useState, useEffect, useRef, useCallback } from 'react';

const PAGE_SIZE = 8; // Number of items to load per page

/**
 * A custom hook for implementing infinite scroll.
 * @param allItems The full list of items to be paginated.
 * @returns An object with the items to display, a ref for the loader element,
 * and loading/completion status.
 */
export function useInfiniteScroll<T>(allItems: T[]) {
  const [visibleItems, setVisibleItems] = useState<T[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const loadMoreItems = useCallback(() => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);

    // Simulate network delay for a better UX
    setTimeout(() => {
      const nextPage = page + 1;
      const newItems = allItems.slice(page * PAGE_SIZE, nextPage * PAGE_SIZE);

      if (newItems.length > 0) {
        setVisibleItems(prev => [...prev, ...newItems]);
        setPage(nextPage);
      }

      if (nextPage * PAGE_SIZE >= allItems.length) {
        setHasMore(false);
      }
      setIsLoading(false);
    }, 300);
  }, [isLoading, hasMore, page, allItems]);

  // Reset and load the first page when the source data (e.g., filtered list) changes
  useEffect(() => {
    setVisibleItems([]);
    setPage(0);
    setHasMore(allItems.length > 0);
    setIsLoading(false); // Cancel any pending load

    if (allItems.length > 0) {
      setIsLoading(true);
      // Use a timeout to ensure state is fully reset before loading new data
      setTimeout(() => {
        const initialItems = allItems.slice(0, PAGE_SIZE);
        setVisibleItems(initialItems);
        setPage(1);
        setHasMore(allItems.length > PAGE_SIZE);
        setIsLoading(false);
      }, 100);
    }
  }, [allItems]);

  // Effect to set up the Intersection Observer
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Trigger loadMoreItems when the loader element is intersecting
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMoreItems();
        }
      },
      { threshold: 1.0 } // Trigger when the loader is fully visible
    );

    const currentLoader = loaderRef.current;
    if (currentLoader) {
      observerRef.current.observe(currentLoader);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMoreItems, hasMore, isLoading]);

  return { visibleItems, loaderRef, hasMore, isLoading };
}
