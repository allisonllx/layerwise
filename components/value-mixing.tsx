'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import type { Model } from '../lib/transformer';
import { heatmapCell, heatmapScale } from '../lib/heatmap';

export default function ValueMixing({
  model,
  words,
  token,
  children,
}: {
  model: Model;
  words: string[];
  token: number;
  children: ReactNode;
}) {
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [head, setHead] = useState(0);
  const position = useRef(0);
  const seek = (p: number) => {
    position.current = p;
    setProgress(p);
  };
  useEffect(() => {
    if (!playing) return;
    let frame = 0,
      previous: number | undefined;
    const tick = (time: number) => {
      if (previous !== undefined)
        position.current = Math.min(
          1,
          position.current + Math.min(time - previous, 100) / 12000,
        );
      previous = time;
      setProgress(position.current);
      if (position.current < 1) frame = requestAnimationFrame(tick);
      else setPlaying(false);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);
  const stage =
    progress < 0.2
      ? 0
      : progress < 0.48
        ? 1
        : progress < 0.72
          ? 2
          : progress < 0.92
            ? 3
            : 4;
  const captions = [
    `Follow query “${words[token]}”: its attention row assigns one weight to each key token.`,
    'Each key token has a value vector: four features in this head. Match tokens across the two inputs.',
    'Multiply each attention weight by all four features of its matching value vector. Masked future tokens contribute zero.',
    `Add down each feature column. These four sums form the new feature row for “${words[token]}”.`,
    'Repeat for every query and head. This is the complete, clickable result: rows are query tokens; columns are features.',
  ];
  const weights = model.attention[head][token];
  const values = model.vh[head];
  const scale = heatmapScale(model.vh, false);
  const collapse = Math.max(0, Math.min(1, (progress - 0.75) / 0.15));
  return (
    <section
      className="value-mixing"
      aria-label="Attention weights to mixed features"
    >
      <div className="transformation-heading">
        <span className="section-label">WEIGHTS → MIXED FEATURES</span>
        <span>{stage + 1} / 5</span>
      </div>
      <p className="mix-caption">{captions[stage]}</p>
      <div className="transformation-selectors">
        <label>
          Follow head{' '}
          <select
            value={head}
            onChange={(e) => {
              setHead(Number(e.target.value));
              setPlaying(false);
              seek(0);
            }}
          >
            {[0, 1, 2].map((h) => (
              <option key={h} value={h}>
                {h + 1}
              </option>
            ))}
          </select>
        </label>
        <span>
          Query: {token} · {words[token]}
        </span>
        <button
          className="secondary"
          onClick={() => {
            setPlaying(false);
            seek(progress >= 0.92 ? 0 : 1);
          }}
        >
          {progress >= 0.92 ? 'Show transformation' : 'Show complete result'}
        </button>
      </div>
      <div className="mix-stage">
        {stage === 4 ? (
          children
        ) : (
          <div className="diagram-scroll">
            <svg
              viewBox="0 0 800 420"
              style={{ width: '100%', minWidth: 640 }}
              role="img"
              aria-label="Attention weights multiply matching value vectors; weighted vectors sum into one feature row"
            >
              <text x="22" y="24" fill="#70d2c4" fontSize="15">
                A · attention weights
              </text>
              <text x="270" y="24" fill="#dce5e8" fontSize="15">
                V · value features
              </text>
              <text x="520" y="24" fill="#dce5e8" fontSize="15">
                {stage === 3 ? 'Sum each feature ↓' : 'Weighted features'}
              </text>
              <text x="22" y="48" fill="#aabcc5" fontSize="12">
                One query row, listed by key token ↓
              </text>
              {[0, 1, 2, 3].map((f) => (
                <g key={f}>
                  <text x={278 + f * 55} y="48" fill="#aabcc5" fontSize="12">
                    f{f}
                  </text>
                  <text x={528 + f * 55} y="48" fill="#aabcc5" fontSize="12">
                    f{f}
                  </text>
                </g>
              ))}
              {words.map((word, k) => (
                <g key={k}>
                  <text
                    x="22"
                    y={83 + k * 32}
                    fill={k === token ? '#70d2c4' : '#aabcc5'}
                    fontSize="13"
                  >
                    {k} · {word}
                  </text>
                  <rect
                    x="120"
                    y={64 + k * 32}
                    width="52"
                    height="26"
                    rx="4"
                    fill={heatmapCell(weights[k], 1, true).color}
                  />
                  <text
                    x="146"
                    y={82 + k * 32}
                    textAnchor="middle"
                    fill={weights[k] > 0.5 ? '#0b161c' : '#dce5e8'}
                    fontSize="12"
                  >
                    {weights[k].toFixed(3)}
                  </text>
                  <g opacity={stage >= 1 ? 1 : 0.12}>
                    <path
                      d={`M 180 ${77 + k * 32} H 258`}
                      stroke="#49616b"
                      strokeDasharray="3 4"
                    />
                    <text x="212" y={82 + k * 32} fill="#70d2c4">
                      ×
                    </text>
                    {values[k].map((v, f) => (
                      <g key={f}>
                        <rect
                          x={270 + f * 55}
                          y={64 + k * 32}
                          width="49"
                          height="26"
                          rx="4"
                          fill={heatmapCell(v, scale, false).color}
                        />
                        <text
                          x={294 + f * 55}
                          y={82 + k * 32}
                          textAnchor="middle"
                          fill={
                            heatmapCell(v, scale, false).lightText
                              ? '#dce5e8'
                              : '#0b161c'
                          }
                          fontSize="11"
                        >
                          {v.toFixed(3)}
                        </text>
                      </g>
                    ))}
                  </g>
                  <g
                    opacity={stage >= 2 ? 1 - collapse : 0.08}
                    transform={`translate(0,${(350 - 64 - k * 32) * collapse})`}
                  >
                    {values[k].map((v, f) => (
                      <g key={f}>
                        <rect
                          x={520 + f * 55}
                          y={64 + k * 32}
                          width="49"
                          height="26"
                          rx="4"
                          fill={heatmapCell(weights[k] * v, scale, false).color}
                        />
                        <text
                          x={544 + f * 55}
                          y={82 + k * 32}
                          textAnchor="middle"
                          fill={
                            heatmapCell(weights[k] * v, scale, false).lightText
                              ? '#dce5e8'
                              : '#0b161c'
                          }
                          fontSize="11"
                        >
                          {(weights[k] * v).toFixed(3)}
                        </text>
                      </g>
                    ))}
                  </g>
                </g>
              ))}
              {stage === 3 && (
                <g opacity={Math.max(0.2, collapse)}>
                  <text x="22" y="369" fill="#70d2c4" fontSize="14">
                    Output row · {words[token]}
                  </text>
                  {model.context[head][token].map((v, f) => (
                    <g key={f}>
                      <rect
                        x={520 + f * 55}
                        y="350"
                        width="49"
                        height="28"
                        rx="4"
                        fill={heatmapCell(v, scale, false).color}
                        stroke="#70d2c4"
                      />
                      <text
                        x={544 + f * 55}
                        y="369"
                        textAnchor="middle"
                        fill={
                          heatmapCell(v, scale, false).lightText
                            ? '#dce5e8'
                            : '#0b161c'
                        }
                        fontSize="11"
                      >
                        {v.toFixed(3)}
                      </text>
                    </g>
                  ))}
                </g>
              )}
              <text x="22" y="408" fill="#aabcc5" fontSize="13">
                {stage < 3
                  ? `One head: [1, ${words.length}] weights × [${words.length}, 4] value features`
                  : 'One query → [1, 4] mixed features · the key-token axis is summed over'}
              </text>
            </svg>
          </div>
        )}
      </div>
      <div className="transformation-controls">
        <button
          className="secondary"
          onClick={() => {
            if (progress === 1) seek(0);
            setPlaying(!playing);
          }}
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}{' '}
          {playing
            ? 'Pause'
            : progress === 1
              ? 'Replay transformation'
              : 'Play transformation'}
        </button>
        <button
          className="mini-button"
          aria-label="Reset value mixing transformation"
          onClick={() => {
            setPlaying(false);
            seek(0);
          }}
        >
          <RotateCcw size={16} />
        </button>
        <label>
          <span className="sr-only">Value mixing transformation progress</span>
          <input
            type="range"
            min="0"
            max="1"
            step=".001"
            value={progress}
            onChange={(e) => {
              setPlaying(false);
              seek(Number(e.target.value));
            }}
          />
        </label>
        <output>{Math.round(progress * 100)}%</output>
      </div>
      <details className="mix-arithmetic">
        <summary>See the arithmetic for this query</summary>
        {[0, 1, 2, 3].map((f) => (
          <p key={f}>
            Feature {f}:{' '}
            {weights
              .map((a, k) => `(${a.toFixed(3)} × ${values[k][f].toFixed(3)})`)
              .join(' + ')}{' '}
            = {model.context[head][token][f].toFixed(5)}
          </p>
        ))}
        <p>Displayed inputs are rounded; sums use full precision.</p>
      </details>
    </section>
  );
}
