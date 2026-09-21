'use client';
import { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { type CnnModel, format } from './model';
import { steps } from './stages';
import { stageFocus } from './stage-focus';
import { heatmapCell } from '../../lib/heatmap';
export default function StagePlayer({
  model,
  step,
  channel,
  selected,
  onSelect,
  onChannel,
}: {
  model: CnnModel;
  step: number;
  channel: number;
  selected: number;
  onSelect: (i: number) => void;
  onChannel: (i: number) => void;
}) {
  const [progress, setProgress] = useState(0),
    [playing, setPlaying] = useState(false);
  const [classIndex, setClassIndex] = useState(0);
  const [feature, setFeature] = useState(0);
  const active = playing && progress < 100;
  const canvas = useRef<HTMLDivElement>(null);
  const frame = stageFocus(
    model,
    step,
    channel,
    selected,
    classIndex,
    feature,
    progress,
  );
  const d = frame.detail;
  const activeClass = frame.output;
  const activeFeature = frame.activeFeature;
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(
      () => setProgress((p) => Math.min(100, p + 1)),
      75,
    );
    return () => clearInterval(timer);
  }, [active]);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) setPlaying(false);
    });
    if (canvas.current) observer.observe(canvas.current);
    const pause = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener('visibilitychange', pause);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', pause);
    };
  }, []);
  const source =
    step === 0
      ? model.input
      : step === 2
        ? model.convolution[channel]
        : step === 3
          ? model.activated[channel]
          : step === 4
            ? model.pooled[frame.displayChannel]
            : step === 5
              ? [model.flattened]
              : [model.logits];
  const target =
    step === 0
      ? model.input
      : step === 2
        ? model.activated[channel]
        : step === 3
          ? model.pooled[frame.displayChannel]
          : step === 4
            ? [model.flattened]
            : step === 5
              ? [model.logits]
              : [model.probabilities];
  const scale = Math.max(
    0.1,
    ...source.flat().map(Math.abs),
    ...target.flat().map(Math.abs),
  );
  function grid(matrix: number[][], isOutput: boolean) {
    return (
      <div
        className="cnn-stage-grid"
        style={{
          gridTemplateColumns: `repeat(${matrix[0].length}, minmax(48px,1fr))`,
        }}
      >
        {matrix.flat().map((value, i) => {
          const highlighted = isOutput
            ? i === frame.output
            : frame.sources.includes(i);
          const fill = heatmapCell(
            value,
            step === 6 && isOutput ? 1 : scale,
            false,
          );
          const shown =
            !isOutput || frame.order.slice(0, frame.visible).includes(i);
          const label =
            (step >= 5 && isOutput) || step === 6
              ? `Class ${i === 0 ? 'A' : 'B'}`
              : step === 4 && isOutput
                ? `Feature ${i}`
                : `Row ${Math.floor(i / matrix[0].length)}, column ${i % matrix[0].length}`;
          return (
            <button
              key={i}
              className={'cnn-cell ' + (highlighted ? 'selected-output' : '')}
              style={
                shown
                  ? {
                      background:
                        step === 0 && !isOutput
                          ? `rgb(${[1, 1, 1].map(() => Math.round(value * 255)).join(',')})`
                          : fill.color,
                      color: fill.lightText ? '#e5eaf0' : '#0d1318',
                    }
                  : {}
              }
              aria-label={`${isOutput ? 'Output' : 'Input'} ${label}: ${shown ? format(value) : 'not revealed'}`}
              onClick={() => {
                if (step >= 5) {
                  if (step === 5 && !isOutput) setFeature(i);
                  else setClassIndex(i);
                  setProgress(0);
                  setPlaying(false);
                } else if (step === 4) {
                  const side = model.pooled[0].length;
                  const within = i % (side * side);
                  onChannel(
                    isOutput
                      ? Math.floor(i / (side * side))
                      : frame.displayChannel,
                  );
                  onSelect(
                    Math.floor(within / side) *
                      2 *
                      model.convolution[0].length +
                      (within % side) * 2,
                  );
                  setProgress(0);
                  setPlaying(false);
                } else if (step === 0 || step === 2) {
                  onSelect(i);
                  setProgress(0);
                  setPlaying(false);
                } else if (step === 3) {
                  const rr = isOutput
                    ? Math.floor(i / target[0].length) * 2
                    : Math.floor(i / source[0].length);
                  const cc = isOutput
                    ? (i % target[0].length) * 2
                    : i % source[0].length;
                  onSelect(rr * model.convolution[0].length + cc);
                  setProgress(0);
                  setPlaying(false);
                }
              }}
            >
              {step === 0 && !isOutput
                ? ''
                : shown
                  ? step === 6 && isOutput
                    ? `${(value * 100).toFixed(1)}%`
                    : format(value)
                  : '·'}
            </button>
          );
        })}
      </div>
    );
  }
  return (
    <div className="canvas" ref={canvas}>
      <div className="canvas-toolbar">
        <span>
          <i className="live-dot" />
          {progress < 45
            ? 'Follow one calculation'
            : 'Extend to the complete result'}
        </span>
        <button
          className="secondary"
          onClick={() => {
            setProgress(100);
            setPlaying(false);
          }}
        >
          Show complete result
        </button>
      </div>
      <div className="cnn-stage-pair">
        <section>
          <h3 className="cnn-input-tone">
            {step === 0
              ? 'Grayscale image'
              : step === 2
                ? 'Convolution output'
                : step === 3
                  ? 'After ReLU'
                  : step === 4
                    ? `Pooled channel ${frame.displayChannel}`
                    : step === 5
                      ? 'All pooled features'
                      : 'Class logits'}
          </h3>
          <p className="cnn-axis">
            {step < 5 ? 'Rows (↓) · Columns (→)' : 'Features / classes (→)'} ·
            indices from 0
          </p>
          {grid(source, false)}
        </section>
        <span className="cnn-operator" aria-hidden="true">
          →
        </span>
        <section>
          <h3 className="cnn-output-tone">
            {step === 0 ? 'Pixel values' : steps[step].short + ' output'}
          </h3>
          <p className="cnn-axis">
            {step === 4
              ? 'Channel 0, then channel 1'
              : step >= 5
                ? 'Class A · Class B'
                : 'Same channel · rows (↓), columns (→)'}
          </p>
          {grid(target, true)}
        </section>
      </div>
      <div className="cnn-stage-explanation">
        <span className="section-label">
          {step === 4 ? 'PRESERVE THE VALUE' : 'CURRENT CALCULATION'}
        </span>
        <pre>
          {step === 5
            ? `Class ${activeClass === 0 ? 'A' : 'B'} · feature ${activeFeature}: ${format(model.flattened[activeFeature])} × (${format(model.weights[activeFeature][activeClass])}) = ${format(model.flattened[activeFeature] * model.weights[activeFeature][activeClass])}\n${frame.products} of ${model.flattened.length} products added · sum + bias = ${format(model.bias[activeClass] + frame.featureOrder.slice(0, frame.products).reduce((sum, i) => sum + model.flattened[i] * model.weights[i][activeClass], 0))}`
            : step === 6
              ? progress < 25
                ? `Subtract max: ${format(model.logits[activeClass])} − ${format(Math.max(...model.logits))} = ${format(model.logits[activeClass] - Math.max(...model.logits))}`
                : progress < 45
                  ? `Exponentiate: exp(${format(model.logits[activeClass] - Math.max(...model.logits))}) = ${format(model.exponentials[activeClass])}`
                  : `Normalise: ${format(model.exponentials[activeClass])} / ${format(model.denominator)} = ${format(model.probabilities[activeClass])}`
              : d.calculation}
        </pre>
        {step === 4 && (
          <p>
            Both channels appear in the vector. Features 0–
            {model.flattened.length / 2 - 1} come from channel 0; the remaining
            features come from channel 1.
          </p>
        )}
        {step === 5 && (
          <p>
            Weights: first-channel features use [0.30, −0.20]; second-channel
            features use [−0.20, 0.30]. Bias = [0.10, −0.10].
          </p>
        )}
      </div>
      <div className="transformation cnn-playback">
        <div className="transformation-controls">
          <button
            className="secondary"
            onClick={() => {
              if (progress === 100) setProgress(0);
              setPlaying(!active);
            }}
          >
            {active ? (
              <Pause size={16} />
            ) : progress === 100 ? (
              <RotateCcw size={16} />
            ) : (
              <Play size={16} />
            )}{' '}
            {active ? 'Pause' : progress === 100 ? 'Replay' : 'Play'}
          </button>
          <input
            aria-label="Stage progress"
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={(e) => {
              setPlaying(false);
              setProgress(Number(e.target.value));
            }}
          />
        </div>
        <p className="transformation-note">
          Play or drag at your own pace. The highlighted location connects the
          input to its output.
        </p>
      </div>
    </div>
  );
}
