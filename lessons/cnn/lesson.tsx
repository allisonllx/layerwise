'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import ChannelOverview from './channel-overview';
import { useMapFlight } from './use-map-flight';
import { useSceneHeight } from './use-scene-height';
import CnnShape from './shape';

import { Play, Pause, RotateCcw } from 'lucide-react';

import { heatmapCell } from '../../lib/heatmap';
import { kernels, convolve, contributions, format } from './model';

export default function ConvolutionStep({
  image,
  kernelIndex,
  setKernelIndex,
  stride,
  setStride,
  selected,
  setSelected,
  navigation,
}: {
  navigation: ReactNode;
  image: number[][];
  kernelIndex: number;
  setKernelIndex: (n: number) => void;
  stride: number;
  setStride: (n: number) => void;
  selected: number;
  setSelected: (n: number) => void;
}) {
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const isPlaying = playing && progress < 100;
  const [answer, setAnswer] = useState<number | null>(null);
  const animation = useRef<HTMLDivElement>(null);
  const overviewAmount = Math.max(0, Math.min(1, (progress - 65) / 35));
  const sceneRef = useRef<HTMLDivElement>(null);
  const sourceMapRef = useRef<HTMLDivElement>(null);
  const targetMapRef = useRef<HTMLDivElement>(null);
  const flightStyle = useMapFlight(
    sceneRef,
    sourceMapRef,
    targetMapRef,
    overviewAmount,
  );
  const sceneStyle = useSceneHeight(
    sceneRef,
    Math.min(1, overviewAmount / 0.36),
  );
  const operationProgress = Math.min(100, progress / 0.65);
  const kernel = kernels[kernelIndex];
  const output = convolve(image, kernel.values, stride);
  const size = output.length;
  const order = [
    selected,
    ...output
      .flat()
      .map((_, i) => i)
      .filter((i) => i !== selected),
  ];
  const revealed =
    operationProgress < 35
      ? 0
      : Math.min(
          order.length,
          1 + Math.floor(((operationProgress - 35) / 65) * (order.length - 1)),
        );
  const active =
    operationProgress > 35 ? order[Math.max(0, revealed - 1)] : selected;
  const row = Math.floor(active / size),
    col = active % size;
  const terms = contributions(image, kernel.values, row, col, stride);
  const count =
    operationProgress >= 25 ? 9 : Math.floor((operationProgress / 25) * 9);
  const sum = terms.slice(0, count).reduce((s, term) => s + term.product, 0);
  const maps = kernels.map((k) => convolve(image, k.values, stride));
  const scale = Math.max(0.1, ...maps.flat(2).map(Math.abs));
  const stage =
    operationProgress < 25
      ? '1 · Multiply matching values'
      : operationProgress < 35
        ? '2 · Add the nine products'
        : operationProgress < 100
          ? '3 · Reuse the kernel across the image'
          : 'One kernel, one complete feature map';
  const reset = () => {
    setPlaying(false);
    setProgress(0);
  };
  useEffect(() => {
    if (!isPlaying) return;
    let previous = performance.now();
    let timer: number;
    const tick = () => {
      const now = performance.now();
      const delta = (now - previous) / 90;
      previous = now;
      setProgress((p) => Math.min(100, p + delta));
      timer = requestAnimationFrame(tick);
    };
    timer = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(timer);
  }, [isPlaying]);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) setPlaying(false);
    });
    if (animation.current) observer.observe(animation.current);
    const pause = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener('visibilitychange', pause);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', pause);
    };
  }, []);
  function choose(index: number) {
    setSelected(index);
    reset();
  }
  const paint = (value: number, max: number) => {
    const color = heatmapCell(value, max, false);
    return {
      background: color.color,
      color: color.lightText ? '#e5eaf0' : '#0d1318',
    };
  };
  return (
    <div className="cnn-convolution-step">
      <div className="canvas" ref={animation}>
        <div className="canvas-toolbar">
          <span>
            <i className="live-dot" />
            {overviewAmount > 0
              ? overviewAmount < 0.48
                ? '4 · This map is one feature channel'
                : '5 · Another filter, another channel'
              : stage}
          </span>
          <span className="cnn-stage-count">
            {overviewAmount > 0
              ? `2 × ${size} × ${size} outputs`
              : `${revealed} / ${size * size} outputs`}
          </span>
        </div>
        <div
          className="cnn-scene"
          ref={sceneRef}
          style={
            sceneStyle && flightStyle && overviewAmount > 0
              ? {
                  height: Math.max(
                    sceneStyle.height,
                    flightStyle.top + flightStyle.height + 24,
                  ),
                }
              : sceneStyle
          }
        >
          <div
            className="cnn-focus-scene"
            aria-hidden={overviewAmount >= 0.5}
            inert={overviewAmount >= 0.5}
            style={{
              opacity: Math.max(0, 1 - overviewAmount / 0.22),
            }}
          >
            <div className="cnn-diagram">
              <div className="cnn-matrix-block">
                <h3>
                  Image <small>input values</small>
                </h3>
                <p className="cnn-axis">Rows (↓) · Columns (→) · from 0</p>
                <div
                  className="cnn-grid cnn-image"
                  style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}
                >
                  {image.flatMap((values, r) =>
                    values.map((value, c) => {
                      const inPatch =
                        r >= row * stride &&
                        r < row * stride + 3 &&
                        c >= col * stride &&
                        c < col * stride + 3;
                      const termIndex =
                        (r - row * stride) * 3 + c - col * stride;
                      return (
                        <span
                          key={`${r}-${c}`}
                          className={
                            'cnn-cell ' +
                            (inPatch ? 'in-patch ' : '') +
                            (inPatch &&
                            termIndex === count - 1 &&
                            operationProgress < 25
                              ? 'current-term'
                              : '')
                          }
                          style={{
                            background: `rgb(${[0, 0, 0].map(() => 28 + value * 195).join(',')})`,
                            color: value > 0.5 ? '#0d1318' : '#e5eaf0',
                          }}
                          title={`Image row ${r}, column ${c}: ${format(value)}`}
                        >
                          {value.toFixed(1)}
                        </span>
                      );
                    }),
                  )}
                </div>
                <p className="cnn-caption">
                  Outlined: rows {row * stride}–{row * stride + 2}, columns{' '}
                  {col * stride}–{col * stride + 2}
                </p>
              </div>
              <span className="cnn-operator" aria-hidden="true">
                ×
              </span>
              <div className="cnn-matrix-block cnn-kernel-block">
                <h3>
                  Kernel <small>fixed weights</small>
                </h3>
                <p className="cnn-axis">Match each position</p>
                <div
                  className="cnn-grid"
                  style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}
                >
                  {kernel.values.flat().map((v, i) => (
                    <span
                      key={i}
                      className={
                        'cnn-cell ' +
                        (i === count - 1 && operationProgress < 25
                          ? 'current-term'
                          : '')
                      }
                      style={paint(v, 1)}
                    >
                      {v}
                    </span>
                  ))}
                </div>
                <p className="cnn-caption">3 × 3 · bias = 0</p>
              </div>
              <span className="cnn-operator" aria-hidden="true">
                →
              </span>
              <div className="cnn-matrix-block">
                <h3>
                  Feature map <small>computed output</small>
                </h3>
                <p className="cnn-axis">Rows (↓) · Columns (→) · from 0</p>
                <div
                  className="cnn-grid"
                  ref={sourceMapRef}
                  style={{
                    gridTemplateColumns: `repeat(${size}, 1fr)`,
                    visibility:
                      overviewAmount > 0 && flightStyle ? 'hidden' : undefined,
                  }}
                >
                  {output.flat().map((value, i) => (
                    <button
                      key={i}
                      className={
                        'cnn-cell ' + (i === active ? 'selected-output' : '')
                      }
                      style={
                        order.slice(0, revealed).includes(i)
                          ? paint(value, scale)
                          : {}
                      }
                      aria-label={`Follow output row ${Math.floor(i / size)}, column ${i % size}${order.slice(0, revealed).includes(i) ? `, value ${format(value)}` : ', not calculated yet'}`}
                      aria-pressed={selected === i}
                      onClick={() => choose(i)}
                    >
                      {order.slice(0, revealed).includes(i)
                        ? format(value)
                        : '·'}
                    </button>
                  ))}
                </div>
                <p className="cnn-caption">
                  Selected output: [{Math.floor(selected / size)},{' '}
                  {selected % size}]
                </p>
              </div>
            </div>
            <div className="cnn-calculation">
              <span className="section-label">
                PATCH → PRODUCTS → SUM · OUTPUT [{row}, {col}]
              </span>
              <div className="cnn-products">
                {terms.map((term, i) => (
                  <span key={i} className={i < count ? 'is-revealed' : ''}>
                    {format(term.value)} × ({term.weight})
                    <b>{i < count ? format(term.product) : '—'}</b>
                  </span>
                ))}
              </div>
              <div className="cnn-sum">
                <span>
                  {operationProgress < 25
                    ? `${count} of 9 products`
                    : 'All 9 products + zero bias'}
                </span>
                <strong>
                  {count === 0
                    ? 'Ready to multiply'
                    : `${operationProgress < 25 ? 'Running sum' : 'Output'} = ${format(sum)}`}
                </strong>
              </div>
            </div>
          </div>
          {
            <div
              className="cnn-overview-scene"
              inert={overviewAmount < 0.5}
              aria-hidden={overviewAmount < 0.5}
            >
              <ChannelOverview
                maps={maps}
                convolution
                selectedGridRef={targetMapRef}
                hideSelectedGrid={overviewAmount < 1}
                channel={kernelIndex}
                amount={Math.max(
                  0,
                  Math.min(1, (overviewAmount - 0.85) / 0.15),
                )}
                onInspect={(c, i) => {
                  setKernelIndex(c);
                  choose(i);
                }}
              />
            </div>
          }
          {overviewAmount > 0 && overviewAmount < 1 && flightStyle && (
            <div
              className="cnn-map-flight"
              aria-hidden="true"
              style={{
                ...flightStyle,
                gridTemplateColumns: `repeat(${size}, 1fr)`,
              }}
            >
              {output.flat().map((value, i) => (
                <span className="cnn-cell" key={i} style={paint(value, scale)}>
                  {format(value)}
                </span>
              ))}
              <span
                className="cnn-flight-label"
                style={{
                  opacity: Math.max(
                    0,
                    1 - Math.abs(overviewAmount - 0.4) / 0.25,
                  ),
                }}
              >
                This same map becomes feature channel {kernelIndex}
              </span>
            </div>
          )}
        </div>
        <div className="transformation cnn-playback">
          <div className="transformation-controls">
            <button
              className="secondary"
              onClick={() => {
                if (progress >= 100) setProgress(0);
                setPlaying(!isPlaying);
              }}
            >
              {isPlaying ? (
                <Pause size={16} />
              ) : progress >= 100 ? (
                <RotateCcw size={16} />
              ) : (
                <Play size={16} />
              )}{' '}
              {isPlaying ? 'Pause' : progress >= 100 ? 'Replay' : 'Play'}
            </button>
            <button
              className="icon-button"
              aria-label="Reset convolution animation"
              onClick={reset}
            >
              <RotateCcw size={16} />
            </button>
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={progress}
              aria-label="Convolution progress"
              aria-valuetext={`${Math.round(progress)} percent: ${overviewAmount > 0 ? (overviewAmount < 0.48 ? '4 · This map is one feature channel' : '5 · Another filter, another channel') : stage}`}
              onChange={(e) => {
                setPlaying(false);
                setProgress(Number(e.target.value));
              }}
            />
          </div>
          <p className="transformation-note">
            Drag to explore at your own pace. Each output uses a new patch and
            the same nine weights.
          </p>
        </div>
      </div>
      <p className="rounding-note">
        Displayed numbers are rounded to 2 decimal places; calculations use full
        precision. Adding displayed values can differ slightly from the shown
        result.
      </p>
      <section className="journey-takeaway">
        <span className="section-label">TAKE ONE IDEA WITH YOU</span>
        <h2>A filter is reused, not reinvented.</h2>
        <p>
          One patch produces one output value. Moving the same kernel across the
          image builds a feature map. A positive value here means more
          brightness on the{' '}
          {kernelIndex === 0 ? 'right than the left' : 'bottom than the top'} of
          that patch; it is not a prediction or a probability. Both maps pass
          through ReLU and pooling separately. Later, the dense layer combines
          values from both. Two filters keep this example small; trained CNNs
          usually learn many filters from data.
        </p>
      </section>
      {navigation}
      <section className="journey-depth">
        <div className="depth-heading">
          <h2>Go deeper, when you’re ready.</h2>
          <p>
            The main idea stands on its own. Open a question to connect the
            picture to the details.
          </p>
        </div>
        <details className="journey-detail">
          <summary>Where did these inputs come from?</summary>
          <div className="cnn-detail-body">
            <p>
              <b className="cnn-input-tone">Image:</b> a hand-made 6 × 6
              grayscale example. Values from 0 (dark) to 1 (bright) describe one
              input channel.
            </p>
            <p>
              <b className="cnn-weight-tone">Kernel:</b> nine hand-chosen
              parameters. A trained CNN would learn its weights and bias from
              data. The image changes at each position; these weights are
              shared.
            </p>
            <p>
              <b className="cnn-output-tone">Feature map:</b> the signed results
              of this convolution. No activation, pooling or classifier has been
              applied yet. One input pixel can contribute to several overlapping
              output patches.
            </p>
          </div>
        </details>
        <details className="journey-detail">
          <summary>How do the dimensions fit?</summary>
          <div className="cnn-detail-body">
            <p>
              Axis order: [batch, channels, height, width]. This example
              processes one grayscale image with two filters. Each filter
              creates its own feature map; the diagram inspects the selected
              one. There is no padding: the window must fit entirely inside the
              image.
            </p>
            <label className="cnn-stride">
              Stride (how many pixels the window moves){' '}
              <select
                value={stride}
                onChange={(e) => {
                  setStride(Number(e.target.value));
                  setSelected(0);
                  reset();
                }}
              >
                <option value={1}>1 pixel</option>
                <option value={2}>2 pixels</option>
              </select>
            </label>
            <div className="cnn-shapes">
              <p>
                <b className="cnn-input-tone">Input</b>
                <CnnShape kind="input" size={size} />
              </p>
              <p>
                <b className="cnn-weight-tone">Weights</b>
                <CnnShape kind="weights" size={size} />
              </p>
              <p>
                <b className="cnn-output-tone">Output</b>
                <CnnShape kind="output" size={size} />
              </p>
            </div>
            <dl className="cnn-axis-key" aria-label="Dimension colour key">
              <div>
                <dt className="cnn-axis-batch">B</dt>
                <dd>images in the batch</dd>
              </div>
              <div>
                <dt className="cnn-axis-channel">Cᵢₙ / Cₒᵤₜ</dt>
                <dd>input / output channels</dd>
              </div>
              <div>
                <dt className="cnn-axis-spatial">H / W</dt>
                <dd>height / width</dd>
              </div>
              <div>
                <dt className="cnn-axis-kernel">Kₕ / K𝓌</dt>
                <dd>kernel height / width</dd>
              </div>
            </dl>
            <p>
              Each spatial output size = floor((6 − 3) / {stride}) + 1 = {size}.
              Larger stride means fewer window placements.
            </p>
            <p>
              Both filters see the same input image. With more input channels, a
              filter would sum contributions across all of them. More output
              filters would produce more feature maps.
            </p>
          </div>
        </details>
        <details className="journey-detail">
          <summary>How would I write this?</summary>
          <div className="cnn-detail-body">
            <span className="section-label">
              PSEUDOCODE · ONE INPUT AND OUTPUT CHANNEL
            </span>
            <pre>{`for row, col in output_positions:
    patch = image[row*stride : row*stride+3,
                  col*stride : col*stride+3]
    output[row, col] = sum(patch * kernel) + 0`}</pre>
            <p>
              Multiply matching positions, then sum all nine products. CNN
              libraries call this convolution, although the kernel is not
              flipped (technically, cross-correlation).
            </p>
          </div>
        </details>
        <details className="journey-detail">
          <summary>How was this number calculated?</summary>
          <div className="cnn-detail-body">
            <p>
              Selected output [{Math.floor(selected / size)}, {selected % size}]
              uses this dot product, plus a bias of zero:
            </p>
            <div className="cnn-arithmetic">
              {contributions(
                image,
                kernel.values,
                Math.floor(selected / size),
                selected % size,
                stride,
              ).map((term, i) => (
                <p key={i}>
                  Image [{term.row}, {term.col}]:{' '}
                  <span className="cnn-input-tone">{format(term.value)}</span> ×
                  (<span className="cnn-weight-tone">{term.weight}</span>) ={' '}
                  <span className="cnn-output-tone">
                    {format(term.product)}
                  </span>
                </p>
              ))}
            </div>
            <p>
              <b className="cnn-output-tone">
                Sum + 0 ={' '}
                {format(output[Math.floor(selected / size)][selected % size])}
              </b>
            </p>
          </div>
        </details>
        <details className="journey-detail intuition-check">
          <summary>
            Try a quick prediction <span>optional</span>
          </summary>
          <div className="intuition-body">
            <p>
              With this 6 × 6 image, a 3 × 3 kernel and no padding, how wide is
              the output when stride is 2?
            </p>
            <div className="intuition-options">
              {[2, 3, 4].map((n) => (
                <button
                  key={n}
                  className="secondary"
                  aria-pressed={answer === n}
                  onClick={() => setAnswer(n)}
                >
                  {n} columns
                </button>
              ))}
            </div>
            {answer !== null && (
              <output className="cnn-answer">
                {answer === 2 ? 'Yes.' : 'Not quite.'} The window starts at
                columns 0 and 2. A start at 4 would extend past the image. Two
                valid starts give two output columns.
              </output>
            )}
          </div>
        </details>
      </section>
    </div>
  );
}
