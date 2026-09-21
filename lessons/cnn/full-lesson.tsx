'use client';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Layers3, ArrowLeft, ArrowRight } from 'lucide-react';
import LessonSwitcher from '../../components/lesson-switcher';
import PipelineShape from './pipeline-shape';
import ConvolutionStep from './lesson';
import StagePlayer from './stage-player';
import { examples, runCnn, kernels } from './model';
import { steps, describeStage } from './stages';
export default function FullCnnLesson() {
  const [step, setStep] = useState(0),
    [example, setExample] = useState(0),
    [stride, setStride] = useState(1),
    [channel, setChannel] = useState(0),
    [selected, setSelected] = useState(1),
    [welcome, setWelcome] = useState(true),
    [navigation, setNavigation] = useState(0),
    [answer, setAnswer] = useState<number | null>(null);
  const heading = useRef<HTMLDivElement>(null);
  const model = useMemo(
    () => runCnn(examples[example].values, stride),
    [example, stride],
  );
  const current = steps[step],
    d = describeStage(model, step, channel, selected);
  function go(n: number) {
    setStep(n);
    if (n > 0)
      setSelected((i) => Math.min(i, model.convolution[0].length ** 2 - 1));
    setWelcome(false);
    setAnswer(null);
    setNavigation((v) => v + 1);
  }
  useLayoutEffect(() => {
    if (!navigation) return;
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView({ block: 'start' });
  }, [navigation]);
  const controls = (
    <nav className="cnn-continue" aria-label="CNN lesson steps">
      <button
        className="secondary"
        disabled={step === 0}
        onClick={() => go(step - 1)}
      >
        <ArrowLeft size={16} />
        Back
      </button>
      <span className="muted">
        {step + 1} / {steps.length}
      </span>
      <button className="primary" onClick={() => go(step === 6 ? 0 : step + 1)}>
        {step === 6 ? 'Restart journey' : 'Next step'}
        <ArrowRight size={16} />
      </button>
    </nav>
  );
  return (
    <main className="cnn-lesson">
      <header className="topbar">
        <Link href="/" className="brand">
          <Layers3 size={23} />
          layerwise<span className="prototype-label">EXPLORER</span>
        </Link>
        <span className="lesson-title">
          02 <span>/</span> Inside a CNN
        </span>
        <LessonSwitcher current="cnn" />
      </header>
      <div className="workspace">
        <aside className="architecture">
          <span className="section-label">THE ARCHITECTURE</span>
          <h2>From pixels to probabilities.</h2>
          <p className="muted">One complete forward pass.</p>
          {steps.map((s, i) => (
            <button
              key={s.short}
              className={'map-step ' + (step === i ? 'active' : '')}
              aria-current={step === i ? 'step' : undefined}
              onClick={() => go(i)}
            >
              <span className="step-dot" />
              {s.short}
            </button>
          ))}
          <div className="architecture-footer">
            <span className="section-label">THIS MODEL</span>
            <p>
              6 × 6 grayscale image → 2 filters → ReLU → 2 × 2 max pooling →
              dense layer → 2 classes.
            </p>
            <p>
              Fixed, untrained teaching weights. All values are calculated in
              your browser.
            </p>
          </div>
        </aside>
        <section className="lesson">
          {welcome && (
            <section className="orientation journey-welcome">
              <span className="section-label">
                ONE IMAGE · SEVEN CONNECTED STEPS
              </span>
              <h2>Follow an image through a CNN.</h2>
              <p>
                Start with brightness values, discover local features, compress
                each map, then combine the evidence into class scores and
                probabilities.
              </p>
              <div className="welcome-rhythm">
                <span>
                  <b>1</b>Read the question
                </span>
                <span>
                  <b>2</b>Play or scrub
                </span>
                <span>
                  <b>3</b>Take one idea with you
                </span>
              </div>
              <p className="orientation-hint">
                Follow a location in the feature map. After pooling, follow its
                contribution to the feature vector. Optional inputs, dimensions,
                code and arithmetic stay below each step.
              </p>
              <button className="primary" onClick={() => go(0)}>
                Follow this image <ArrowRight size={16} />
              </button>
            </section>
          )}
          <div className="breadcrumb">
            CNN walkthrough <span>/</span>
            {current.short}
          </div>
          <p className="cnn-model-note">
            Illustrative, untrained weights · Class A and Class B are
            demonstration labels, not learned categories.
          </p>
          <div className="lesson-heading" ref={heading} tabIndex={-1}>
            <div>
              <div className="eyebrow">
                STEP {step + 1} OF {steps.length}
              </div>
              <h1>
                {current.title}
                <span>.</span>
              </h1>
            </div>
          </div>
          <div className="journey-question">
            <span className="section-label">
              {step < 5
                ? `FOLLOWING CHANNEL ${step === 0 ? 0 : channel} · LOCATION [${d.r}, ${d.c}]`
                : 'COMBINING BOTH CHANNELS'}
            </span>
            <p>{current.question}</p>
            <span className="watch-for">Watch for: {current.watch}</span>
          </div>
          <div className="cnn-settings">
            <label>
              Image
              <select
                value={example}
                onChange={(e) => setExample(Number(e.target.value))}
              >
                {examples.map((v, i) => (
                  <option key={v.name} value={i}>
                    {v.name}
                  </option>
                ))}
              </select>
            </label>
            {step !== 1 && step > 0 && step < 5 && (
              <label>
                Inspect channel
                <select
                  value={channel}
                  onChange={(e) => setChannel(Number(e.target.value))}
                >
                  {kernels.map((k, i) => (
                    <option value={i} key={k.name}>
                      {i} · {k.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <span className="muted">
              Convolution stride {stride} · both channels continue through the
              model
            </span>
          </div>
          {step === 1 ? (
            <ConvolutionStep
              key={`${example}`}
              image={model.input}
              kernelIndex={channel}
              setKernelIndex={setChannel}
              stride={stride}
              setStride={(n) => {
                setStride(n);
                setSelected(0);
              }}
              selected={selected}
              setSelected={setSelected}
              navigation={controls}
            />
          ) : (
            <>
              <StagePlayer
                key={`${step}-${example}-${stride}-${channel}-${selected}`}
                model={model}
                step={step}
                channel={channel}
                selected={selected}
                onChannel={setChannel}
                onSelect={(i) =>
                  setSelected(
                    Math.min(
                      i,
                      (step === 0 ? 36 : model.convolution[0].length ** 2) - 1,
                    ),
                  )
                }
              />
              <p className="rounding-note">
                Displayed values are rounded to 2 decimal places; calculations
                use full precision. Rounded operands may not add up exactly to
                the displayed result.
              </p>
              <section className="journey-takeaway">
                <span className="section-label">TAKE ONE IDEA WITH YOU</span>
                <h2>{current.takeaway}</h2>
                <p>{current.idea}</p>
              </section>
              {controls}
              <section className="journey-depth" key={step}>
                <div className="depth-heading">
                  <h2>Go deeper, when you’re ready.</h2>
                  <p>
                    Inputs, dimensions, pseudocode and arithmetic are here when
                    you want them.
                  </p>
                </div>
                <details className="journey-detail">
                  <summary>Where did these inputs come from?</summary>
                  <div className="cnn-detail-body">
                    <p>{d.origin}</p>
                    {step > 0 && (
                      <button
                        className="secondary"
                        onClick={() => go(step - 1)}
                      >
                        Return to {steps[step - 1].short}
                      </button>
                    )}
                  </div>
                </details>
                <details className="journey-detail">
                  <summary>How do the dimensions fit?</summary>
                  <div className="cnn-detail-body">
                    <p>
                      {step < 4
                        ? 'Axis order: [batch, channels, height, width].'
                        : 'Vectors use [batch, features] or [batch, classes].'}{' '}
                      Batches stay separate throughout the network.
                    </p>
                    <div className="cnn-shapes">
                      <p>
                        <b className="cnn-input-tone">Input</b>
                        <PipelineShape
                          shape={d.inputShape}
                          classes={step === 6}
                        />
                      </p>
                      <p>
                        <b className="cnn-output-tone">Output</b>
                        <PipelineShape
                          shape={d.outputShape}
                          classes={step >= 5}
                        />
                      </p>
                    </div>
                    <p>
                      {step === 0
                        ? 'One image has one grayscale channel, six rows and six columns.'
                        : step === 2
                          ? 'ReLU changes values element by element. All four dimensions stay the same.'
                          : step === 3
                            ? `A 2 × 2 window and stride 2 divide each spatial dimension by two here. Channels stay at 2. ${model.convolution[0].length} × ${model.convolution[0].length} becomes ${model.pooled[0].length} × ${model.pooled[0].length}.`
                            : step === 4
                              ? `2 channels × ${model.pooled[0].length} rows × ${model.pooled[0].length} columns = ${model.flattened.length} features. The order is channel, row, column.`
                              : step === 5
                                ? `[1, ${model.flattened.length}] × [${model.flattened.length}, 2] + bias [2] = [1, 2]. Each class combines all features.`
                                : 'Softmax normalises over the two classes of this image, preserving [1, 2].'}
                    </p>
                  </div>
                </details>
                <details className="journey-detail">
                  <summary>How would I write this?</summary>
                  <div className="cnn-detail-body">
                    <span className="section-label">PSEUDOCODE</span>
                    <pre>{d.code}</pre>
                  </div>
                </details>
                <details className="journey-detail">
                  <summary>How was this number calculated?</summary>
                  <div className="cnn-detail-body">
                    <pre className="cnn-worked">{d.calculation}</pre>
                    {step === 6 && (
                      <p>
                        Subtracting the maximum keeps exponentials numerically
                        stable without changing the probabilities. The
                        denominator is the sum of both exponentials.
                      </p>
                    )}
                  </div>
                </details>
                {(step === 2 || step === 4 || step === 6) && (
                  <details className="journey-detail intuition-check">
                    <summary>
                      Try a quick prediction <span>optional</span>
                    </summary>
                    <div className="intuition-body">
                      <p>
                        {step === 2
                          ? 'Does ReLU change the number of channels?'
                          : step === 4
                            ? 'Does flatten add the pooled values together?'
                            : 'Does a high probability prove this model recognises the image?'}
                      </p>
                      <div className="intuition-options">
                        {['Yes', 'No'].map((a, i) => (
                          <button
                            className="secondary"
                            key={a}
                            aria-pressed={answer === i}
                            onClick={() => setAnswer(i)}
                          >
                            {a}
                          </button>
                        ))}
                      </div>
                      {answer !== null && (
                        <output className="cnn-answer">
                          {answer === 1 ? 'Correct.' : 'Not quite.'}{' '}
                          {current.idea}
                        </output>
                      )}
                    </div>
                  </details>
                )}
              </section>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
