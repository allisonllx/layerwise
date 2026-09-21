import TensorShape, { ShapeLegend } from './tensor-shape';
import type { Projection, MlpStage } from './tensor-canvas';

type Input = { name: string; source: string; from?: number; shape: string };
export default function TensorFlow({
  step,
  tokens,
  projection,
  mlp,
  onNavigate,
  view = 'dimensions',
}: {
  view?: 'origins' | 'dimensions';
  step: number;
  tokens: number;
  projection: Projection;
  mlp: MlpStage;
  onNavigate: (step: number, projection?: Projection, mlp?: MlpStage) => void;
}) {
  const base = `[1, ${tokens}, 12]`,
    heads = `[1, 3, ${tokens}, 4]`,
    scores = `[1, 3, ${tokens}, ${tokens}]`,
    p = projection.toUpperCase();
  const source = (name: string, from: number, shape = base): Input => ({
    name,
    from,
    source: `From step ${from + 1}`,
    shape,
  });
  const inputs: Input[][] = [
    [
      {
        name: 'Token IDs',
        source: 'From the example sentence',
        shape: `[1, ${tokens}]`,
      },
    ],
    [source('Word + position features', 0)],
    [source('Normalised features', 1)],
    [source(`${p} projected features`, 2)],
    [source(`${p} split into heads`, 3, `[1, ${tokens}, 3, 4]`)],
    [
      source('Queries (Q)', 4, heads),
      {
        ...source('Transposed keys (Kᵀ)', 4, `[1, 3, 4, ${tokens}]`),
        source: 'From step 5; last two axes swapped here',
      },
    ],
    [source('Scaled attention scores', 5, scores)],
    [
      source('Attention weights (softmax result)', 6, scores),
      source('Value vectors (V)', 4, heads),
    ],
    [source('Mixed features, in separate heads', 7, heads)],
    [
      source('Original block input: word + position features', 0),
      source('Projected attention contribution', 8),
    ],
    [source('First residual output', 9)],
    [
      source('First residual output (saved shortcut)', 9),
      source('MLP contribution', 10),
    ],
  ];
  const outputs = [
    'Word + position features',
    'Normalised features',
    `${p} projected features`,
    `${p} split into heads`,
    `${p} arranged by head`,
    'Scaled attention scores',
    'Attention weights',
    'Mixed value features',
    'Projected attention contribution',
    'Updated features (first residual output)',
    {
      n2: 'Normalised residual features',
      up: 'Expanded MLP features',
      activated: 'MLP features after GELU',
      down: 'MLP contribution',
    }[mlp],
    'Next-token probabilities',
  ];
  const outputShapes = [
    base,
    base,
    base,
    `[1, ${tokens}, 3, 4]`,
    heads,
    scores,
    scores,
    heads,
    base,
    base,
    `[1, ${tokens}, ${mlp === 'up' || mlp === 'activated' ? 48 : 12}]`,
    `[1, ${tokens}, 12]`,
  ];
  const operations = [
    'Look up each token’s embedding, then add its position embedding.',
    'Normalise the features within each token.',
    `Normalised features × the ${p} weight matrix. Q, K and V use separate matrices.`,
    'Reshape 12 features into 3 heads of 4 features.',
    'Move the head axis before the token axis.',
    'Q × Kᵀ, then divide each score by √4 = 2.',
    'Hide future tokens, then apply softmax to each row.',
    'Attention weights × value vectors → mixed features.',
    'Join the heads, then multiply by the output weight matrix.',
    'Original block input + projected attention contribution, feature by feature.',
    {
      n2: 'Normalise the residual features.',
      up: 'Normalise, then project from 12 to 48 features.',
      activated: 'Normalise, expand to 48 features, then apply GELU.',
      down: 'Normalise → expand to 48 → GELU → compress to 12 features.',
    }[mlp],
    'Add the saved residual + MLP contribution; then final normalisation, vocabulary projection and softmax.',
  ];
  return (
    <div className="shape-strip compact-shapes tensor-flow">
      <span>INPUTS & OUTPUT</span>
      <div className="tensor-flow-rows">
        {inputs[step].map((item, i) => (
          <div className="tensor-flow-row" key={item.name}>
            <div>
              <span className="shape-role">
                Input {inputs[step].length > 1 ? i + 1 : ''}
              </span>
              <strong>{item.name}</strong>
              {item.from !== undefined ? (
                <button
                  className="tensor-source"
                  onClick={() =>
                    onNavigate(
                      item.from!,
                      step === 5
                        ? i === 0
                          ? 'q'
                          : 'k'
                        : step === 7 && i === 1
                          ? 'v'
                          : undefined,
                      step === 11 && i === 1 ? 'down' : undefined,
                    )
                  }
                >
                  {item.source} ↗
                </button>
              ) : (
                <small>{item.source}</small>
              )}
            </div>
            {view === 'dimensions' && (
              <TensorShape text={item.shape} step={step} tensorIndex={i} />
            )}
          </div>
        ))}
        <p className="tensor-flow-operation">{operations[step]}</p>
        {view === 'origins' && (step === 9 || step === 11) && (
          <div className="residual-explainer">
            <strong>
              Residual addition = earlier features + a new contribution
            </strong>
            <p>
              A skip connection carries the earlier features around the
              intervening calculations. Add matching features; the number of
              features stays the same.
            </p>
            <div className="diagram-scroll">
              <svg
                viewBox="0 0 800 140"
                role="img"
                aria-label={
                  step === 9
                    ? 'Step 1 features bypass attention steps 2 to 9 and join the attention contribution at an addition'
                    : 'Step 10 features bypass the MLP in step 11 and join its contribution at an addition'
                }
              >
                <text x="18" y="24" fill="#70d2c4" fontSize="14">
                  {step === 9
                    ? 'Step 1 · original features'
                    : 'Step 10 · saved residual features'}
                </text>
                <path
                  d="M 25 40 H 610 V 65"
                  fill="none"
                  stroke="#70d2c4"
                  strokeWidth="2"
                />
                <text x="350" y="31" fill="#70d2c4" fontSize="13">
                  Skip connection · unchanged values
                </text>
                <path
                  d="M 25 40 V 100 H 585"
                  fill="none"
                  stroke="#728c99"
                  strokeWidth="2"
                />
                <text x="90" y="91" fill="#c5d4dc" fontSize="14">
                  {step === 9
                    ? 'Steps 2–9 · attention calculations'
                    : 'Step 11 · normalisation + MLP'}
                </text>
                <text x="350" y="122" fill="#c5d4dc" fontSize="13">
                  New contribution
                </text>
                <circle
                  cx="610"
                  cy="86"
                  r="23"
                  fill="#172932"
                  stroke="#70d2c4"
                />
                <text
                  x="610"
                  y="93"
                  textAnchor="middle"
                  fill="#70d2c4"
                  fontSize="25"
                >
                  +
                </text>
                <path
                  d="M 634 86 H 765 l -7 -5 M 765 86 l -7 5"
                  fill="none"
                  stroke="#70d2c4"
                  strokeWidth="2"
                />
                <text x="651" y="68" fill="#dce5e8" fontSize="13">
                  Updated features
                </text>
              </svg>
            </div>
            {step === 11 && (
              <p>
                These updated features then pass through final normalisation and
                vocabulary projection to produce the probabilities below.
              </p>
            )}
          </div>
        )}
        <div className="tensor-flow-row">
          <div>
            <span className="shape-role">Output</span>
            <strong>{outputs[step]}</strong>
            <small>
              Produced in this step{step === 10 ? ' · selected MLP stage' : ''}
            </small>
          </div>
          {view === 'dimensions' && (
            <TensorShape text={outputShapes[step]} step={step} output />
          )}
        </div>
      </div>
      {view === 'dimensions' && (
        <ShapeLegend
          input={inputs[step].map((item) => item.shape).join(' × ')}
          output={outputShapes[step]}
          step={step}
        />
      )}
      {[0, 2, 8, 10, 11].includes(step) && (
        <p className="tensor-parameter-note">
          {step === 0
            ? 'The token-embedding lookup and position calculation belong to this step.'
            : 'Projection weights are model parameters, not outputs from an earlier lesson step.'}
        </p>
      )}
    </div>
  );
}
