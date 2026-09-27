'use client';
import { clipStepIds } from '../../lib/lesson-catalog';
import { useLessonLink, replaceLessonStep } from '../../lib/use-lesson-link';
/* eslint-disable nextjs/no-html-link-for-pages */
import { useEffect, useRef, useState } from 'react';
import LessonSwitcher from '../../components/lesson-switcher';
import {
  Cat,
  Bike,
  TreePine,
  Play,
  Pause,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  Layers3,
} from 'lucide-react';
import {
  examples,
  encode,
  forward,
  gradients,
  training,
  learningRate,
  infer,
  newImage,
} from './model';

const icons = [Cat, Bike, TreePine];
const steps = [
  {
    name: 'Encode the pairs',
    question: 'How can an image and a caption become comparable?',
    cue: 'Follow one pair through two different encoders into vectors of the same size.',
    takeaway: 'Different inputs. A shared representation space.',
    text: 'Each encoder has its own weights. Normalizing its output gives a unit-length vector, so comparison measures alignment rather than magnitude.',
    code: 'image_vector = normalize(image_encoder(image_features))\ntext_vector  = normalize(text_encoder(text_features))',
  },
  {
    name: 'Compare the batch',
    question: 'Which caption aligns with this image?',
    cue: 'Multiply matching coordinates, add them, then extend the same calculation across the batch.',
    takeaway: 'Three pairs give nine comparisons.',
    text: 'Every image is compared with every caption, including the alternatives. A large cosine similarity means aligned vectors; it does not establish a correct match.',
    code: 'similarity = image_vectors @ text_vectors.T\n# One dot product per image–caption pair',
  },
  {
    name: 'Find the learning signal',
    question: 'How does the model know which comparisons should win?',
    cue: 'The pairing comes from the dataset. Switch direction to see the same matching task down a column.',
    takeaway: 'The pairings provide supervision.',
    text: 'For each image, its paired caption is the target. For each caption, its paired image is the target. Other examples in this tiny batch act as alternatives; real datasets can contain ambiguous or duplicate descriptions.',
    code: 'target_for_image[i] = paired_caption_id[i]\ntarget_for_caption[j] = paired_image_id[j]\n# These targets come from the data, not the model scores',
  },
  {
    name: 'Measure the loss',
    question: 'How costly is a low probability for the correct match?',
    cue: 'Follow similarity → scaled score → probability → penalty. Only the known match supplies the target probability.',
    takeaway: 'A confident wrong match receives a larger penalty.',
    text: 'Cross-entropy is −log(probability of the correct match). Average over all three images and all three captions to get one symmetric loss.',
    code: 'logits = 5 * similarity\nimage_loss = cross_entropy(logits, image_targets)\ntext_loss  = cross_entropy(logits.T, text_targets)\nloss = (image_loss + text_loss) / 2',
  },
  {
    name: 'Update both encoders',
    question: 'How does that loss change the next comparison?',
    cue: 'Follow the error backwards to both weight matrices, inspect one weight, then recompute the same batch.',
    takeaway: 'Learning changes weights, then recomputes representations.',
    text: 'Both encoders receive gradients from all six matching tasks. One SGD update adjusts their weights; the next forward pass produces new vectors and comparisons.',
    code: 'loss.backward()\nfor weight in both_encoders:\n    weight -= 0.1 * weight.gradient\n# Recompute the batch with the updated weights',
  },
  {
    name: 'Use the representations',
    question: 'What changes when training ends?',
    cue: 'Keep both encoders fixed. Compare a new toy input with descriptions, then remove a candidate.',
    takeaway: 'Fixed encoders. Flexible candidate descriptions.',
    text: 'Inference makes comparisons without a loss or weight update. Candidate probabilities are relative to the descriptions provided, not an absolute measure of correctness. CLIP compares descriptions here; it does not generate a caption.',
    code: 'freeze(image_encoder, text_encoder)\nimage = normalize(image_encoder(new_features))\ntexts = normalize(text_encoder(candidate_features))\nprobabilities = softmax(5 * image @ texts.T)',
  },
];
const fmt = (x: number) => x.toFixed(2);
const vector = (v: number[]) => `[${v.map(fmt).join(', ')}]`;
export default function ClipLesson() {
  const [step, setStep] = useState(0),
    [progress, setProgress] = useState(0),
    [playing, setPlaying] = useState(false);
  const [image, setImage] = useState(0),
    [caption, setCaption] = useState(0);
  const [direction, setDirection] = useState<'row' | 'column'>('row');
  const [order, setOrder] = useState([0, 1, 2]),
    [iteration, setIteration] = useState(0);
  const [weightSide, setWeightSide] = useState<'image' | 'text'>('image');
  const [weightCell, setWeightCell] = useState([0, 1]);
  const [candidates, setCandidates] = useState([0, 1, 2]);
  const [answer, setAnswer] = useState<number | null>(null);
  const heading = useRef<HTMLHeadingElement>(null),
    canvas = useRef<HTMLElement>(null);
  const current = steps[step],
    done = progress >= 1;
  const before = forward(training[iteration]),
    after = forward(training[iteration + 1]);
  const g = gradients(training[iteration]);
  const updated = step === 4 && progress >= 0.8;
  const f = updated ? after : before;
  const phase = Math.min(3, Math.floor(progress * 4));
  const inference = infer(candidates);
  const target = direction === 'row' ? image : caption;
  const selectedProbs = direction === 'row' ? f.rows[image] : f.cols[caption];
  const targetP = selectedProbs[target];
  const [wr, wc] = weightCell;
  const w = training[iteration][weightSide][wr][wc],
    grad = g[weightSide][wr][wc];

  useEffect(() => {
    if (!playing || done) return;
    let last: number | undefined, id: number;
    const tick = (now: number) => {
      const dt = last === undefined ? 0 : Math.max(0, (now - last) / 1000);
      last = now;
      setProgress((p) => Math.max(0, Math.min(1, p + dt / 8)));
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [playing, done]);
  useEffect(() => {
    const pause = () => {
      if (document.hidden) setPlaying(false);
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) setPlaying(false);
    });
    if (canvas.current) observer.observe(canvas.current);
    document.addEventListener('visibilitychange', pause);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', pause);
    };
  }, []);
  useLessonLink(clipStepIds, go);
  function go(next: number) {
    replaceLessonStep(clipStepIds, next);
    setStep(next);
    setProgress(0);
    setPlaying(false);
    setAnswer(null);
    requestAnimationFrame(() => {
      heading.current?.focus({ preventScroll: true });
      heading.current?.scrollIntoView({ block: 'start' });
    });
  }
  function selectPair(i: number, j: number) {
    setImage(i);
    setCaption(j);
  }
  const directionControls = (
    <fieldset className="clip-direction">
      <legend>Compare in both directions</legend>
      <button
        aria-pressed={direction === 'row'}
        onClick={() => setDirection('row')}
      >
        Image → captions
      </button>
      <button
        aria-pressed={direction === 'column'}
        onClick={() => setDirection('column')}
      >
        Caption → images
      </button>
    </fieldset>
  );
  const matrix = (
    <div className="clip-comparison">
      <div className="clip-grid-label">
        <span>IMAGES ↓ · CAPTIONS →</span>
        <span>
          {step === 3
            ? [
                'COSINE SIMILARITY',
                'SCALED SCORE × 5',
                'PROBABILITY',
                'PROBABILITY',
              ][phase]
            : updated
              ? 'AFTER UPDATE'
              : `BEFORE UPDATE · ${iteration} COMPLETED`}
        </span>
      </div>
      <div className="clip-matrix">
        <span />
        {order.map((j) => (
          <span className={'clip-axis clip-color-' + j} key={j}>
            {examples[j].name}
          </span>
        ))}
        {examples.map((ex, i) => (
          <div className="clip-grid-row" key={ex.name}>
            <span className={'clip-axis clip-color-' + i}>{ex.name}</span>
            {order.map((j) => {
              const selected = i === image && j === caption;
              const focus = direction === 'row' ? i === image : j === caption;
              const revealed =
                step !== 1 ||
                (selected
                  ? progress >= 0.45
                  : i === image
                    ? progress >= 0.6
                    : progress >=
                      0.7 +
                        0.15 *
                          examples
                            .filter((_, k) => k !== image)
                            .findIndex((ex) => ex.name === examples[i].name));
              const value =
                step === 3 && phase >= 2
                  ? direction === 'row'
                    ? f.rows[i][j]
                    : f.cols[j][i]
                  : step === 3 && phase === 1
                    ? f.logits[i][j]
                    : f.scores[i][j];
              return (
                <button
                  key={j}
                  aria-label={`${ex.name} image and ${examples[j].name} caption: ${fmt(value)}${i === j ? ', known match' : ''}`}
                  aria-pressed={selected}
                  className={
                    (selected ? 'clip-selected ' : '') +
                    (step >= 2 && i === j ? 'clip-match ' : '') +
                    (!focus && step >= 2 && step <= 3 ? 'clip-dim' : '')
                  }
                  style={{
                    background: `rgba(124,219,207,${0.04 + (f.scores[i][j] + 1) * 0.12})`,
                  }}
                  onClick={() => selectPair(i, j)}
                >
                  <strong>
                    {revealed
                      ? step === 3 && phase >= 2
                        ? `${(value * 100).toFixed(1)}%`
                        : fmt(value)
                      : '·'}
                  </strong>
                  <small>
                    {step >= 2
                      ? i === j
                        ? 'known pair'
                        : 'alternative'
                      : 'similarity'}
                  </small>
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <p className="clip-caption">
        {step >= 2
          ? 'Mint borders identify the supplied pairings. Gold follows your selected comparison.'
          : 'Select any cell to follow its image and caption.'}{' '}
        {step >= 2 && step <= 3
          ? `Focused ${direction === 'row' ? 'image row' : 'caption column'}: ${examples[target].name}.`
          : ''}
      </p>
    </div>
  );
  return (
    <main className="clip">
      <header className="topbar">
        <a href="/" className="brand">
          <Layers3 size={23} />
          layerwise<span className="prototype-label">EXPLORER</span>
        </a>
        <span className="lesson-title">03 / Inside CLIP</span>
        <LessonSwitcher />
      </header>
      <div className="clip-shell">
        <aside className="clip-outline">
          <span className="section-label">THE LEARNING JOURNEY</span>
          <h2>
            From pairs
            <br />
            to representations.
          </h2>
          <p>
            One batch. Two encoders.
            <br />A shared learning signal.
          </p>
          {steps.map((s, i) => (
            <button
              key={s.name}
              aria-current={step === i ? 'step' : undefined}
              onClick={() => go(i)}
            >
              <span>0{i + 1}</span>
              {s.name}
            </button>
          ))}
          <div className="clip-outline-note">
            A CLIP-style teaching model.
            <br />3 pairs · 3 features · 2 linear encoders.
            <br />
            Real calculations, simplified inputs.
          </div>
        </aside>
        <div className="clip-content">
          <div className="clip-orientation">
            <span className="section-label">
              FOLLOW A PAIR · LEARN AT YOUR PACE
            </span>
            <p>
              Read the question, play or scrub the calculation, then take one
              idea to the next step. Open “Go deeper” when you want the details.
            </p>
          </div>
          <div className="clip-step-picker">
            <label htmlFor="clip-step">Lesson step</label>
            <select
              id="clip-step"
              value={step}
              onChange={(e) => go(Number(e.target.value))}
            >
              {steps.map((s, i) => (
                <option value={i} key={s.name}>
                  {i + 1}. {s.name}
                </option>
              ))}
            </select>
          </div>
          <span className="section-label">
            {step < 5 ? 'TRAINING' : 'INFERENCE'} · STEP {step + 1} OF 6
          </span>
          <h1 ref={heading} tabIndex={-1} className="clip-question">
            {current.question}
          </h1>
          <p className="clip-lead">
            <b>Watch for:</b> {current.cue}
          </p>
          <section
            className="clip-canvas"
            ref={canvas}
            aria-label={current.name}
          >
            {step === 0 && (
              <>
                <div className="clip-pairs">
                  {examples.map((ex, i) => {
                    const Icon = icons[i];
                    const focused = i === image;
                    return (
                      <div
                        className={
                          'clip-pair clip-color-' +
                          i +
                          (focused ? ' clip-followed' : '')
                        }
                        key={ex.name}
                      >
                        <button
                          className="clip-pair-id"
                          aria-pressed={focused}
                          onClick={() => selectPair(i, i)}
                        >
                          FOLLOW PAIR {i + 1}
                        </button>
                        <div className="clip-picture">
                          <Icon size={42} strokeWidth={1.2} />
                          <span>{ex.name}</span>
                        </div>
                        <div className="clip-encoding">
                          Supplied image features<code>{vector(ex.image)}</code>
                        </div>
                        <div
                          className="clip-encoder image"
                          style={{ opacity: progress >= 0.15 ? 1 : 0.35 }}
                        >
                          ↓ Image encoder <b>Wᵢ</b>
                          <code>
                            {progress >= 0.3
                              ? vector(before.rawImage[i])
                              : '3 features → 3 values'}
                          </code>
                        </div>
                        <div className="clip-encoding clip-output">
                          ↓ Normalize
                          <code>
                            {progress >= 0.5
                              ? vector(before.images[i])
                              : '[ · , · , · ]'}
                          </code>
                        </div>
                        <div className="clip-space-label">SHARED 3D SPACE</div>
                        <div className="clip-encoding clip-output">
                          ↑ Normalize
                          <code>
                            {progress >= 0.5
                              ? vector(before.texts[i])
                              : '[ · , · , · ]'}
                          </code>
                        </div>
                        <div
                          className="clip-encoder text"
                          style={{ opacity: progress >= 0.15 ? 1 : 0.35 }}
                        >
                          ↑ Text encoder <b>Wₜ</b>
                          <code>
                            {progress >= 0.3
                              ? vector(before.rawText[i])
                              : '3 features → 3 values'}
                          </code>
                        </div>
                        <div className="clip-encoding">
                          Supplied text features<code>{vector(ex.text)}</code>
                        </div>
                        <blockquote>“{ex.caption}”</blockquote>
                      </div>
                    );
                  })}
                </div>
                <p className="clip-toy-note">
                  The icons and captions label hand-picked feature vectors. This
                  toy uses trainable linear encoders; it does not extract pixels
                  or tokenize language. These are the weights after {iteration}{' '}
                  updates.
                </p>
              </>
            )}
            {step === 1 && (
              <>
                <div className="clip-worked">
                  <span className="section-label">
                    ONE COMPARISON · {examples[image].name} ×{' '}
                    {examples[caption].name}
                  </span>
                  <div className="clip-products">
                    {before.images[image].map((v, k) => (
                      <span key={k}>
                        <small>COORDINATE {k + 1}</small>
                        <code>
                          {fmt(v)} × {fmt(before.texts[caption][k])}
                        </code>
                        <strong>
                          {progress >= 0.12 * (k + 1)
                            ? fmt(v * before.texts[caption][k])
                            : '·'}
                        </strong>
                      </span>
                    ))}
                    <b>
                      ={' '}
                      {progress >= 0.45
                        ? fmt(before.scores[image][caption])
                        : '?'}
                    </b>
                  </div>
                </div>
                {matrix}
              </>
            )}
            {step === 2 && (
              <>
                <div className="clip-worked">
                  {directionControls}
                  <div className="clip-target">
                    <span>
                      {direction === 'row' ? 'Image' : 'Caption'}:{' '}
                      {examples[target].name}
                    </span>
                    <ArrowRight size={20} />
                    <strong>
                      {progress < 0.25
                        ? 'Find its known partner'
                        : `${direction === 'row' ? 'Caption' : 'Image'}: ${examples[target].name}`}
                    </strong>
                  </div>
                  <p className="clip-caption">
                    {progress < 0.6
                      ? 'The correct partner is supplied with the example, even when its score is low.'
                      : 'The selected row or column has one target and two alternatives. The loss compares them together.'}
                  </p>
                  <button
                    className="secondary"
                    onClick={() => setOrder(([a, b, c]) => [b, c, a])}
                  >
                    Reorder captions
                  </button>
                </div>
                {matrix}
              </>
            )}
            {step === 3 && (
              <>
                <div className="clip-worked">
                  {directionControls}
                  <div className="clip-phases">
                    {[
                      'Similarity',
                      'Scale × 5',
                      'Softmax',
                      '−log(target P)',
                    ].map((s, i) => (
                      <span key={s} className={phase === i ? 'active' : ''}>
                        {i + 1}. {s}
                      </span>
                    ))}
                  </div>
                </div>
                {matrix}
                <div className="clip-worked clip-loss">
                  <div>
                    <span className="section-label">
                      CORRECT {direction === 'row' ? 'CAPTION' : 'IMAGE'} ·{' '}
                      {examples[target].name}
                    </span>
                    <p>
                      −ln({targetP.toFixed(3)}) ={' '}
                      <strong>
                        {phase >= 3 ? (-Math.log(targetP)).toFixed(3) : '…'}
                      </strong>
                    </p>
                    <div className="clip-prob-track">
                      <span style={{ width: `${targetP * 100}%` }} />
                    </div>
                    <span className="clip-caption">
                      {(targetP * 100).toFixed(1)}% assigned to the known match
                    </span>
                  </div>
                  <div className={phase < 3 ? 'clip-dim' : ''}>
                    <span className="section-label">
                      ALL SIX MATCHING TASKS
                    </span>
                    <div className="clip-loss-bars">
                      {[...before.rowLoss, ...before.colLoss].map((loss, k) => (
                        <div key={k}>
                          <span>
                            {k < 3 ? 'I→T' : 'T→I'} · {examples[k % 3].name}
                          </span>
                          <i style={{ width: `${(loss / 4) * 100}%` }} />
                          <code>{loss.toFixed(3)}</code>
                        </div>
                      ))}
                    </div>
                    <p>
                      Mean penalty = <strong>{before.loss.toFixed(3)}</strong>
                    </p>
                  </div>
                </div>
              </>
            )}
            {step === 4 && (
              <>
                <div className="clip-worked">
                  <div className="clip-update-status">
                    <span className="section-label">
                      UPDATE {iteration + 1} · SGD · LEARNING RATE{' '}
                      {learningRate}
                    </span>
                    <button
                      className="secondary"
                      onClick={() => {
                        setIteration(0);
                        setProgress(0);
                        setPlaying(false);
                      }}
                    >
                      Reset weights
                    </button>
                  </div>
                  <div className="clip-backprop">
                    <span className="active">
                      Loss
                      <br />
                      <b>{before.loss.toFixed(3)}</b>
                    </span>
                    <span className={progress >= 0.2 ? 'active' : ''}>
                      ← Comparisons
                      <br />← Normalization
                    </span>
                    <span className={progress >= 0.35 ? 'active' : ''}>
                      ↙ Image encoder
                      <br />↖ Text encoder
                    </span>
                  </div>
                  <p className="clip-caption">
                    Backpropagation finds how each weight affects the loss,
                    through both directions of comparison.
                  </p>
                  <div className="clip-weights">
                    {(['image', 'text'] as const).map((side) => (
                      <div key={side}>
                        <h3>
                          {side === 'image' ? 'Image' : 'Text'} encoder{' '}
                          <span>
                            {updated
                              ? 'new weights'
                              : progress >= 0.35
                                ? 'gradients'
                                : 'weights'}
                          </span>
                        </h3>
                        <div>
                          {training[iteration][side].map((row, r) =>
                            row.map((weight, c) => (
                              <button
                                key={`${r}-${c}`}
                                className={
                                  weightSide === side && wr === r && wc === c
                                    ? 'clip-selected'
                                    : ''
                                }
                                aria-pressed={
                                  weightSide === side && wr === r && wc === c
                                }
                                aria-label={`${side} weight row ${r + 1} column ${c + 1}`}
                                onClick={() => {
                                  setWeightSide(side);
                                  setWeightCell([r, c]);
                                }}
                              >
                                {fmt(
                                  updated
                                    ? training[iteration + 1][side][r][c]
                                    : progress >= 0.35
                                      ? g[side][r][c]
                                      : weight,
                                )}
                              </button>
                            )),
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="clip-weight-equation">
                    <span className="section-label">
                      {weightSide.toUpperCase()} WEIGHT · OUTPUT {wr + 1}, INPUT{' '}
                      {wc + 1}
                    </span>
                    <p>
                      <span>{w.toFixed(3)}</span> − <span>{learningRate}</span>{' '}
                      × <span>{grad.toFixed(3)}</span> ={' '}
                      <strong>
                        {progress >= 0.6
                          ? (w - learningRate * grad).toFixed(3)
                          : '?'}
                      </strong>
                    </p>
                    <small>
                      old weight − learning rate × gradient = new weight
                    </small>
                  </div>
                  <div className="clip-loss-change">
                    <span>
                      Loss before <b>{before.loss.toFixed(3)}</b>
                    </span>
                    <ArrowRight size={22} />
                    <span>
                      After another forward pass{' '}
                      <b>{updated ? after.loss.toFixed(3) : '…'}</b>
                    </span>
                  </div>
                  <p className="clip-caption">
                    {updated
                      ? 'The matrix below now uses the updated encoders. Compare it with the beginning of this step by scrubbing back.'
                      : 'The loss does not change until the updated weights are used in a new forward pass.'}
                  </p>
                  <button
                    className="secondary"
                    disabled={!done || iteration >= 39}
                    onClick={() => {
                      setIteration((i) => i + 1);
                      setProgress(0);
                      setPlaying(false);
                    }}
                  >
                    Inspect next update
                  </button>
                </div>
                {matrix}
              </>
            )}
            {step === 5 && (
              <div className="clip-worked clip-inference">
                <span className="section-label">
                  FROZEN AFTER 40 TOY UPDATES
                </span>
                <div className="clip-inference-flow">
                  <div>
                    <Cat size={46} />
                    <h3>A new toy cat input</h3>
                    <code>{vector(newImage)}</code>
                    <p className="clip-caption">
                      A held-out feature vector, not a photograph. It was not
                      used in the three-pair training batch.
                    </p>
                  </div>
                  <ArrowRight />
                  <div className="clip-encoder image">
                    Fixed image encoder
                    <code>
                      {progress >= 0.2
                        ? vector(inference.image)
                        : 'unit vector · 3 values'}
                    </code>
                  </div>
                </div>
                <p>
                  Candidate text uses the fixed text encoder. Remove a
                  description to see how relative probabilities change without
                  updating a single weight.
                </p>
                {examples.map((ex, j) => {
                  const at = candidates.indexOf(j);
                  return (
                    <div className="clip-candidate" key={ex.name}>
                      <label>
                        <input
                          type="checkbox"
                          checked={at >= 0}
                          disabled={at >= 0 && candidates.length === 1}
                          onChange={() =>
                            setCandidates((c) =>
                              c.includes(j)
                                ? c.filter((x) => x !== j)
                                : [...c, j],
                            )
                          }
                        />
                        {ex.caption}
                      </label>
                      <span>
                        {at >= 0 && progress >= 0.4
                          ? `similarity ${fmt(inference.scores[at])}`
                          : '—'}
                      </span>
                      <strong>
                        {at >= 0 && progress >= 0.65
                          ? `${(inference.probabilities[at] * 100).toFixed(1)}%`
                          : '—'}
                      </strong>
                      {at >= 0 && (
                        <div
                          className="clip-candidate-bar"
                          style={{
                            width: `${progress >= 0.65 ? inference.probabilities[at] * 100 : 0}%`,
                          }}
                        />
                      )}
                    </div>
                  );
                })}
                <p className="clip-caption">
                  Training loss: {forward(training[0]).loss.toFixed(3)} →{' '}
                  {forward(training[40]).loss.toFixed(3)}. This tiny constructed
                  example demonstrates the mechanism, not real-world recognition
                  or generalization.
                </p>
              </div>
            )}
            <div className="clip-playback">
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
                  onChange={(e) => {
                    setProgress(Number(e.target.value));
                    setPlaying(false);
                  }}
                />
                <button
                  className="clip-complete"
                  onClick={() => {
                    setProgress(1);
                    setPlaying(false);
                  }}
                >
                  Show result
                </button>
              </div>
              <p>
                Drag to explore at your own pace. Playback stays within this
                step.
              </p>
            </div>
          </section>
          <section className="clip-takeaway">
            <span className="section-label">TAKE ONE IDEA WITH YOU</span>
            <h2>{current.takeaway}</h2>
            <p>{current.text}</p>
          </section>
          <nav className="clip-continue" aria-label="CLIP lesson steps">
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
          <h2 className="clip-deeper-title">Go deeper</h2>
          <details className="clip-details">
            <summary>Where do these inputs and weights come from?</summary>
            <p>
              The cat, bicycle and tree have supplied, fixed 3-number image and
              text features. Two separate 3 × 3 linear matrices act as encoders.
              Both are trainable; the feature inputs stay fixed. Real CLIP uses
              much richer image and text encoders and projection layers. This
              exercise collapses those networks into small linear maps so every
              weight update can be inspected.
            </p>
            <p>
              Steps 1–4 use the weights after {iteration} toy updates; step 5
              demonstrates update {iteration + 1}. Step 6 uses a fixed snapshot
              after 40 updates on the same batch, even if you skip ahead. The
              score scale is fixed at 5, whereas CLIP learns a temperature
              parameter. Our optimizer is plain SGD, not CLIP’s full training
              recipe.
            </p>
            <p>
              References:{' '}
              <a
                href="https://arxiv.org/abs/2103.00020"
                target="_blank"
                rel="noreferrer"
              >
                CLIP paper
              </a>{' '}
              ·{' '}
              <a
                href="https://github.com/openai/CLIP"
                target="_blank"
                rel="noreferrer"
              >
                Official implementation
              </a>
              .
            </p>
          </details>
          <details className="clip-details">
            <summary>How do the dimensions fit?</summary>
            <div className="clip-shapes">
              <span className="clip-color-0">
                Image features [3 pairs, 3 features]
              </span>
              <span className="clip-color-1">
                Image weights [3 outputs, 3 inputs]
              </span>
              <span className="clip-color-0">
                Image vectors [3 pairs, 3 coordinates]
              </span>
              <span className="clip-color-2">
                Text vectors [3 pairs, 3 coordinates]
              </span>
              <span className="clip-color-1">
                Comparisons [3 images, 3 captions]
              </span>
              <span className="clip-color-0">Mean loss [1 scalar]</span>
            </div>
            <p>
              The two kinds of features need not have the same size in a real
              model. Their final projected vectors must share a coordinate
              dimension for the dot product. A gradient has the same shape as
              the weight matrix it updates.
            </p>
          </details>
          <details className="clip-details">
            <summary>How was this number calculated?</summary>
            {step === 0 ? (
              <p>
                For the selected image, output coordinate 1 is{' '}
                {examples[image].image
                  .map(
                    (x, k) =>
                      `${fmt(x)} × ${fmt(training[iteration].image[0][k])}`,
                  )
                  .join(' + ')}{' '}
                ={' '}
                {fmt(
                  encode(examples[image].image, training[iteration].image)[0],
                )}
                . Divide each output coordinate by the vector’s length to
                normalize.
              </p>
            ) : step === 3 ? (
              <p>
                For this {direction === 'row' ? 'row' : 'column'}, softmax takes
                exp(5 × similarity), then divides by their sum. The
                correct-match probability is {targetP.toFixed(6)}; its penalty
                is −ln({targetP.toFixed(6)}) = {(-Math.log(targetP)).toFixed(6)}
                . The six penalties are averaged, not summed.
              </p>
            ) : step === 4 ? (
              <p>
                The selected gradient is {grad.toFixed(6)}. SGD gives{' '}
                {w.toFixed(6)} − {learningRate} × ({grad.toFixed(6)}) ={' '}
                {(w - learningRate * grad).toFixed(6)}. Gradients include
                normalization and all pairs in both directions; they are not
                just the selected cell’s error.
              </p>
            ) : (
              <p>
                A cosine similarity is the sum of coordinate products after
                normalizing both vectors. For the selected training pair:{' '}
                {f.images[image]
                  .map((v, k) => `${fmt(v)} × ${fmt(f.texts[caption][k])}`)
                  .join(' + ')}{' '}
                = {fmt(f.scores[image][caption])}.
              </p>
            )}
            <p>
              Displayed values are rounded; calculations use full precision.
              Rounded operands may appear not to add up exactly.
            </p>
          </details>
          <details className="clip-details">
            <summary>How would I write this?</summary>
            <p>Python-like pseudocode for this teaching model.</p>
            <pre>{current.code}</pre>
          </details>
          {(step === 2 || step === 5) && (
            <details className="clip-details">
              <summary>Try a quick prediction · optional</summary>
              <p>
                {step === 2
                  ? 'If we reorder the captions, where do the correct matches go?'
                  : 'If we remove “a photo of a tree”, do the encoder weights change?'}
              </p>
              <div className="clip-answers">
                {(step === 2
                  ? [
                      'They stay on the diagonal',
                      'They follow their paired captions',
                    ]
                  : [
                      'Yes, to fit the new candidates',
                      'No, only the comparison changes',
                    ]
                ).map((s, i) => (
                  <button
                    key={s}
                    className="secondary"
                    aria-pressed={answer === i}
                    onClick={() => setAnswer(i)}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {answer !== null && (
                <output className="clip-answer">
                  {answer === 1 ? 'Exactly. ' : 'Try the control above. '}
                  {step === 2
                    ? 'Pair identity supplies the target. Its position moves when the captions move.'
                    : 'Inference keeps the encoders fixed. Removing an alternative changes the softmax denominator and the remaining probabilities.'}
                </output>
              )}
            </details>
          )}
        </div>
      </div>
    </main>
  );
}
