'use client';
/* eslint-disable nextjs/no-html-link-for-pages */
import ModelScale from '../../components/model-scale';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Layers3,
  Pause,
  Play,
  RotateCcw,
} from 'lucide-react';
import LessonSwitcher from '../../components/lesson-switcher';
import { replaceLessonStep, useLessonLink } from '../../lib/use-lesson-link';
import PixelGrid from './pixel-grid';
import UnetOverview from './unet-overview';
import {
  data,
  steps,
  timeOptions,
  type NoiseTime,
  noisyImage,
  errors,
  average,
  reverseTerms,
  unetStages,
} from './model';
const stepIds = steps.map((s) => s.id);
const fmt = (n: number) => n.toFixed(3);
export default function DiffusionLesson() {
  const [step, setStep] = useState(0),
    [example, setExample] = useState(1),
    [noiseTime, setNoiseTime] = useState<NoiseTime>(40);
  const [progress, setProgress] = useState(0),
    [playing, setPlaying] = useState(false),
    [pixel, setPixel] = useState(27);
  const [channel, setChannel] = useState(0),
    [sample, setSample] = useState(0),
    [reverseTime, setReverseTime] = useState(40);
  const [answer, setAnswer] = useState<number | null>(null);
  const heading = useRef<HTMLHeadingElement>(null),
    canvas = useRef<HTMLElement>(null);
  const current = steps[step],
    e = data.examples[example],
    done = progress >= 1;
  const t = step === 0 ? Math.round(progress * noiseTime) : noiseTime;
  const xt = noisyImage(example, t),
    prediction = e.predictions[noiseTime - 1],
    squared = errors(example, noiseTime);
  const stage = Math.min(5, Math.floor((progress / 0.85) * 6)),
    node = unetStages[stage];
  const safeChannel = Math.min(channel, node.channels - 1),
    feature = e.traces[noiseTime][stage][safeChannel];
  const s = data.samples[sample],
    frame = Math.min(100, Math.floor(progress * 100));
  const inspectedTime =
    step === 5 ? Math.max(1, Math.min(100, 101 - frame)) : reverseTime;
  const terms = reverseTerms(sample, inspectedTime, pixel),
    reverseIndex = 100 - reverseTime;
  const learnedPoint = Math.min(
    data.history.length - 1,
    Math.floor(progress * (data.history.length - 1)),
  );
  const lossPoint = data.history[learnedPoint];
  const forecast = s.frames[reverseIndex].map((x, i) =>
    Math.max(
      -1,
      Math.min(
        1,
        (x -
          Math.sqrt(1 - data.alphaBar[reverseTime]) *
            s.predictions[reverseIndex][i]) /
          Math.sqrt(data.alphaBar[reverseTime]),
      ),
    ),
  );
  useEffect(() => {
    if (!playing || done) return;
    let last: number | undefined, id: number;
    const tick = (now: number) => {
      const delta = last === undefined ? 0 : Math.max(0, (now - last) / 1000);
      last = now;
      setProgress((p) => Math.min(1, p + delta / (step === 5 ? 12 : 8)));
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [playing, done, step]);
  useEffect(() => {
    const pause = () => {
      if (document.hidden) setPlaying(false);
    };
    const observer = new IntersectionObserver(([v]) => {
      if (!v.isIntersecting) setPlaying(false);
    });
    if (canvas.current) observer.observe(canvas.current);
    document.addEventListener('visibilitychange', pause);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', pause);
    };
  }, []);
  function go(next: number) {
    setStep(next);
    setPlaying(false);
    setProgress(0);
    setAnswer(null);
    replaceLessonStep(stepIds, next);
    requestAnimationFrame(() => {
      heading.current?.focus({ preventScroll: true });
      heading.current?.scrollIntoView({ block: 'start' });
    });
  }
  useLessonLink(stepIds, go);
  function seek(p: number) {
    setProgress(p);
    setPlaying(false);
  }
  const pixelNote = (
    <span className="diff-pixel-note">
      Following pixel [{Math.floor(pixel / 8) + 1}, {(pixel % 8) + 1}] · select
      a cell to inspect it
    </span>
  );
  return (
    <main className="diff-lesson">
      <header className="topbar">
        <a href="/" className="brand">
          <Layers3 size={23} />
          layerwise<span className="prototype-label">EXPLORER</span>
        </a>
        <span className="lesson-title">04 / Inside Diffusion</span>
        <LessonSwitcher />
      </header>
      <div className="diff-layout">
        <aside className="diff-outline">
          <span className="section-label">THE DIFFUSION JOURNEY</span>
          <h2>
            Learn to denoise.
            <br />
            Start from noise.
          </h2>
          <p>
            A digit, a small U-Net, and the difference between learning and
            generating.
          </p>
          {steps.map((st, i) => (
            <button
              key={st.id}
              aria-current={step === i ? 'step' : undefined}
              onClick={() => go(i)}
            >
              <span>0{i + 1}</span>
              {st.name}
              <small>{i < 4 ? 'TRAIN' : 'SAMPLE'}</small>
            </button>
          ))}
          <div className="diff-model-note">
            <span className="section-label">THIS MODEL</span>
            <p>
              8 × 8 handwritten digits
              <br />
              {data.meta.parameters.toLocaleString('en-US')} trained parameters
              <br />
              100 diffusion timesteps
            </p>
            <p>
              Recorded model calculations. Playback does not retrain the
              network.
            </p>
          </div>
        </aside>
        <div className="diff-content">
          <div className="diff-orientation">
            <span className="section-label">
              DDPM · ONE MECHANISM, TWO JOURNEYS
            </span>
            <p>
              During training, we know the clean image and added noise. During
              generation, we have neither a reference image nor a target. Play
              or scrub each step to see what changes.
            </p>
          </div>
          <div className="diff-mobile-step">
            <label htmlFor="diff-step">Lesson step</label>
            <select
              id="diff-step"
              value={step}
              onChange={(ev) => go(Number(ev.target.value))}
            >
              {steps.map((st, i) => (
                <option key={st.id} value={i}>
                  {i + 1}. {st.name}
                </option>
              ))}
            </select>
          </div>
          <span className="section-label">
            {step < 4 ? 'TRAINING' : 'GENERATION · FIXED WEIGHTS'} · STEP{' '}
            {step + 1} OF 6
          </span>
          <h1 ref={heading} tabIndex={-1}>
            {current.question}
          </h1>
          <p className="diff-watch">
            <b>Watch for:</b> {current.cue}
          </p>
          <div className="diff-controls">
            {step < 3 ? (
              <>
                <label>
                  Digit example{' '}
                  <select
                    value={example}
                    onChange={(ev) => {
                      setExample(Number(ev.target.value));
                      setPlaying(false);
                    }}
                  >
                    {data.examples.map((ex, i) => (
                      <option value={i} key={ex.label}>
                        Digit {ex.label}
                      </option>
                    ))}
                  </select>
                </label>
                <fieldset>
                  <legend>
                    {step === 0 ? 'Explore up to noise level' : 'Noise level'}
                  </legend>
                  {timeOptions.map((n) => (
                    <button
                      key={n}
                      aria-pressed={noiseTime === n}
                      onClick={() => {
                        setNoiseTime(n);
                        setPlaying(false);
                      }}
                    >
                      t = {n}
                    </button>
                  ))}
                </fieldset>
              </>
            ) : step >= 4 ? (
              <>
                <label>
                  Recorded run{' '}
                  <select
                    value={sample}
                    onChange={(ev) => {
                      setSample(Number(ev.target.value));
                      setPlaying(false);
                    }}
                  >
                    {data.samples.map((run, i) => (
                      <option key={run.seed} value={i}>
                        Seed {run.seed}
                      </option>
                    ))}
                  </select>
                </label>
                {step === 4 && (
                  <label>
                    Reverse timestep{' '}
                    <select
                      value={reverseTime}
                      onChange={(ev) => {
                        setReverseTime(Number(ev.target.value));
                        seek(0);
                      }}
                    >
                      {[100, 80, 40, 10, 1].map((n) => (
                        <option key={n} value={n}>
                          t = {n}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </>
            ) : (
              <span>Recorded training run · Adam · learning rate 0.001</span>
            )}
          </div>
          <section
            className="diff-canvas"
            ref={canvas}
            aria-label={current.name}
          >
            {step === 0 && (
              <>
                <div className="diff-panel">
                  <div className="diff-three">
                    <PixelGrid
                      title="Clean digit · x₀"
                      values={e.clean}
                      selected={pixel}
                      onSelect={setPixel}
                      caption="Known during training"
                    />
                    <PixelGrid
                      title="Sampled noise · ε"
                      values={e.noise}
                      selected={pixel}
                      onSelect={setPixel}
                      tone="signed"
                      caption="Gaussian values, not a digit"
                    />
                    <PixelGrid
                      title={`Noisy input · x${t}`}
                      values={xt}
                      selected={pixel}
                      onSelect={setPixel}
                      caption={`Signal weight ${fmt(Math.sqrt(data.alphaBar[t]))} · noise weight ${fmt(Math.sqrt(1 - data.alphaBar[t]))}`}
                    />
                  </div>
                  <div className="diff-signal-bars">
                    <span>
                      Signal{' '}
                      <i
                        style={{
                          width: `${Math.sqrt(data.alphaBar[t]) * 100}%`,
                        }}
                      />
                    </span>
                    <span>
                      Noise{' '}
                      <i
                        style={{
                          width: `${Math.sqrt(1 - data.alphaBar[t]) * 100}%`,
                        }}
                      />
                    </span>
                  </div>
                  {pixelNote}
                  <div className="diff-equation">
                    <span>
                      {fmt(Math.sqrt(data.alphaBar[t]))} × {fmt(e.clean[pixel])}
                    </span>
                    <b>+</b>
                    <span>
                      {fmt(Math.sqrt(1 - data.alphaBar[t]))} ×{' '}
                      {fmt(e.noise[pixel])}
                    </span>
                    <b>= {fmt(xt[pixel])}</b>
                  </div>
                  <p className="diff-caption">
                    These bars are mixing coefficients, not probabilities. The
                    slider uses the same sampled noise to compare noise levels;
                    it is not a recorded forward Markov chain.
                  </p>
                </div>
              </>
            )}
            {step === 1 && (
              <div className="diff-panel">
                <div className="diff-unet-input">
                  <span>
                    Noisy image <b>1 × 8 × 8</b>
                  </span>
                  <span>
                    + timestep plane <b>t / 100 = {noiseTime / 100}</b>
                  </span>
                  <ArrowRight size={18} />
                  <span>
                    Network input <b>2 × 8 × 8</b>
                  </span>
                </div>
                <UnetOverview
                  stage={stage}
                  overview={progress >= 0.85}
                  trace={e.traces[noiseTime]}
                  onSelect={(i) => {
                    setChannel(0);
                    seek((i / 6) * 0.85 + 0.001);
                  }}
                />
                <div
                  className={
                    'diff-unet-detail ' + (progress >= 0.85 ? 'collapsed' : '')
                  }
                  inert={progress >= 0.85}
                  aria-hidden={progress >= 0.85}
                >
                  <div>
                    <div className="diff-unet-inspect">
                      <PixelGrid
                        title={`${node.name} · channel ${safeChannel}`}
                        side={node.side}
                        values={feature}
                        tone="signed"
                        caption="Recorded activation values"
                      />
                      <div>
                        <span className="section-label">
                          {node.channels} CHANNELS · {node.side} × {node.side}{' '}
                          VALUES EACH
                        </span>
                        <h3>{node.name}</h3>
                        <p>{node.detail}</p>
                        <label>
                          Inspect channel{' '}
                          <select
                            value={safeChannel}
                            onChange={(ev) =>
                              setChannel(Number(ev.target.value))
                            }
                          >
                            {Array.from({ length: node.channels }, (_, i) => (
                              <option key={i} value={i}>
                                {i}
                                {stage === 4
                                  ? i < 32
                                    ? ' · upsampled'
                                    : ' · encoder skip'
                                  : ''}
                              </option>
                            ))}
                          </select>
                        </label>
                        {stage === 4 && (
                          <p className="diff-highlight">
                            32 + 16 = 48 channels. Their spatial positions stay
                            aligned.
                          </p>
                        )}
                      </div>
                    </div>
                    {stage === 5 && (
                      <div className="diff-output">
                        <span>
                          Final 1 × 1 convolution <ArrowRight size={18} />
                        </span>
                        <PixelGrid
                          title="Predicted noise · 1 × 8 × 8"
                          values={prediction}
                          tone="signed"
                          caption="Not a clean image yet"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <p className="diff-caption">
                  All shapes omit the batch axis and use channels × height ×
                  width. Mint / purple show positive / negative activations.
                  Feature channels do not correspond to individual pixels or
                  classes.
                </p>
              </div>
            )}
            {step === 2 && (
              <div className="diff-panel">
                <div className="diff-three">
                  <PixelGrid
                    title="Actual added noise · ε"
                    values={e.noise}
                    tone="signed"
                    selected={pixel}
                    onSelect={setPixel}
                  />
                  <PixelGrid
                    title="Predicted noise · ε̂"
                    values={prediction}
                    tone="signed"
                    selected={pixel}
                    onSelect={setPixel}
                  />
                  <PixelGrid
                    title="Squared error per pixel"
                    values={progress >= 0.4 ? squared : Array(64).fill(0)}
                    tone="error"
                    selected={pixel}
                    onSelect={setPixel}
                    caption={
                      progress >= 0.4
                        ? 'Gold marks larger errors'
                        : 'Play to reveal the errors'
                    }
                  />
                </div>
                {pixelNote}
                <div className="diff-equation">
                  <span>
                    ({fmt(prediction[pixel])} − {fmt(e.noise[pixel])})²
                  </span>
                  <b>= {progress >= 0.4 ? fmt(squared[pixel]) : '?'}</b>
                </div>
                <div className="diff-loss-total">
                  <span>Average over this image’s 64 pixels</span>
                  <strong>
                    {progress >= 0.75 ? average(squared).toFixed(4) : '…'}
                  </strong>
                </div>
                <p className="diff-caption">
                  This held-out example uses the trained model. The same loss is
                  used to train on batches of 128 different training images.
                  Predicting exactly zero noise would give loss{' '}
                  {average(e.noise.map((x) => x * x)).toFixed(4)} on this
                  example.
                </p>
              </div>
            )}
            {step === 3 && (
              <div className="diff-panel">
                <div className="diff-training-loop">
                  <span>
                    Clean training batch
                    <br />
                    <b>128 digits</b>
                  </span>
                  <ArrowRight size={18} />
                  <span>
                    Random t + noise
                    <br />
                    <b>128 training targets</b>
                  </span>
                  <ArrowRight size={18} />
                  <span>
                    U-Net → MSE
                    <br />
                    <b>Gradients → Adam</b>
                  </span>
                </div>
                <p className="diff-caption">
                  Repeat with resampled images, timesteps and noise. Adam
                  adjusts the same shared U-Net weights after each batch.
                </p>
                <div className="diff-chart">
                  <span className="section-label">
                    FIXED HELD-OUT TEST · NOISE PREDICTION MSE ↓
                  </span>
                  <svg
                    viewBox="0 0 600 220"
                    aria-label={`Recorded held-out noise prediction loss: ${data.history[0].loss.toFixed(3)} initially, ${lossPoint.loss.toFixed(3)} after ${lossPoint.step} updates`}
                  >
                    <line x1="45" y1="185" x2="570" y2="185" stroke="#34434d" />
                    <line x1="45" y1="20" x2="45" y2="185" stroke="#34434d" />
                    <text x="5" y="28">
                      1.1
                    </text>
                    <text x="12" y="188">
                      0
                    </text>
                    <text x="45" y="211">
                      0 updates
                    </text>
                    <text x="494" y="211">
                      4,000
                    </text>
                    <polyline
                      points={data.history
                        .slice(0, learnedPoint + 1)
                        .map(
                          (pt) =>
                            `${45 + (pt.step / 4000) * 525},${185 - (pt.loss / 1.1) * 160}`,
                        )
                        .join(' ')}
                      fill="none"
                      stroke="#7cdbcf"
                      strokeWidth="3"
                    />
                    {data.history.slice(0, learnedPoint + 1).map((pt) => (
                      <circle
                        key={pt.step}
                        cx={45 + (pt.step / 4000) * 525}
                        cy={185 - (pt.loss / 1.1) * 160}
                        r="3"
                        fill="#7cdbcf"
                      />
                    ))}
                  </svg>
                  <div className="diff-chart-readout">
                    <span>
                      Optimizer updates{' '}
                      <b>{lossPoint.step.toLocaleString('en-US')}</b>
                    </span>
                    <span>
                      Held-out loss <b>{lossPoint.loss.toFixed(4)}</b>
                    </span>
                  </div>
                </div>
                <p className="diff-caption">
                  Every point evaluates the same 297 held-out digits with fixed
                  timesteps and noise. The curve is recorded from the real
                  training run; scrubbing reveals measurements, not live
                  training. Lower noise-prediction error alone is not a full
                  measure of generation quality.
                </p>
              </div>
            )}
            {step === 4 && (
              <div className="diff-panel">
                <div className="diff-phase-row">
                  {[
                    'Predict noise',
                    'Estimate clean',
                    'Form mean',
                    'Sample next',
                  ].map((label, i) => (
                    <span
                      key={label}
                      className={
                        Math.min(3, Math.floor(progress * 4)) === i
                          ? 'active'
                          : ''
                      }
                    >
                      {label}
                    </span>
                  ))}
                </div>
                <div className="diff-three">
                  <PixelGrid
                    title={`Current sample · x${reverseTime}`}
                    values={s.frames[reverseIndex]}
                    selected={pixel}
                    onSelect={setPixel}
                  />
                  <PixelGrid
                    title={
                      progress < 0.25
                        ? 'Predicted noise'
                        : progress < 0.5
                          ? 'Estimated clean · clipped'
                          : progress < 0.75
                            ? 'Reverse-step mean'
                            : `Next sample · x${reverseTime - 1}`
                    }
                    values={
                      progress < 0.25
                        ? s.predictions[reverseIndex]
                        : progress < 0.5
                          ? forecast
                          : progress < 0.75
                            ? s.means[reverseIndex]
                            : s.frames[reverseIndex + 1]
                    }
                    tone={progress < 0.25 ? 'signed' : 'image'}
                    selected={pixel}
                    onSelect={setPixel}
                  />
                  <div className="diff-step-explain">
                    <span className="section-label">NO REFERENCE DIGIT</span>
                    <h3>
                      {progress < 0.25
                        ? 'Ask the trained U-Net'
                        : progress < 0.5
                          ? 'Estimate the clean image'
                          : progress < 0.75
                            ? 'Calculate the reverse mean'
                            : 'Draw the next sample'}
                    </h3>
                    <p>
                      {progress < 0.25
                        ? 'The network sees only the current noisy sample and its timestep.'
                        : progress < 0.5
                          ? 'Use its noise prediction in the known mixing equation. Clip this estimated clean image to the training range [−1, 1].'
                          : progress < 0.75
                            ? 'The DDPM posterior formula blends the estimated clean image with the current sample.'
                            : reverseTime === 1
                              ? 'The final variance is zero, so the sampler adds no fresh noise.'
                              : 'Add fresh Gaussian noise at the scheduled variance. Denoising is not simply subtracting the predicted noise.'}
                    </p>
                  </div>
                </div>
                {pixelNote}
                <div className="diff-equation">
                  <span>{fmt(terms.mean)}</span>
                  <b>+</b>
                  <span>
                    {fmt(Math.sqrt(terms.variance))} × {fmt(terms.z)}
                  </span>
                  <b>
                    ={' '}
                    {progress >= 0.75
                      ? fmt(s.frames[reverseIndex + 1][pixel])
                      : '?'}
                  </b>
                </div>
                <p className="diff-caption">
                  Reverse mean + scheduled standard deviation × fresh noise.
                  Inspect the complete formula below. The weights are fixed
                  throughout sampling.
                </p>
              </div>
            )}
            {step === 5 && (
              <div className="diff-panel">
                <div className="diff-generation">
                  <PixelGrid
                    title="Start · fresh Gaussian noise"
                    values={s.frames[0]}
                    caption={`Seed ${s.seed} · no clean image supplied`}
                  />
                  <div className="diff-loop-arrow">
                    <span>Same trained U-Net</span>
                    <ArrowRight size={28} />
                    <b>{frame} / 100 steps</b>
                  </div>
                  <PixelGrid
                    title={
                      done
                        ? 'Generated sample · t = 0'
                        : `Current sample · t = ${100 - frame}`
                    }
                    values={s.frames[frame]}
                    selected={pixel}
                    onSelect={setPixel}
                    caption={
                      done
                        ? 'An imperfect result from this small model'
                        : 'Play or scrub to follow its evolution'
                    }
                  />
                </div>
                <div className="diff-filmstrip">
                  {[0, 25, 50, 75, 100].map((k) => (
                    <button
                      key={k}
                      aria-label={`Inspect generation after ${k} steps`}
                      aria-pressed={frame === k}
                      onClick={() => seek(k / 100)}
                    >
                      <PixelGrid
                        title={`t = ${100 - k}`}
                        values={s.frames[k]}
                      />
                    </button>
                  ))}
                </div>
                <p className="diff-caption">
                  All three runs use the same weights and sampler. The seed
                  changes the random draws. Samples are recorded model outputs,
                  not a crossfade from noise into a stored clean digit.
                </p>
              </div>
            )}
            <div className="diff-playback">
              <div>
                <button
                  className="secondary"
                  onClick={() => {
                    if (done) setProgress(0);
                    setPlaying(!playing || done);
                  }}
                >
                  {playing && !done ? (
                    <Pause size={16} />
                  ) : done ? (
                    <RotateCcw size={16} />
                  ) : (
                    <Play size={16} />
                  )}{' '}
                  {playing && !done ? 'Pause' : done ? 'Replay' : 'Play'}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step=".001"
                  value={progress}
                  aria-label="Step progress"
                  onChange={(ev) => seek(Number(ev.target.value))}
                />
                <button onClick={() => seek(1)} className="diff-result">
                  {step === 1 ? 'See whole U-Net' : 'Show result'}
                </button>
              </div>
              <p>
                Play or drag at your own pace. Playback stays within this step.
              </p>
            </div>
          </section>
          <section className="diff-takeaway">
            <span className="section-label">TAKE ONE IDEA WITH YOU</span>
            <h2>{current.takeaway}</h2>
            <p>{current.text}</p>
          </section>
          <nav className="diff-next" aria-label="Diffusion lesson steps">
            <button
              className="secondary"
              disabled={step === 0}
              onClick={() => go(step - 1)}
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <span>{step + 1} / 6</span>
            <button
              className="primary"
              onClick={() => go(step === 5 ? 0 : step + 1)}
            >
              {step === 5 ? 'Restart journey' : 'Next step'}
              <ArrowRight size={16} />
            </button>
          </nav>
          <h2 className="diff-deeper">Go deeper</h2>
          <ModelScale lesson="diffusion" />
          <details className="diff-details">
            <summary>Where do these images and numbers come from?</summary>
            <p>
              The digits come from the scikit-learn/UCI optical handwritten
              digit dataset: 1,797 grayscale 8 × 8 images with original pixel
              values 0–16, scaled here to −1…1. A fixed seed splits 1,500
              training images from 297 held-out images. The displayed digits are
              held out; labels only name examples and never enter the network.
            </p>
            <p>
              A {data.meta.parameters.toLocaleString('en-US')}-parameter U-Net
              was trained for {data.meta.updates.toLocaleString('en-US')} Adam
              updates with batches of 128 and learning rate 0.001. It uses a
              cosine noise schedule with 100 steps. This is a small DDPM
              teaching implementation, not the original paper’s architecture or
              benchmark result. Recorded arrays drive the browser; changing a
              selector selects another recorded calculation.
            </p>
            <p>
              Image brightness is displayed on a fixed −1…1 scale, clipping
              out-of-range values for display only. Signed noise/activation
              colors saturate at ±3 (mint positive, purple negative);
              squared-error colors saturate at 4. Arithmetic uses stored values,
              not their display colors. Values are rounded on screen.
            </p>
            <p>
              <a
                href="https://hojonathanho.github.io/diffusion/"
                target="_blank"
                rel="noreferrer"
              >
                DDPM paper and original implementation
              </a>{' '}
              ·{' '}
              <a
                href="https://scikit-learn.org/stable/modules/generated/sklearn.datasets.load_digits.html"
                target="_blank"
                rel="noreferrer"
              >
                Digit dataset
              </a>
            </p>
          </details>
          <details className="diff-details">
            <summary>How was the selected pixel calculated?</summary>
            {step < 4 ? (
              <>
                <p>
                  At t = {t}, ᾱ = {data.alphaBar[t].toFixed(6)}. This is the
                  cumulative product of the schedule’s signal-retention factors.
                  The square roots of ᾱ and 1 − ᾱ weight the clean image and
                  sampled noise.
                </p>
                <pre>{`x_t = sqrt(alpha_bar) × x_0 + sqrt(1-alpha_bar) × noise\n    = ${fmt(Math.sqrt(data.alphaBar[t]))} × ${fmt(e.clean[pixel])} + ${fmt(Math.sqrt(1 - data.alphaBar[t]))} × ${fmt(e.noise[pixel])}\n    = ${fmt(xt[pixel])}\n\nAt training noise level ${noiseTime}:\nsquared error = (${fmt(prediction[pixel])} - ${fmt(e.noise[pixel])})²\n              = ${fmt(squared[pixel])}`}</pre>
              </>
            ) : (
              <>
                <p>
                  The sampler uses αₜ = 1 − βₜ and ᾱₜ = the product of α₁…αₜ.
                  {step === 5
                    ? frame === 0
                      ? 'For the first transition from initial noise'
                      : 'For the transition that produced the displayed frame'
                    : 'For the selected reverse step'}{' '}
                  (t = {inspectedTime}), the coefficients are:
                </p>
                <pre>{`clean estimate = (x_t - sqrt(1-ᾱ_t) × noise_hat) / sqrt(ᾱ_t)\n               = ${fmt(terms.estimate)} → clipped to ${fmt(terms.clean)}\nc1 = sqrt(ᾱ_previous) × β_t / (1-ᾱ_t) = ${fmt(terms.c1)}\nc2 = sqrt(α_t) × (1-ᾱ_previous) / (1-ᾱ_t) = ${fmt(terms.c2)}\nmean = c1 × clean_estimate + c2 × x_t = ${fmt(terms.mean)}\nvariance = β_t × (1-ᾱ_previous) / (1-ᾱ_t) = ${fmt(terms.variance)}\nx_previous = mean + sqrt(variance) × z = ${fmt(terms.next)}`}</pre>
              </>
            )}
            <p>
              Pixel coordinates here start at 1. Rounded operands can appear not
              to sum exactly. Generating a sample never consults a ground-truth
              clean image.
            </p>
          </details>
          <details className="diff-details">
            <summary>How do the dimensions fit?</summary>
            <div className="diff-shapes">
              <span>
                Image + timestep plane <b>[batch, 2, 8, 8]</b>
              </span>
              <span>
                Encoder <b>[batch, 16, 8, 8]</b>
              </span>
              <span>
                Bottleneck <b>[batch, 32, 4, 4]</b>
              </span>
              <span>
                Upsampled + skip <b>[batch, 48, 8, 8]</b>
              </span>
              <span>
                Predicted noise <b>[batch, 1, 8, 8]</b>
              </span>
              <span>
                Mean squared error <b>one scalar</b>
              </span>
            </div>
            <p>
              The network preserves the output image size. Concatenation
              increases channels, upsampling increases spatial size, and neither
              is a weight update.
            </p>
          </details>
          <details className="diff-details">
            <summary>How would I write this?</summary>
            <p>Python-like pseudocode for this small implementation.</p>
            <pre>{current.code}</pre>
          </details>
          <details className="diff-details">
            <summary>
              How does this connect to U-Net, Stable Diffusion and DiT?
            </summary>
            <p>
              Diffusion describes the training and sampling method; the U-Net is
              the denoiser architecture used here. Its downsampling/upsampling
              structure illustrates an encoder–decoder, with skip connections
              joining corresponding resolutions. A GAN is a different generative
              approach.
            </p>
            <p>
              Classic Stable Diffusion adds an autoencoder to work in latent
              space and text conditioning to guide generation. DiT uses a
              Transformer denoiser. Those additions are not implemented in this
              lesson. <a href="/cnn#convolution">Review convolution</a> or{' '}
              <a href="/clip#encoders">revisit image/text representations</a>{' '}
              when helpful.
            </p>
          </details>
          {(step === 2 || step === 5) && (
            <details className="diff-details">
              <summary>Try a quick prediction · optional</summary>
              <p>
                {step === 2
                  ? 'What is the training target in this noise-prediction model?'
                  : 'Does generation need the clean digit it should produce?'}
              </p>
              <div className="diff-answers">
                {(step === 2
                  ? ['The digit class', 'The Gaussian noise we sampled']
                  : [
                      'Yes, to reverse its corruption',
                      'No, it starts from fresh noise',
                    ]
                ).map((label, i) => (
                  <button
                    className="secondary"
                    key={label}
                    aria-pressed={answer === i}
                    onClick={() => setAnswer(i)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {answer !== null && (
                <output>
                  {answer === 1
                    ? 'Exactly. '
                    : 'Look again at what is supplied. '}
                  {step === 2
                    ? 'The chosen noise provides a numerical target at every pixel. No class labels are needed.'
                    : 'Only the trained denoiser, timestep schedule and random draws are needed here. No reference digit is supplied.'}
                </output>
              )}
            </details>
          )}
        </div>
      </div>
    </main>
  );
}
