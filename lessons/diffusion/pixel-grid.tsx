'use client';
export default function PixelGrid({
  values,
  side = 8,
  title,
  caption,
  selected,
  onSelect,
  tone = 'image',
}: {
  values: number[];
  side?: number;
  title: string;
  caption?: string;
  selected?: number;
  onSelect?: (i: number) => void;
  tone?: 'image' | 'signed' | 'error';
}) {
  function color(v: number) {
    if (tone === 'image') {
      const c = Math.round(Math.max(0, Math.min(1, (v + 1) / 2)) * 255);
      return `rgb(${c},${c},${c})`;
    }
    if (tone === 'error')
      return `rgba(231,185,120,${0.07 + Math.min(1, v / 4) * 0.93})`;
    const a = Math.min(1, Math.abs(v) / 3);
    return v >= 0
      ? `rgba(124,219,207,${0.07 + 0.93 * a})`
      : `rgba(184,167,239,${0.07 + 0.93 * a})`;
  }
  return (
    <figure className="diff-pixels">
      <figcaption>{title}</figcaption>
      <div
        className="diff-pixel-grid"
        style={{ gridTemplateColumns: `repeat(${side},1fr)` }}
      >
        {values.map((v, i) =>
          onSelect ? (
            <button
              key={i}
              style={{ background: color(v) }}
              className={i === selected ? 'selected' : ''}
              aria-label={`${title}, row ${Math.floor(i / side) + 1}, column ${(i % side) + 1}: ${v.toFixed(3)}`}
              aria-pressed={i === selected}
              onClick={() => onSelect(i)}
            />
          ) : (
            <span
              key={i}
              title={`Row ${Math.floor(i / side) + 1}, column ${(i % side) + 1}: ${v.toFixed(3)}`}
              style={{ background: color(v) }}
            />
          ),
        )}
      </div>
      {caption && <p>{caption}</p>}
    </figure>
  );
}
