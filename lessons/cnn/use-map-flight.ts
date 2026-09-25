import { useLayoutEffect, useState, type RefObject } from 'react';
type Box = { x: number; y: number; width: number; height: number };
const ease = (t: number) => {
  const v = Math.max(0, Math.min(1, t));
  return v * v * (3 - 2 * v);
};
export function useMapFlight(
  scene: RefObject<HTMLDivElement | null>,
  source: RefObject<HTMLDivElement | null>,
  target: RefObject<HTMLDivElement | null>,
  amount: number,
  wide = false,
) {
  const [boxes, setBoxes] = useState<{
    from: Box;
    to: Box;
    width: number;
  } | null>(null);
  useLayoutEffect(() => {
    if (!scene.current || !source.current || !target.current) return;
    const measure = () => {
      const parent = scene.current!.getBoundingClientRect();
      const box = (el: HTMLElement): Box => {
        const r = el.getBoundingClientRect();
        return {
          x: r.left - parent.left,
          y: r.top - parent.top,
          width: r.width,
          height: r.height,
        };
      };
      const next = {
        from: box(source.current!),
        to: box(target.current!),
        width: parent.width,
      };
      setBoxes((old) =>
        JSON.stringify(old) === JSON.stringify(next) ? old : next,
      );
    };
    const observer = new ResizeObserver(measure);
    observer.observe(source.current);
    observer.observe(target.current);
    return () => observer.disconnect();
  }, [scene, source, target]);
  if (!boxes) return undefined;
  const { from, to, width } = boxes;
  const spotlightWidth = Math.min(wide ? 720 : 300, width - 48);
  const spotlight = {
    x: (width - spotlightWidth) / 2,
    y: 112,
    width: spotlightWidth,
    height: (from.height * spotlightWidth) / from.width,
  };
  // First isolate the same map, hold it briefly, then carry it into its channel card.
  const first = amount < 0.48;
  const a = first ? from : spotlight;
  const b = first ? spotlight : to;
  const t = first ? ease(amount / 0.36) : ease((amount - 0.48) / 0.42);
  const blend = (key: keyof Box) => a[key] + (b[key] - a[key]) * t;
  return {
    left: blend('x'),
    top: blend('y'),
    width: blend('width'),
    height: blend('height'),
  };
}
