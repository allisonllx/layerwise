'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import CnnShape from './shape';
import Link from 'next/link';
import { Layers3, Play, Pause, RotateCcw, ArrowRight } from 'lucide-react';
import LessonSwitcher from '../../components/lesson-switcher';
import { heatmapCell } from '../../lib/heatmap';
import { image, kernels, convolve, contributions, format } from './model';

export default function CnnLesson() {
  const [kernelIndex, setKernelIndex] = useState(0);
  const [stride, setStride] = useState(1);
  const [selected, setSelected] = useState(1);
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const isPlaying = playing && progress < 100;
  const [welcome, setWelcome] = useState(true);
  const [answer, setAnswer] = useState<number | null>(null);
  const animation = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLDivElement>(null);
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
    progress < 65
      ? 0
      : Math.min(
          order.length,
          1 + Math.floor(((progress - 65) / 35) * (order.length - 1)),
        );
  const active =
    progress > 65 && progress < 100
      ? order[Math.max(0, revealed - 1)]
      : selected;
  const row = Math.floor(active / size),
    col = active % size;
  const terms = contributions(image, kernel.values, row, col, stride);
  const count = progress >= 45 ? 9 : Math.floor((progress / 45) * 9);
  const sum = terms.slice(0, count).reduce((s, term) => s + term.product, 0);
  const scale = Math.max(0.1, ...output.flat().map(Math.abs));
  const stage =
    progress < 45
      ? '1 · Multiply matching values'
      : progress < 65
        ? '2 · Add the nine products'
        : progress < 100
          ? '3 · Reuse the kernel across the image'
          : 'One kernel, one complete feature map';
  const reset = () => {
    setPlaying(false);
    setProgress(0);
  };
  useEffect(() => {
    if (!isPlaying) return;
    let previous = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const delta = (now - previous) / 160;
      previous = now;
      setProgress((p) => Math.min(100, p + delta));
    }, 50);
    return () => window.clearInterval(timer);
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
  useLayoutEffect(() => {
    if (welcome) return;
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView({ block: 'start' });
  }, [welcome]);
  function begin() {
    setWelcome(false);
  }
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
    <main className="cnn-lesson">
      <header className="topbar">
        <Link href="/" className="brand">
          <Layers3 size={23} />
          layerwise<span className="prototype-label">EXPLORER</span>
        </Link>
        <span className="lesson-title">
          02 <span>/</span> Inside a convolution
        </span>
        <LessonSwitcher current="cnn" />
      </header>
      <div className="workspace">
        <aside className="architecture">
          <div className="section-label">THE COMPUTATION</div>
          <h2>A window into an image.</h2>
          <p className="muted">One operation inside a CNN.</p>
          <div className="model-node">
            Grayscale image <span>6 × 6</span>
          </div>
          <div className="flow-line" />
          <div className="map-step active">
            <span className="step-dot" />
            Convolution · 3 × 3<span className="current-dot" />
          </div>
          <div className="flow-line" />
          <div className="model-node">
            Feature map{' '}
            <span>
              {size} × {size}
            </span>
          </div>
          <div className="architecture-footer">
            <span className="section-label">THIS TRIAL</span>
            <p>One input channel. One output channel. No padding. Zero bias.</p>
            <p>
              These weights are hand-chosen to make the arithmetic readable.
              This is a convolution demonstration, not a trained image
              classifier.
            </p>
          </div>
        </aside>
        <section className="lesson">
          {welcome && (
            <section
              className="orientation journey-welcome"
              aria-label="How to follow along"
            >
              <span className="section-label">
                ONE PATCH · ONE OUTPUT · THE WHOLE MAP
              </span>
              <h2>Follow a patch through a convolution.</h2>
              <p>
                A CNN looks for patterns in small neighbourhoods. Follow nine
                image values as a filter turns them into one new number, then
                watch it repeat.
              </p>
              <div className="welcome-rhythm">
                <span>
                  <b>1</b> Read the question
                </span>
                <span>
                  <b>2</b> Play or scrub
                </span>
                <span>
                  <b>3</b> Take one idea with you
                </span>
              </div>
              <p className="orientation-hint">
                Inputs, dimensions, pseudocode and worked arithmetic are
                available below when you want more detail.
              </p>
              <button className="primary" onClick={begin}>
                Follow this patch <ArrowRight size={16} />
              </button>
            </section>
          )}
          <div className="breadcrumb">
            CNN walkthrough <span>/</span> Convolution trial
          </div>
          <p className="cnn-model-note">
            One grayscale image · hand-chosen weights · no padding · zero bias.
            A teaching example, not a trained classifier.
          </p>
          <div className="lesson-heading" tabIndex={-1} ref={heading}>
            <div>
              <div className="eyebrow">01 · CONVOLUTION</div>
              <h1>
                Small window. Shared weights<span>.</span>
              </h1>
            </div>
          </div>
          <div className="journey-question">
            <span className="section-label">
              FOLLOWING OUTPUT · ROW {Math.floor(selected / size)}, COLUMN{' '}
              {selected % size}
            </span>
            <p>How do nine image values become one feature?</p>
            <span className="watch-for">
              Watch for: the patch changes as the filter moves. The filter’s
              weights stay the same.
            </span>
          </div>
          <div className="cnn-settings">
            <label>
              Filter{' '}
              <select
                value={kernelIndex}
                onChange={(e) => {
                  setKernelIndex(Number(e.target.value));
                  reset();
                }}
              >
                {kernels.map((k, i) => (
                  <option key={k.name} value={i}>
                    {k.name}
                  </option>
                ))}
              </select>
            </label>
            <span className="muted">
              Choose any output cell to follow its input patch.
            </span>
          </div>
          <div className="canvas" ref={animation}>
            <div className="canvas-toolbar">
              <span>
                <i className="live-dot" />
                {stage}
              </span>
              <span className="cnn-stage-count">
                {revealed} / {size * size} outputs
              </span>
            </div>
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
                            (inPatch && termIndex === count - 1 && progress < 45
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
                        (i === count - 1 && progress < 45 ? 'current-term' : '')
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
                  style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
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
                  {progress < 45
                    ? `${count} of 9 products`
                    : 'All 9 products + zero bias'}
                </span>
                <strong>
                  {count === 0
                    ? 'Ready to multiply'
                    : `${progress < 45 ? 'Running sum' : 'Output'} = ${format(sum)}`}
                </strong>
              </div>
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
                  aria-valuetext={`${Math.round(progress)} percent: ${stage}`}
                  onChange={(e) => {
                    setPlaying(false);
                    setProgress(Number(e.target.value));
                  }}
                />
              </div>
              <p className="transformation-note">
                Drag to explore at your own pace. Each output uses a new patch
                and the same nine weights.
              </p>
            </div>
          </div>
          <p className="rounding-note">
            Displayed numbers are rounded to 2 decimal places; calculations use
            full precision. Adding displayed values can differ slightly from the
            shown result.
          </p>
          <section className="journey-takeaway">
            <span className="section-label">TAKE ONE IDEA WITH YOU</span>
            <h2>A filter is reused, not reinvented.</h2>
            <p>
              One patch produces one output value. Moving the same kernel across
              the image builds a feature map. A positive value here means more
              brightness on the{' '}
              {kernelIndex === 0
                ? 'right than the left'
                : 'bottom than the top'}{' '}
              of that patch; it is not a prediction or a probability.
            </p>
          </section>
          <div className="cnn-continue">
            <button
              className="secondary"
              onClick={() => {
                setPlaying(false);
                setProgress(100);
                animation.current?.scrollIntoView({ block: 'start' });
              }}
            >
              Show complete feature map <ArrowRight size={16} />
            </button>
            <span className="muted">
              End of this trial · deeper explanations below
            </span>
          </div>
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
                  grayscale example. Values from 0 (dark) to 1 (bright) describe
                  one input channel.
                </p>
                <p>
                  <b className="cnn-weight-tone">Kernel:</b> nine hand-chosen
                  parameters. A trained CNN would learn its weights and bias
                  from data. The image changes at each position; these weights
                  are shared.
                </p>
                <p>
                  <b className="cnn-output-tone">Feature map:</b> the signed
                  results of this convolution. No activation, pooling or
                  classifier has been applied yet. One input pixel can
                  contribute to several overlapping output patches.
                </p>
              </div>
            </details>
            <details className="journey-detail">
              <summary>How do the dimensions fit?</summary>
              <div className="cnn-detail-body">
                <p>
                  Axis order: [batch, channels, height, width]. This example
                  processes one grayscale image with one filter. There is no
                  padding: the window must fit entirely inside the image.
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
                  Each spatial output size = floor((6 − 3) / {stride}) + 1 ={' '}
                  {size}. Larger stride means fewer window placements.
                </p>
                <p>
                  B counts images; C counts channels; H and W count rows and
                  columns; K is the kernel size. With more input channels, a
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
                  Selected output [{Math.floor(selected / size)},{' '}
                  {selected % size}] uses this dot product, plus a bias of zero:
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
                      <span className="cnn-input-tone">
                        {format(term.value)}
                      </span>{' '}
                      × (<span className="cnn-weight-tone">{term.weight}</span>)
                      ={' '}
                      <span className="cnn-output-tone">
                        {format(term.product)}
                      </span>
                    </p>
                  ))}
                </div>
                <p>
                  <b className="cnn-output-tone">
                    Sum + 0 ={' '}
                    {format(
                      output[Math.floor(selected / size)][selected % size],
                    )}
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
                  With this 6 × 6 image, a 3 × 3 kernel and no padding, how wide
                  is the output when stride is 2?
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
                    columns 0 and 2. A start at 4 would extend past the image.
                    Two valid starts give two output columns.
                  </output>
                )}
              </div>
            </details>
          </section>
        </section>
      </div>
    </main>
  );
}
