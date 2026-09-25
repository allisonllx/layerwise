import { useLayoutEffect, type RefObject, useState } from 'react';

// Interpolate the container as the detailed calculation gives way to the maps.
// Measuring the untransformed children also keeps mobile and resized layouts correct.
export function useSceneHeight(
  ref: RefObject<HTMLDivElement | null>,
  amount: number,
) {
  const hasOverview = amount > 0;
  const [heights, setHeights] = useState<[number, number] | null>(null);
  useLayoutEffect(() => {
    const scene = ref.current;
    if (!scene) return;
    const measure = () => {
      const focus = scene.children[0] as HTMLElement;
      const overview = scene.children[1] as HTMLElement | undefined;
      const a = focus.offsetHeight;
      const b = overview?.offsetHeight ?? a;
      setHeights((previous) =>
        previous?.[0] === a && previous[1] === b ? previous : [a, b],
      );
    };
    const observer = new ResizeObserver(measure);
    for (const child of scene.children) observer.observe(child);
    return () => observer.disconnect();
  }, [hasOverview, ref]);
  return heights
    ? { height: heights[0] * (1 - amount) + heights[1] * amount }
    : undefined;
}
