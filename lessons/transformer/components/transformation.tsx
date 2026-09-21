'use client';
import TokenSelector from './token-selector';
import { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { runModel } from '../lib/transformer';
import { heatmapCell, heatmapScale } from '../../../lib/heatmap';
import type { Projection } from './tensor-canvas';

type Props = {
  model: ReturnType<typeof runModel>;
  words: string[];
  step: number;
  token: number;
  onTokenChange: (token: number) => void;
  projection: Projection;
};
const hues = ['#70d2c4', '#e5b76d', '#baa2ed'];
const ease = (t: number) => t * t * (3 - 2 * t);
export default function Transformation({
  model,
  words,
  step,
  token,
  onTokenChange,
  projection,
}: Props) {
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [head, setHead] = useState(0);
  const [keyToken, setKeyToken] = useState(0);
  const position = useRef(0);
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let previous: number | undefined;
    const tick = (time: number) => {
      if (previous !== undefined)
        position.current = Math.min(
          1,
          position.current + Math.min(time - previous, 100) / 6000,
        );
      previous = time;
      setProgress(position.current);
      if (position.current < 1) frame = requestAnimationFrame(tick);
      else setPlaying(false);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);
  const seek = (p: number) => {
    position.current = p;
    setProgress(p);
  };
  const p = ease(progress);
  const matrix = model[projection];
  const scale = heatmapScale([matrix], false);
  const stage =
    progress === 0
      ? 'Input'
      : progress === 1
        ? 'Output'
        : step === 5
          ? 'Multiply · sum · scale'
          : 'Rearranging';
  const products = model.qh[head][token].map(
    (q, f) => q * model.kh[head][keyToken][f],
  );
  const count = Math.min(4, Math.floor(progress * 6));
  const sum = products.reduce((a, b) => a + b, 0);
  return (
    <section className="transformation" aria-label="Step transformation">
      <div className="transformation-heading">
        <span className="section-label">WATCH THE TRANSFORMATION</span>
        <span>{stage}</span>
      </div>
      <p>
        {step === 3
          ? 'Split each token’s 12 features into three groups of 4. Every value stays the same.'
          : step === 4
            ? 'Gather each head’s features across all tokens. Only the axis order changes; no values are recalculated.'
            : 'Follow one query–key pair: multiply matching features, add the four products, then divide by √4 = 2.'}
      </p>
      {step === 5 && (
        <div className="transformation-selectors">
          <label>
            Head{' '}
            <select
              value={head}
              onChange={(e) => {
                setHead(Number(e.target.value));
                setPlaying(false);
                seek(0);
              }}
            >
              {[0, 1, 2].map((h) => (
                <option value={h} key={h}>
                  {h + 1}
                </option>
              ))}
            </select>
          </label>
          <label>
            Key token{' '}
            <select
              value={keyToken}
              onChange={(e) => {
                setKeyToken(Number(e.target.value));
                setPlaying(false);
                seek(0);
              }}
            >
              {words.map((w, i) => (
                <option key={i} value={i}>
                  {i} · {w}
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
        </div>
      )}
      <div className="diagram-scroll">
        <svg
          viewBox={step === 5 ? '0 0 780 310' : '0 0 780 390'}
          style={{ minWidth: 640, width: '100%' }}
          role="img"
          aria-label={
            step === 5
              ? 'Four feature products combine into a scaled attention score'
              : 'The same feature cells move from input layout to output layout'
          }
        >
          {step < 5 ? (
            <>
              <text x="30" y="26" fill="#aabcc5" fontSize="14">
                {step === 3
                  ? `[1, ${words.length}, 12] → [1, ${words.length}, 3, 4]`
                  : `[1, ${words.length}, 3, 4] → [1, 3, ${words.length}, 4]`}
              </text>
              <text x="30" y="50" fill="#aabcc5" fontSize="13">
                {step === 3
                  ? 'Rows (↓) tokens · Columns (→) features'
                  : 'Token groups → head groups · same values, new axis order'}{' '}
                · tracking: {words[token]}
              </text>
              {[0, 1, 2].map((h) => (
                <text
                  key={h}
                  x={
                    step === 3
                      ? 92 + h * (144 + 24 * p)
                      : 16 + (92 + h * 224 - 16) * p
                  }
                  y={step === 3 ? 79 : 116 + h * 65 + (79 - 116 - h * 65) * p}
                  fill={hues[h]}
                  fontSize="13"
                >
                  HEAD {h + 1}
                </text>
              ))}
              {matrix.map((row, r) => (
                <g key={r}>
                  <text
                    x={step === 4 ? 92 + r * 82 + (24 - 92 - r * 82) * p : 24}
                    y={step === 4 ? 82 + (107 + r * 31 - 82) * p : 107 + r * 31}
                    fill={r === token ? '#70d2c4' : '#8599a4'}
                    fontSize="12"
                  >
                    {words[r]}
                  </text>
                  {row.map((v, c) => {
                    const h = Math.floor(c / 4),
                      f = c % 4;
                    const x =
                      step === 3
                        ? 90 + c * 36 + h * 24 * p
                        : 90 +
                          r * 82 +
                          f * 16 +
                          (90 + h * 224 + f * 36 - 90 - r * 82 - f * 16) * p;
                    const y =
                      step === 3
                        ? 90 + r * 31
                        : 100 + h * 65 + (90 + r * 31 - 100 - h * 65) * p;
                    return (
                      <g key={c} transform={`translate(${x},${y})`}>
                        <rect
                          width={step === 4 ? 13 + 17 * p : 30}
                          height="24"
                          rx="4"
                          fill={heatmapCell(v, scale, false).color}
                          stroke={r === token ? hues[h] : 'transparent'}
                          strokeWidth="2"
                        />
                        <title>
                          {words[r]} · head {h + 1}, feature {f}: {v.toFixed(5)}{' '}
                          (unchanged)
                        </title>
                      </g>
                    );
                  })}
                </g>
              ))}
              <text x="30" y="367" fill="#aabcc5" fontSize="14">
                {step === 3
                  ? '12 features = 3 heads × 4 features per head'
                  : 'One panel per head · every panel contains all tokens'}
              </text>
            </>
          ) : (
            <>
              <text x="24" y="26" fill={hues[head]} fontSize="14">
                HEAD {head + 1} · query “{words[token]}” × key “
                {words[keyToken]}”
              </text>
              <text x="24" y="67" fill="#aabcc5" fontSize="14">
                Q · query
              </text>
              <text x="24" y="114" fill="#aabcc5" fontSize="14">
                K · key
              </text>
              {products.map((v, f) => (
                <g key={f}>
                  <text x={192 + f * 139} y="48" fill="#8599a4" fontSize="12">
                    feature {f}
                  </text>
                  <text x={192 + f * 139} y="72" fill="#dce5e8" fontSize="16">
                    {model.qh[head][token][f].toFixed(3)}
                  </text>
                  <text x={213 + f * 139} y="94" fill={hues[head]}>
                    ×
                  </text>
                  <text x={192 + f * 139} y="117" fill="#dce5e8" fontSize="16">
                    {model.kh[head][keyToken][f].toFixed(3)}
                  </text>
                  <path d={`M ${219 + f * 139} 131 V 150`} stroke="#506772" />
                  <text
                    x={192 + f * 139}
                    y="177"
                    fill={count > f ? hues[head] : '#506772'}
                    fontSize="16"
                  >
                    {count > f ? v.toFixed(4) : '…'}
                  </text>
                  {f < 3 && (
                    <text x={287 + f * 139} y="177" fill="#aabcc5">
                      +
                    </text>
                  )}
                </g>
              ))}
              <text x="24" y="177" fill="#aabcc5" fontSize="14">
                Products
              </text>
              <text x="24" y="230" fill="#dce5e8" fontSize="17">
                {progress >= 0.72 ? `Sum = ${sum.toFixed(5)}` : 'Sum = …'}
              </text>
              <text x="24" y="271" fill={hues[head]} fontSize="18">
                {progress >= 0.88
                  ? `Score = ${sum.toFixed(5)} ÷ 2 = ${(sum / 2).toFixed(5)}`
                  : 'Score = sum ÷ √4'}
              </text>
            </>
          )}
        </svg>
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
              ? 'Replay'
              : 'Play'}
        </button>
        <button
          className="mini-button"
          aria-label="Reset transformation"
          onClick={() => {
            setPlaying(false);
            seek(0);
          }}
        >
          <RotateCcw size={16} />
        </button>
        <label>
          <span className="sr-only">Transformation progress</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.001"
            value={progress}
            onChange={(e) => {
              setPlaying(false);
              seek(Number(e.target.value));
            }}
          />
        </label>
        <output>{Math.round(progress * 100)}%</output>
      </div>
      <p className="transformation-note">
        Drag to explore at your own pace. Open “Explore the complete result”
        below to inspect every cell.
      </p>
    </section>
  );
}
