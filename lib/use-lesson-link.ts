'use client';
import { useEffect, useLayoutEffect, useRef } from 'react';
/** Step slugs are stable across card links, refreshes and browser history. */
export function useLessonLink(
  ids: readonly string[],
  navigate: (step: number) => void,
) {
  const latest = useRef(navigate);
  useLayoutEffect(() => {
    latest.current = navigate;
  });
  useEffect(() => {
    const read = () => {
      const slug = window.location.hash.slice(1);
      const index = ids.indexOf(slug);
      if (index >= 0) latest.current(index);
    };
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, [ids]);
}
export function replaceLessonStep(ids: readonly string[], index: number) {
  if (ids[index])
    window.history.replaceState(
      window.history.state,
      '',
      `${window.location.pathname}${window.location.search}#${ids[index]}`,
    );
}
