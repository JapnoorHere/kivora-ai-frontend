/**
 * Runs `activate` while the element is near the viewport and tears it down
 * once it leaves, so scroll-linked work costs nothing for the sections a
 * visitor isn't looking at.
 *
 * `activate` returns its own teardown; the returned function detaches
 * everything permanently.
 */
export function whileVisible(
  element: Element,
  activate: () => () => void,
  rootMargin = '25% 0px',
): () => void {
  let deactivate: (() => void) | null = null;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && !deactivate) {
          deactivate = activate();
        } else if (!entry.isIntersecting && deactivate) {
          deactivate();
          deactivate = null;
        }
      }
    },
    { rootMargin },
  );

  observer.observe(element);

  return () => {
    observer.disconnect();
    deactivate?.();
    deactivate = null;
  };
}

/** True when the visitor has asked the OS to keep motion to a minimum. */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
