/** One scale across all rows and heads. Selection never changes value colours. */
export function heatmapScale(panels: number[][][], probabilities: boolean) {
  return probabilities ? 1 : Math.max(1e-9, ...panels.flat(2).map(Math.abs));
}
export function heatmapCell(
  value: number,
  scale: number,
  probabilities: boolean,
  focused: boolean = false,
) {
  const amount = Math.min(1, Math.abs(value) / scale);
  const base = [24, 36, 44],
    target = probabilities || value >= 0 ? [112, 210, 196] : [231, 153, 131];
  const color = `rgb(${base.map((v, i) => Math.round(v + (target[i] - v) * amount)).join(', ')})`;
  return { color, opacity: focused ? 0.2 : 1, lightText: amount < 0.5 };
}
