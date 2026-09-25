import type { RefObject } from 'react';
import { heatmapCell } from '../../lib/heatmap';
import { format, kernels } from './model';
export default function ChannelOverview({
  maps,
  channel,
  amount,
  onInspect,
  flatten = false,
  selectedGridRef,
  hideSelectedGrid = false,
  convolution = false,
  vectorRef,
  hideVector = false,
  colorScale,
}: {
  maps: number[][][];
  channel: number;
  amount: number;
  onInspect: (channel: number, index: number) => void;
  flatten?: boolean;
  selectedGridRef?: RefObject<HTMLDivElement | null>;
  hideSelectedGrid?: boolean;
  convolution?: boolean;
  vectorRef?: RefObject<HTMLDivElement | null>;
  hideVector?: boolean;
  colorScale?: number;
}) {
  const scale = colorScale ?? Math.max(0.1, ...maps.flat(2).map(Math.abs));
  return (
    <section
      className="cnn-channel-overview"
      aria-label="Both feature channels"
      style={{ opacity: amount }}
    >
      <div className="cnn-overview-intro">
        <span className="section-label">
          {flatten
            ? 'BOTH CHANNELS → ONE VECTOR'
            : 'ZOOM OUT · BOTH FEATURE CHANNELS'}
        </span>
        <p>
          {flatten
            ? 'Channel 0 comes first, then channel 1. Every value keeps its position in this order.'
            : convolution
              ? 'Same image, two filters: one detects left–right contrast; the other detects top–bottom contrast. Each produces one feature channel.'
              : 'The focused result belongs to one map. Both maps continue together into the next step.'}
        </p>
      </div>
      <div className="cnn-channel-cards">
        {maps.map((map, c) => (
          <section
            key={c}
            className={
              'cnn-channel-card ' + (channel === c ? 'is-inspected' : '')
            }
          >
            <h3>
              Feature channel {c}
              <small>
                {kernels[c].name}
                {channel === c ? ' · inspected' : ''}
              </small>
            </h3>
            <div
              className="cnn-grid"
              ref={c === channel ? selectedGridRef : undefined}
              style={{
                gridTemplateColumns: `repeat(${map[0].length},1fr)`,
                visibility:
                  c === channel && hideSelectedGrid ? 'hidden' : undefined,
              }}
            >
              {map.flat().map((value, i) => {
                const color = heatmapCell(value, scale, false);
                return (
                  <button
                    className="cnn-cell"
                    key={i}
                    onClick={() => onInspect(c, i)}
                    aria-label={`Inspect channel ${c}, row ${Math.floor(i / map[0].length)}, column ${i % map[0].length}: ${format(value)}`}
                    style={{
                      background: color.color,
                      color: color.lightText ? '#e5eaf0' : '#0d1318',
                    }}
                  >
                    {format(value)}
                  </button>
                );
              })}
            </div>
            {flatten && (
              <p className="cnn-caption">
                Vector positions {c * map.flat().length}–
                {(c + 1) * map.flat().length - 1}
              </p>
            )}
          </section>
        ))}
      </div>
      {flatten && (
        <div className="cnn-overview-vector">
          <h3>One feature vector · channel 0, then channel 1</h3>
          <div
            className="cnn-stage-grid"
            ref={vectorRef}
            style={{
              visibility: hideVector ? 'hidden' : undefined,
              gridTemplateColumns: `repeat(${maps.flat(2).length}, minmax(48px, 1fr))`,
            }}
          >
            {maps.flat(2).map((value, i) => {
              const count = maps[0].flat().length;
              const color = heatmapCell(value, scale, false);
              return (
                <button
                  key={i}
                  className="cnn-cell"
                  aria-label={`Inspect feature ${i}, channel ${Math.floor(i / count)}: ${format(value)}`}
                  onClick={() => onInspect(Math.floor(i / count), i % count)}
                  style={{
                    background: color.color,
                    color: color.lightText ? '#e5eaf0' : '#0d1318',
                  }}
                >
                  {format(value)}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <p className="cnn-caption">
        One colour scale across both channels. Select a cell to return to its
        calculation.
      </p>
    </section>
  );
}
