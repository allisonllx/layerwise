'use client';
import TokenSelector from './token-selector';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import type { Model } from '../lib/transformer';
import HeadLabels from './head-labels';
import { heatmapCell, heatmapScale } from '../lib/heatmap';

export default function ValueMixing({
  model,
  words,
  token,
  onTokenChange,
  children,
}: {
  model: Model;
  words: string[];
  token: number;
  onTokenChange: (token: number) => void;
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
          position.current + Math.min(time - previous, 100) / 17000,
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
    progress < 0.16
      ? 0
      : progress < 0.36
        ? 1
        : progress < 0.54
          ? 2
          : progress < 0.72
            ? 3
            : progress < 0.84
              ? 4
              : progress < 0.96
                ? 5
                : 6;
  const smooth = (start: number, end: number) => {
    const t = Math.max(0, Math.min(1, (progress - start) / (end - start)));
    return t * t * (3 - 2 * t);
  };
  const outputY = 64 + words.length * 32 + 12;
  const sceneHeight = outputY + 70;
  const place = smooth(0.73, 0.83);
  const revealRows = smooth(0.84, 0.89);
  const revealHeads = smooth(0.89, 0.96);
  const handoff = smooth(0.96, 1);
  const fadeInputs = 1 - smooth(0.72, 0.79);
  const captions = [
    `Follow query “${words[token]}”: its attention row assigns one weight to each key token.`,
    'Each key token has a value vector: four features in this head. Match tokens across the two inputs.',
    'Multiply each attention weight by all four features of its matching value vector. Masked future tokens contribute zero.',
    `Add down each feature column. These four sums form the new feature row for “${words[token]}”.`,
    `Place “${words[token]}” into its row in head ${head + 1}. The four features stay together.`,
    'Now repeat for the other query tokens, then for the other heads.',
    'The complete result is ready to explore. Rows are query tokens; columns are features.',
  ];
  const weights = model.attention[head][token];
  const values = model.vh[head];
  const scale = heatmapScale(model.vh, false);
  const collapse = smooth(0.56, 0.68);
  const resultScale = heatmapScale(model.context, false);
  const cellX = (h: number, f: number) => ((99 + h * 245 + f * 29) * 800) / 850;
  const cellY = (r: number) =>
    ((82 + (8 - words.length) * 10 + r * 28) * 800) / 850;
  return (
    <section
      className="value-mixing"
      aria-label="Attention weights to mixed features"
    >
      <div className="transformation-heading">
        <span className="section-label">WEIGHTS → MIXED FEATURES</span>
        <span>{stage + 1} / 7</span>
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
        <TokenSelector
          words={words}
          token={token}
          query
          onChange={(next) => {
            setPlaying(false);
            onTokenChange(next);
          }}
        />
        <button
          className="secondary"
          onClick={() => {
            setPlaying(false);
            seek(progress === 1 ? 0 : 1);
          }}
        >
          {progress === 1 ? 'Back to animation' : 'Skip to result'}
        </button>
      </div>
      <p className="result-shortcut-note">
        {progress === 1
          ? 'You’re viewing this step’s final result. Back to animation returns to the start, paused.'
          : 'Skip to result skips this animation and opens the current step’s finished heatmap. It does not advance the lesson.'}
      </p>
      <div className="mix-stage">
        <div
          className="mix-result"
          style={{
            opacity: handoff,
            pointerEvents: progress === 1 ? 'auto' : 'none',
          }}
          inert={progress !== 1}
          aria-hidden={progress !== 1}
        >
          {children}
        </div>
        <div
          className="diagram-scroll mix-animation"
          style={{
            opacity: 1 - handoff,
            pointerEvents: progress === 1 ? 'none' : 'auto',
          }}
          aria-hidden={progress === 1}
        >
          <svg
            viewBox={`0 0 800 ${sceneHeight}`}
            style={{ width: '100%', minWidth: 640 }}
            role="img"
            aria-label="Attention weights multiply matching value vectors; weighted vectors sum into one feature row"
          >
            <g opacity={fadeInputs}>
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
                    transform={`translate(0,${(outputY - 64 - k * 32) * collapse})`}
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
            </g>
            {stage >= 4 &&
              model.context.map((panel, h) => (
                <g key={h} opacity={h === head ? place : revealHeads}>
                  <g transform={`scale(${800 / 850})`}>
                    <HeadLabels head={h} />
                  </g>
                  {panel.map((row, r) => (
                    <g
                      key={r}
                      opacity={h === head && r !== token ? revealRows : 1}
                    >
                      <text
                        x={cellX(h, 0) - 7}
                        y={cellY(r) + 14}
                        textAnchor="end"
                        fill={r === token ? '#70d2c4' : '#8599a4'}
                        fontSize="11"
                      >
                        {words[r]}
                      </text>
                      {row.map((v, f) =>
                        h === head && r === token ? null : (
                          <rect
                            key={f}
                            x={cellX(h, f)}
                            y={cellY(r)}
                            width={(25 * 800) / 850}
                            height={(23 * 800) / 850}
                            rx="3"
                            fill={heatmapCell(v, resultScale, false).color}
                          />
                        ),
                      )}
                    </g>
                  ))}
                </g>
              ))}
            {stage >= 3 && (
              <g opacity={Math.max(0.2, collapse)}>
                <text
                  x="22"
                  y={outputY + 19}
                  opacity={1 - place}
                  fill="#70d2c4"
                  fontSize="14"
                >
                  Output row · {words[token]}
                </text>
                {model.context[head][token].map((v, f) => (
                  <g key={f}>
                    <rect
                      x={(520 + f * 55) * (1 - place) + cellX(head, f) * place}
                      y={outputY * (1 - place) + cellY(token) * place}
                      width={49 * (1 - place) + ((25 * 800) / 850) * place}
                      height={28 * (1 - place) + ((23 * 800) / 850) * place}
                      rx="4"
                      fill={
                        heatmapCell(
                          v,
                          scale * (1 - place) + resultScale * place,
                          false,
                        ).color
                      }
                      stroke="#70d2c4"
                    />
                    <text
                      x={
                        (544 + f * 55) * (1 - place) +
                        (cellX(head, f) + 12) * place
                      }
                      y={
                        (outputY + 19) * (1 - place) +
                        (cellY(token) + 16) * place
                      }
                      textAnchor="middle"
                      fill={
                        heatmapCell(v, scale, false).lightText
                          ? '#dce5e8'
                          : '#0b161c'
                      }
                      fontSize="11"
                      opacity={1 - place}
                    >
                      {v.toFixed(3)}
                    </text>
                  </g>
                ))}
              </g>
            )}
            <text
              x="22"
              y={sceneHeight - 12}
              opacity={fadeInputs}
              fill="#aabcc5"
              fontSize="13"
            >
              {stage < 3
                ? `One head: [1, ${words.length}] weights × [${words.length}, 4] value features`
                : 'One query → [1, 4] mixed features · the key-token axis is summed over'}
            </text>
          </svg>
        </div>
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
