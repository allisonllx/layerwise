'use client';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { flushSync } from 'react-dom';
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Layers3,
  RotateCcw,
  Code2,
  Info,
  Plus,
  Minus,
  MousePointer2,
} from 'lucide-react';
import TensorCanvas, {
  inspect,
  type Selection,
  type Projection,
  type MlpStage,
} from '../components/tensor-canvas';
import { examples, runModel, getSteps } from '../lib/transformer';
import TensorShape, { ShapeLegend } from '../components/tensor-shape';
import OperationGuide from '../components/operation-guide';
import Orientation, { tourSteps } from '../components/orientation';
import { getDisplay } from '../components/tensor-canvas';
import Transformation from '../components/transformation';
import ValueMixing from '../components/value-mixing';
import { heatmapScale } from '../lib/heatmap';

export default function Home() {
  const lessonStart = useRef<HTMLDivElement>(null);
  const [navigation, setNavigation] = useState(0);
  const [step, setStep] = useState(0),
    [token, setToken] = useState(2),
    [numbers, setNumbers] = useState(false),
    [focusToken, setFocusToken] = useState(false),
    [tour, setTour] = useState<number | null>(0),
    [example, setExample] = useState(0),
    [projection, setProjection] = useState<Projection>('q'),
    [mlp, setMlp] = useState<MlpStage>('down'),
    [selection, setSelection] = useState<Selection | null>(null),
    [phase, setPhase] = useState(1),
    [replay, setReplay] = useState(0),
    [zoom, setZoom] = useState(1),
    [about, setAbout] = useState(false);
  const words = examples[example],
    model = useMemo(() => runModel(words), [words]),
    steps = useMemo(() => getSteps(words.length), [words.length]),
    current = steps[step];
  const navigate = useCallback((n: number) => {
    setStep(Math.max(0, Math.min(11, n)));
    setTour(null);
    setSelection(null);
    setPhase(1);
    setNavigation((n) => n + 1);
  }, []);
  useLayoutEffect(() => {
    if (!navigation) return;
    lessonStart.current?.focus({ preventScroll: true });
    lessonStart.current?.scrollIntoView({
      block: 'start',
      behavior: 'instant',
    });
  }, [navigation]);
  useEffect(() => {
    if (!replay) return;
    setPhase(0);
    const timer = setTimeout(() => setPhase(1), 70);
    return () => clearTimeout(timer);
  }, [replay]);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (
        (e.target as HTMLElement).closest(
          'input,select,textarea,button,summary,[contenteditable]',
        )
      )
        return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigate(step + 1);
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigate(step - 1);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate, step]);
  useEffect(() => {
    type Context = {
      registerTool: (
        tool: {
          name: string;
          description: string;
          inputSchema: object;
          annotations: object;
          execute: (input: unknown) => unknown;
        },
        options: { signal: AbortSignal },
      ) => void | Promise<void>;
    };
    const context = (document as Document & { modelContext?: Context })
      .modelContext;
    if (!context) return;
    const lifecycle = new AbortController();
    try {
      Promise.resolve(
        context.registerTool(
          {
            name: 'navigate_transformer_lesson',
            description:
              'Select a transformer lesson step (1–12) and optionally a token position (zero-based), updating the visible lesson.',
            inputSchema: {
              type: 'object',
              properties: {
                step: { type: 'integer', minimum: 1, maximum: 12 },
                token: {
                  type: 'integer',
                  minimum: 0,
                  maximum: words.length - 1,
                },
              },
              required: ['step'],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: false },
            execute(input) {
              if (!input || typeof input !== 'object')
                throw new Error('Expected an object');
              const v = input as Record<string, unknown>;
              if (
                !Number.isInteger(v.step) ||
                Number(v.step) < 1 ||
                Number(v.step) > 12 ||
                Object.keys(v).some((k) => !['step', 'token'].includes(k))
              )
                throw new Error('Step must be 1–12');
              if (
                v.token !== undefined &&
                (!Number.isInteger(v.token) ||
                  Number(v.token) < 0 ||
                  Number(v.token) >= words.length)
              )
                throw new Error('Token position is outside the sentence');
              flushSync(() => {
                navigate(Number(v.step) - 1);
                if (v.token !== undefined) setToken(Number(v.token));
              });
              return {
                step: v.step,
                title: steps[Number(v.step) - 1].title,
                token: v.token ?? null,
              };
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => {});
    } catch {}
    return () => lifecycle.abort();
  }, [navigate, steps, words.length]);
  const moveTour = (index: number) => {
    setFocusToken(false);
    navigate(tourSteps[index]);
    setTour(index);
  };
  const finishTour = () => {
    navigate(0);

    setTour(null);
  };
  const scale = heatmapScale(
    getDisplay(model, step, projection, mlp),
    step === 6 || step === 11,
  );
  const chosen = selection ?? { row: token, col: 0, head: 0 },
    calculation = inspect(model, step, projection, mlp, chosen);
  const shapeOut =
    step === 10
      ? `[1, ${words.length}, ${mlp === 'up' || mlp === 'activated' ? 48 : 12}]`
      : current.output;
  const choose = (s: Selection) => {
    setSelection(s);
    setToken(s.row);
  };
  const mapItem = (i: number, label = steps[i].short) => (
    <button
      key={i}
      aria-current={step === i ? 'step' : undefined}
      className={'map-step ' + (step === i ? 'active' : '')}
      onClick={() => {
        navigate(i);
      }}
    >
      <span className="step-dot" />
      <span>{label}</span>
      {step === i && <span className="current-dot" />}
    </button>
  );
  return (
    <main>
      <header className="topbar">
        <a href="/" className="brand">
          <Layers3 size={23} />
          layerwise<span className="prototype-label">EXPLORER</span>
        </a>
        <span className="lesson-title">
          01 <span>/</span> Inside a transformer
        </span>
        <div className="header-tools">
          <button className="orientation-reopen" onClick={() => moveTour(0)}>
            Quick orientation
          </button>
          <button
            className="model-badge"
            aria-expanded={about}
            onClick={() => setAbout(!about)}
          >
            <i />
            Tiny model · 1 block
            <Info size={14} />
          </button>
        </div>
      </header>
      {about && (
        <section className="about-panel">
          <div>
            <h2>A small model. Every operation visible.</h2>
            <p>
              One pre-normalisation decoder block · 12 features · 3 heads · 4
              features per head · 48 MLP features. Deterministic, untrained
              weights and simplified word tokens. All calculations run in your
              browser.
            </p>
            <p>
              Dropout is shown after attention softmax, attention output
              projection, and the MLP output. It is disabled during inference.
              Other architectures can place it differently.
            </p>
          </div>
          <button className="secondary" onClick={() => setAbout(false)}>
            Close
          </button>
        </section>
      )}
      <div className="workspace">
        <aside className="architecture">
          <div className="section-label">THE ARCHITECTURE</div>
          <h2>A view of the whole.</h2>
          <p className="muted">Select a step to look inside.</p>
          <div className="model-node">
            Text input <span>{words.length} tokens</span>
          </div>
          <div className="flow-line" />
          {mapItem(0)}
          <div className="flow-line" />
          <details open className="block">
            <summary>
              Transformer block <span>× 1</span>
              <ChevronDown size={15} />
            </summary>
            <div className="map-steps">
              {mapItem(1)}
              <details open className="attention-group">
                <summary>
                  Multi-head attention <ChevronDown size={13} />
                </summary>
                {[2, 3, 4, 5, 6].map((i) => mapItem(i))}
                <div className="off-tag">
                  Dropout <span>off</span>
                </div>
                {[7, 8].map((i) => mapItem(i))}
                <div className="off-tag">
                  Output dropout <span>off</span>
                </div>
              </details>
              {mapItem(9)}
              {mapItem(10)}
              <div className="off-tag">
                MLP dropout <span>off</span>
              </div>
              {mapItem(11, 'Second residual addition')}
            </div>
            <div className="dropout-note">
              Inference mode <span>Dropout preserves every value.</span>
            </div>
          </details>
          <div className="flow-line" />
          {mapItem(11, 'Final norm + output')}
          <div className="architecture-footer">
            <span className="section-label">THIS MODEL</span>
            <div>
              <b>12</b> features <b>3</b> heads <b>4</b> per head
            </div>
            <p>
              One block, not three blocks.
              <br />
              The three heads work inside it.
            </p>
          </div>
        </aside>
        <section className={'lesson' + (tour !== null ? ' is-orienting' : '')}>
          {tour !== null && (
            <Orientation index={tour} onMove={moveTour} onFinish={finishTour} />
          )}
          <div className="breadcrumb">
            Transformer walkthrough <span>/</span> {current.section}
          </div>
          <div className="lesson-heading" ref={lessonStart} tabIndex={-1}>
            <div>
              <div className="eyebrow">
                STEP {String(step + 1).padStart(2, '0')} OF 12
              </div>
              <h1>
                {current.title}
                <span>.</span>
              </h1>
            </div>
            <button
              className="icon-button"
              aria-label="Start from the first step"
              title="Start from the beginning"
              onClick={() => {
                navigate(0);
              }}
            >
              <RotateCcw size={18} />
            </button>
          </div>
          <p className="intro" aria-live="polite">
            {current.intro}
          </p>
          <div className="input-strip">
            <span className="section-label">SELECT A TOKEN</span>
            <div className="tokens">
              {words.map((w, i) => (
                <button
                  key={i}
                  aria-pressed={token === i}
                  className={token === i ? 'selected' : ''}
                  onClick={() => {
                    setToken(i);
                    setSelection(null);
                  }}
                >
                  <span>{w}</span>
                  <small>{i}</small>
                </button>
              ))}
            </div>
            <label className="example-picker">
              <span className="sr-only">Example sentence</span>
              <select
                aria-label="Example sentence"
                value={example}
                onChange={(e) => {
                  setExample(Number(e.target.value));
                  setToken(0);
                  setSelection(null);
                }}
              >
                <option value={0}>Example 1 · 6 tokens</option>
                <option value={1}>Example 2 · 4 tokens</option>
                <option value={2}>Example 3 · 8 tokens</option>
              </select>
            </label>
          </div>
          <div className="canvas">
            <div className="canvas-toolbar">
              <span>
                <i className="live-dot" />
                {step >= 2 && step <= 4 ? `${projection.toUpperCase()} · ` : ''}
                {step === 10
                  ? {
                      n2: 'Normalised residual',
                      up: 'Expanded features',
                      activated: 'After GELU',
                      down: 'Compressed features',
                    }[mlp]
                  : current.matrixName}
              </span>
              <div className="canvas-options">
                <div
                  className="heatmap-mode"
                  role="group"
                  aria-label="Heatmap view"
                >
                  <button
                    aria-pressed={!focusToken}
                    onClick={() => setFocusToken(false)}
                  >
                    All tokens
                  </button>
                  <button
                    aria-pressed={focusToken}
                    onClick={() => setFocusToken(true)}
                  >
                    Focus token
                  </button>
                </div>
                <label>
                  <input
                    type="checkbox"
                    checked={numbers}
                    onChange={(e) => setNumbers(e.target.checked)}
                  />{' '}
                  Values
                </label>
                <button
                  className="mini-button"
                  disabled={zoom === 1}
                  aria-label="Zoom out"
                  onClick={() => setZoom(Math.max(1, zoom - 0.25))}
                >
                  <Minus size={14} />
                </button>
                <button
                  className="mini-button"
                  disabled={zoom >= 1.75}
                  aria-label="Zoom in"
                  onClick={() => setZoom(Math.min(1.75, zoom + 0.25))}
                >
                  <Plus size={14} />
                </button>
                <button
                  className="mini-button"
                  aria-label="Replay transformation"
                  title="Replay transformation"
                  onClick={() => setReplay((r) => r + 1)}
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>
            {((step >= 2 && step <= 4) || step === 10) && (
              <div className="tensor-tabs">
                {step === 10
                  ? (['n2', 'up', 'activated', 'down'] as MlpStage[]).map(
                      (s, i) => (
                        <button
                          key={s}
                          className={mlp === s ? 'active' : ''}
                          aria-pressed={mlp === s}
                          onClick={() => {
                            setMlp(s);
                            setSelection(null);
                          }}
                        >
                          {
                            [
                              'Normalise · 12',
                              'Expand · 48',
                              'GELU · 48',
                              'Compress · 12',
                            ][i]
                          }
                        </button>
                      ),
                    )
                  : (['q', 'k', 'v'] as Projection[]).map((p) => (
                      <button
                        key={p}
                        className={projection === p ? 'active' : ''}
                        aria-pressed={projection === p}
                        onClick={() => {
                          setProjection(p);
                          setSelection(null);
                        }}
                      >
                        {p.toUpperCase()}{' '}
                        <span>
                          {p === 'q'
                            ? 'Queries'
                            : p === 'k'
                              ? 'Keys'
                              : 'Values'}
                        </span>
                      </button>
                    ))}
              </div>
            )}
            {step >= 3 && step <= 5 && (
              <Transformation
                key={`${step}-${example}-${projection}-${token}`}
                model={model}
                words={words}
                step={step}
                token={token}
                projection={projection}
              />
            )}
            {step === 7 ? (
              <ValueMixing
                key={example}
                model={model}
                words={words}
                token={token}
              >
                <div className="diagram-scroll">
                  <div style={{ width: `${zoom * 100}%`, minWidth: 640 }}>
                    <TensorCanvas
                      key={`${step}-${example}`}
                      model={model}
                      words={words}
                      step={step}
                      token={token}
                      focusToken={focusToken}
                      numbers={numbers}
                      projection={projection}
                      mlp={mlp}
                      phase={phase}
                      selection={selection}
                      onSelect={choose}
                      equation={current.equation}
                      caption={current.caption}
                    />
                  </div>
                </div>
              </ValueMixing>
            ) : (
              <div className="diagram-scroll">
                <div style={{ width: `${zoom * 100}%`, minWidth: 640 }}>
                  <TensorCanvas
                    key={`${step}-${example}`}
                    model={model}
                    words={words}
                    step={step}
                    token={token}
                    focusToken={focusToken}
                    numbers={numbers}
                    projection={projection}
                    mlp={mlp}
                    phase={phase}
                    selection={selection}
                    onSelect={choose}
                    equation={
                      step === 2
                        ? `${projection.toUpperCase()} = X · W${projection}`
                        : current.equation
                    }
                    caption={current.caption}
                  />
                </div>
              </div>
            )}
            <div className="shape-strip compact-shapes">
              <span>SHAPES</span>
              <div className="shape-equations">
                <div>
                  <span className="shape-role">Input</span>
                  <TensorShape text={current.input} step={step} />
                </div>
                <div>
                  <span className="shape-role">Output</span>
                  <TensorShape text={shapeOut} step={step} output />
                </div>
              </div>
              <ShapeLegend
                input={current.input}
                output={shapeOut}
                step={step}
              />
            </div>
          </div>
          <div className="heatmap-legend" aria-label="Heatmap colour scale">
            <span>
              {step === 6 || step === 11 ? '0' : `−${scale.toFixed(2)}`}
            </span>
            <span
              className={
                'colour-ramp ' + (step === 6 || step === 11 ? 'positive' : '')
              }
              aria-hidden="true"
            />
            <span>+{scale.toFixed(2)}</span>
            <span>
              {step === 6 || step === 11
                ? 'Zero → larger probability'
                : 'Negative → zero → positive'}
            </span>
            <span className="scale-note">
              {focusToken
                ? 'Other rows are dimmed. Switch to All tokens to compare.'
                : 'One scale for all rows and heads. Selection only adds an outline.'}
            </span>
          </div>
          <OperationGuide
            step={step}
            tokens={words.length}
            projection={projection}
          />
          <div className="under-canvas">
            <div>
              <span className="section-label">THE INTUITION</span>
              <h3>{current.intuition}</h3>
              <p>{current.detail}</p>
            </div>
            <div className="detail-stack">
              <details className="code-box">
                <summary>
                  <Code2 size={17} /> Pseudocode <ChevronDown size={16} />
                </summary>
                <pre>{current.code}</pre>
                <p className="code-caption">
                  Python-like pseudocode, not runnable PyTorch. Setup, imports
                  and module definitions are omitted; this toy model’s
                  projections have no biases.
                </p>
              </details>
              {(step !== 11 || !focusToken) && (
                <details
                  className="code-box inspector"
                  open={selection !== null ? true : undefined}
                >
                  <summary>
                    <MousePointer2 size={15} /> Inspect a calculation{' '}
                    <ChevronDown size={16} />
                  </summary>
                  <div className="inspector-controls">
                    <label>
                      Row{' '}
                      <select
                        value={chosen.row}
                        onChange={(e) =>
                          choose({ ...chosen, row: Number(e.target.value) })
                        }
                      >
                        {words.map((w, i) => (
                          <option key={i} value={i}>
                            {i} · {w}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Column{' '}
                      <input
                        aria-label="Column to inspect"
                        type="number"
                        min={0}
                        max={
                          step === 5 || step === 6
                            ? words.length - 1
                            : step === 4 || step === 7
                              ? 3
                              : step === 10 &&
                                  (mlp === 'up' || mlp === 'activated')
                                ? 47
                                : 11
                        }
                        value={chosen.col}
                        onChange={(e) =>
                          choose({
                            ...chosen,
                            col: Math.max(
                              0,
                              Math.min(
                                Number(e.target.max),
                                Number(e.target.value) || 0,
                              ),
                            ),
                          })
                        }
                      />
                    </label>
                    {step >= 4 && step <= 7 && (
                      <label>
                        Head{' '}
                        <select
                          value={chosen.head}
                          onChange={(e) =>
                            choose({ ...chosen, head: Number(e.target.value) })
                          }
                        >
                          {[0, 1, 2].map((h) => (
                            <option key={h} value={h}>
                              {h + 1}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                  </div>
                  <div className="calculation">
                    <span>{calculation.coords}</span>
                    <strong>{calculation.value}</strong>
                    <p>{calculation.explanation}</p>
                  </div>
                </details>
              )}
            </div>
          </div>
          <footer className="lesson-controls">
            <button
              className="secondary"
              disabled={step === 0}
              onClick={() => {
                navigate(step - 1);
              }}
            >
              <ArrowLeft size={17} /> Back
            </button>
            <div className="playback">
              <div className="progress-dots">
                {steps.map((s, i) => (
                  <button
                    key={i}
                    aria-label={`Step ${i + 1}: ${s.short}`}
                    title={s.short}
                    aria-current={i === step ? 'step' : undefined}
                    className={i === step ? 'active' : ''}
                    onClick={() => {
                      navigate(i);
                    }}
                  />
                ))}
              </div>
              <span className="progress-count">{step + 1} / 12</span>
            </div>
            <button
              className="primary"
              onClick={() => {
                navigate(step === 11 ? 0 : step + 1);
              }}
            >
              {step === 11 ? 'Start again' : 'Next step'}{' '}
              <ArrowRight size={17} />
            </button>
          </footer>
          <p className="model-disclaimer">
            Illustrative weights · Untrained model · Use ← → to step through
          </p>
        </section>
      </div>
    </main>
  );
}
