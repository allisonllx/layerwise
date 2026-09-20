'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import type { Model } from '../lib/transformer';
import {
  lessonOperations,
  operationCalculation,
  type ProjectionChoice,
  type MlpChoice,
} from '../lib/lesson-transitions';
import { heatmapCell } from '../lib/heatmap';

const clamp = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (x: number) => {
  const t = clamp(x);
  return t * t * (3 - 2 * t);
};
export default function OperationTransition({
  model,
  words,
  step,
  token,
  projection,
  mlp,
  zoom,
  finalScale,
  focusToken,
  children,
}: {
  model: Model;
  words: string[];
  step: number;
  token: number;
  projection: ProjectionChoice;
  mlp: MlpChoice;
  zoom: number;
  finalScale: number;
  focusToken: boolean;
  children: ReactNode;
}) {
  const [progress, setProgress] = useState(0),
    [playing, setPlaying] = useState(false),
    [head, setHead] = useState(0),
    [feature, setFeature] = useState(0);
  const position = useRef(0);
  const operations = lessonOperations(
    model,
    step,
    token,
    head,
    projection,
    mlp,
    words,
  );
  const duration = operations.length * 5500 + 3000;
  const seek = (p: number) => {
    position.current = p;
    setProgress(p);
  };
  useEffect(() => {
    if (!playing) return;
    let frame = 0,
      last: number | undefined;
    const tick = (time: number) => {
      if (last !== undefined)
        position.current = Math.min(
          1,
          position.current + Math.min(100, time - last) / duration,
        );
      last = time;
      setProgress(position.current);
      if (position.current < 1) frame = requestAnimationFrame(tick);
      else setPlaying(false);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, duration]);
  const timeline = (progress / 0.84) * operations.length;
  const index = Math.min(operations.length - 1, Math.floor(timeline));
  const op = operations[index];
  const local = progress >= 0.84 ? 1 : timeline - index;
  const reveal = clamp((local - 0.12) / 0.7);
  const active = Math.min(
    op.output.length - 1,
    Math.floor(reveal * op.output.length),
  );
  const focus = playing ? active : Math.min(feature, op.output.length - 1);
  const handoff = smooth((progress - 0.86) / 0.14);
  const move = smooth((progress - 0.84) / 0.1);
  const rowMove = step === 11 && focusToken ? 0 : move;
  const scale = Math.max(
    1e-9,
    ...op.input.filter(Number.isFinite).map(Math.abs),
    ...op.output.filter(Number.isFinite).map(Math.abs),
    ...(op.other ?? []).map(Math.abs),
  );
  const rowX = (i: number, n: number) => 100 + i * Math.min(48, 624 / n);
  const cellWidth = (n: number) => Math.min(43, 624 / n - 3);
  const isTokenAxis = step === 6;
  const outputAxis =
    step === 11 && index >= 2
      ? 'vocabulary entries'
      : isTokenAxis
        ? 'key tokens'
        : 'features';
  const destination = (f: number) =>
    step === 6
      ? {
          x: 99 + head * 245 + f * Math.min(24, 164 / words.length),
          y: 82 + (8 - words.length) * 10 + token * 28,
          w: Math.min(24, 164 / words.length) - 4,
        }
      : {
          x: 94 + f * (op.output.length === 48 ? 10 : 25),
          y: 82 + (8 - words.length) * 10 + token * 28,
          w: (op.output.length === 48 ? 10 : 25) - 4,
        };
  const paint = (v: number) =>
    Number.isFinite(v) ? heatmapCell(v, scale, false).color : '#14232b';
  const number = (v: number) => (Number.isFinite(v) ? v.toFixed(2) : '−∞');
  const renderRow = (
    values: number[],
    y: number,
    name: string,
    output = false,
  ) => (
    <g>
      <text
        x="24"
        y={y - 15}
        fill="#aabcc5"
        fontSize="13"
        opacity={output ? 1 - move : 1}
      >
        {name} · [1, {values.length}]
      </text>
      {values.map((v, i) => {
        const target = destination(i),
          visible = output ? smooth((reveal * values.length - i) * 2) : 1;
        const shift = output ? rowMove : 0;
        const joinGap =
          op.kind === 'join'
            ? Math.floor(i / 4) * 38 * (output ? 1 - reveal : 1)
            : 0;
        const x =
          (rowX(i, values.length) + joinGap) * (1 - shift) + target.x * shift;
        const yy = y * (1 - shift) + target.y * shift;
        return (
          <g key={i} opacity={visible}>
            <rect
              x={x}
              y={yy}
              width={cellWidth(values.length) * (1 - shift) + target.w * shift}
              height={30 * (1 - shift) + 22 * shift}
              rx="3"
              fill={
                output && move > 0
                  ? heatmapCell(
                      v,
                      scale * (1 - move) + finalScale * move,
                      (step === 6 || step === 11) && move === 1,
                    ).color
                  : paint(v)
              }
              stroke={
                i === focus ? '#e6ecef' : output ? '#70d2c4' : 'transparent'
              }
              strokeWidth={i === focus ? 2 : 1}
            />
            {values.length <= 12 && (
              <text
                x={x + cellWidth(values.length) / 2}
                y={yy + 19}
                textAnchor="middle"
                fill={
                  Number.isFinite(v) && !heatmapCell(v, scale, false).lightText
                    ? '#0b161c'
                    : '#dce5e8'
                }
                fontSize="10"
                opacity={1 - shift}
              >
                {number(v)}
              </text>
            )}
            <title>{`${name}, ${outputAxis} ${i}: ${Number.isFinite(v) ? v.toFixed(6) : '−∞'}`}</title>
            {output && (
              <text
                x={x + cellWidth(values.length) / 2}
                y={yy + 46}
                textAnchor="middle"
                fill="#8dabb6"
                fontSize="10"
                opacity={1 - shift}
              >
                {op.labels?.[i] ??
                  (values.length <= 12 ? `f${i}` : i % 4 === 0 ? i : '')}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
  return (
    <section
      className="operation-transition"
      aria-label="Guided transformation"
    >
      <div className="transformation-heading">
        <span className="section-label">
          {progress >= 0.84 ? 'REPEAT ACROSS TOKENS' : 'FOLLOW ONE TOKEN'}
        </span>
        <span>
          {progress === 1 ? 'Result' : `${index + 1} / ${operations.length}`}
        </span>
      </div>
      <p className="mix-caption">
        {progress >= 0.84
          ? 'The same operation applies to every token row. Explore the complete result below.'
          : op.caption}
      </p>
      <div
        className="operation-stages"
        role="group"
        aria-label="Transformation stages"
      >
        {operations.map((o, i) => (
          <button
            key={i}
            aria-pressed={index === i && progress < 0.84}
            onClick={() => {
              setPlaying(false);
              seek((i / operations.length) * 0.84);
            }}
          >
            {i + 1}. {o.title}
          </button>
        ))}
      </div>
      <div className="transformation-selectors">
        <span>
          Token {token} · {words[token]}
        </span>
        {step === 6 && (
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
                <option key={h} value={h}>
                  {h + 1}
                </option>
              ))}
            </select>
          </label>
        )}
        <button
          className="secondary"
          onClick={() => {
            setPlaying(false);
            seek(progress === 1 ? 0 : 1);
          }}
        >
          {progress === 1 ? 'Show transformation' : 'Show complete result'}
        </button>
      </div>
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
          <div style={{ width: `${zoom * 100}%`, minWidth: 640 }}>
            <svg
              viewBox="0 0 850 365"
              role="img"
              aria-label={`${op.title}: ${op.input.length} inputs become ${op.output.length} outputs`}
            >
              <g opacity={1 - move}>
                <text x="24" y="24" fill="#70d2c4" fontSize="15">
                  {op.title}
                </text>
                <text x="24" y="46" fill="#aabcc5" fontSize="12">
                  One token row · input columns:{' '}
                  {isTokenAxis
                    ? 'key tokens'
                    : step === 11 && index > 2
                      ? 'vocabulary entries'
                      : 'features'}{' '}
                  → output: {outputAxis}
                </text>
                {renderRow(
                  op.input,
                  index > 0 ? 245 - 160 * smooth(local / 0.12) : 85,
                  op.inputName,
                )}
                {op.other &&
                  renderRow(op.other, 154, op.otherName ?? 'Second input')}
                {op.kind === 'add' && (
                  <text x="65" y="175" fill="#70d2c4" fontSize="23">
                    +
                  </text>
                )}
                {op.kind === 'project' && (
                  <>
                    <text x="24" y="155" fill="#aabcc5" fontSize="13">
                      Weight column for output {active} · {op.input.length}{' '}
                      matching multiplications
                    </text>
                    {op.input.map((v, i) => (
                      <g key={i}>
                        <path
                          d={`M ${rowX(i, op.input.length) + cellWidth(op.input.length) / 2} 119 L ${rowX(active, op.output.length) + cellWidth(op.output.length) / 2} 230`}
                          stroke="#70d2c4"
                          opacity=".13"
                        />
                        <rect
                          x={rowX(i, op.input.length)}
                          y="170"
                          width={cellWidth(op.input.length)}
                          height="20"
                          fill={paint(op.weights![i][active])}
                          rx="3"
                        />
                        <title>{`${v.toFixed(4)} × ${op.weights![i][active].toFixed(4)}`}</title>
                      </g>
                    ))}
                  </>
                )}
                {op.kind === 'norm' && (
                  <text x="100" y="175" fill="#dce5e8" fontSize="15">
                    mean = {op.mean!.toFixed(4)} · √(variance + ε) ={' '}
                    {op.divisor!.toFixed(4)}
                  </text>
                )}
                {op.kind === 'exp' && (
                  <text x="100" y="175" fill="#dce5e8" fontSize="15">
                    exp(score − largest score) · largest = {op.mean!.toFixed(4)}
                  </text>
                )}
                {op.kind === 'divide' && (
                  <text x="100" y="175" fill="#dce5e8" fontSize="15">
                    Each contribution ÷ total {op.divisor!.toFixed(4)} → sum of
                    row = 1
                  </text>
                )}
                {op.kind === 'gelu' && (
                  <text x="100" y="175" fill="#dce5e8" fontSize="15">
                    GELU acts on each feature separately · 48 values in, 48
                    values out
                  </text>
                )}
                {op.kind === 'mask' && (
                  <text x="100" y="175" fill="#dce5e8" fontSize="15">
                    Key position &gt; query position {token} → −∞ → zero after
                    softmax
                  </text>
                )}
                {op.kind === 'join' && (
                  <text x="100" y="175" fill="#dce5e8" fontSize="15">
                    Head 1 (f0–3) | head 2 (f0–3) | head 3 (f0–3) → 12 features
                  </text>
                )}
              </g>
              {renderRow(op.output, 245, op.outputName, true)}
              <text
                x="24"
                y="340"
                fill="#aabcc5"
                fontSize="12"
                opacity={1 - move}
              >
                {op.kind === 'join'
                  ? 'Rearrangement only · no arithmetic'
                  : `${op.input.length} ${isTokenAxis ? 'key-token scores' : 'input features'} → ${op.output.length} ${outputAxis} · new values`}
              </text>
            </svg>
          </div>
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
        <summary>Inspect this operation’s arithmetic</summary>
        <label>
          Output {outputAxis}{' '}
          <input
            type="number"
            min="0"
            max={op.output.length - 1}
            value={focus}
            onChange={(e) => {
              setPlaying(false);
              setFeature(
                Math.max(
                  0,
                  Math.min(op.output.length - 1, Number(e.target.value) || 0),
                ),
              );
            }}
          />
        </label>
        <p>{operationCalculation(op, focus)}</p>
        <p>Inputs are rounded for display. Calculations use full precision.</p>
      </details>
    </section>
  );
}
