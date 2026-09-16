import type { Projection } from './tensor-canvas';

const terms: Record<number, [string, string][]> = {
  0: [
    ['Embedding', 'A list of numbers representing a token.'],
    ['Position', 'Numbers that tell the model where the token appears.'],
  ],
  1: [
    ['x', 'One feature value in the current token’s row.'],
    ['μ (mu)', 'The mean of the 12 values in that row.'],
    ['σ² (variance)', 'The average squared distance from the row mean.'],
    ['ε (epsilon)', 'A small number (0.00001) to avoid dividing by zero.'],
    [
      '√',
      'Square root. γ (gamma) scales the result; β (beta) shifts it. Here γ = 1 and β = 0.',
    ],
  ],
  2: [
    ['Q · queries', 'Features used to ask which other tokens are relevant.'],
    ['K · keys', 'Features that each query is compared against.'],
    ['V · values', 'Features that attention will blend together.'],
    [
      'X · normalised input',
      'The token feature matrix from the previous step.',
    ],
    [
      'W · weights',
      'A matrix of model parameters; Wq, Wk and Wv are separate projections.',
    ],
  ],
  3: [
    ['Head', 'One of 3 parallel attention calculations.'],
    [
      'Feature',
      'One number in a token’s representation. 12 features split into 3 groups of 4.',
    ],
  ],
  4: [
    ['B · batch', 'Number of sequences processed together: 1 here.'],
    ['T · tokens', 'Number of token positions in the selected sentence.'],
    ['H · heads', 'Number of attention heads: 3 here.'],
    ['F · features per head', 'Number of features in each head: 4 here.'],
  ],
  5: [
    ['Q · queries', 'One row of 4 query features per token, within one head.'],
    [
      'Kᵀ · transposed keys',
      'Key features with the last two axes swapped, so each column represents a key token.',
    ],
    ['Scores', 'One comparison score for each query-token / key-token pair.'],
    [
      '· / @',
      'Matrix multiplication: multiply matching features and add them. Divide by √4 = 2 to scale the scores.',
    ],
  ],
  6: [
    [
      'A · attention weights',
      'The masked, softmax-normalised scores; each row sums to 1.',
    ],
    [
      'Softmax',
      'Exponentiate each score, then divide by the sum of those exponentials in its row.',
    ],
    [
      'Σ · sum',
      'Add all entries in a row. exp(x) means e raised to the power x.',
    ],
    [
      '−∞ · negative infinity',
      'A masked score: its exponential is zero, so a future token receives no weight.',
    ],
  ],
  7: [
    [
      'A · attention weights',
      'The matrix from the previous step: how much each query token takes from each key token.',
    ],
    [
      'V · value features',
      'The features computed in the Q/K/V step, now grouped by head.',
    ],
    ['Context', 'The new features produced by the weighted mixture A · V.'],
    [
      '· / @',
      'Matrix multiplication. Multiply each weight by a value feature, then sum over key tokens.',
    ],
  ],
  8: [
    [
      'concat · concatenate',
      'Join the 3 heads’ feature slices into one row of 12.',
    ],
    ['Wₒ · output weights', 'A 12 × 12 matrix that mixes the joined features.'],
    [
      '· / @',
      'Matrix multiplication: compute each new feature from the joined features.',
    ],
  ],
  9: [
    [
      'x · original input',
      'The token features entering this transformer block.',
    ],
    [
      'attention(x)',
      'The full attention branch’s projected output, not the attention-weight matrix A.',
    ],
    [
      '+ · element-wise addition',
      'Add values at matching positions, without changing the shape.',
    ],
  ],
  10: [
    [
      'MLP · feed-forward network',
      'Two projections with a nonlinear activation between them.',
    ],
    [
      'W_up / W_down',
      'Weight matrices that expand 12 features to 48, then compress 48 to 12.',
    ],
    [
      'GELU · activation',
      'A smooth nonlinear function applied separately to each feature value.',
    ],
    [
      'Σ / @',
      'Sum / matrix multiplication. These combine weighted input features.',
    ],
  ],
  11: [
    ['Logits', 'Raw scores for the 12 entries in this toy vocabulary.'],
    ['Softmax', 'Converts vocabulary scores into probabilities that sum to 1.'],
    ['W_vocab', 'Weights that map token features to vocabulary scores.'],
  ],
};

export default function OperationGuide({
  step,
  tokens,
  projection,
}: {
  step: number;
  tokens: number;
  projection: Projection;
}) {
  const multiply = step === 5 || step === 7;
  return (
    <section
      className="operation-guide"
      aria-label="Dimension and symbol explanations"
    >
      {multiply && (
        <div className="dimension-example">
          <div className="section-label">ONE HEAD, ONE SEQUENCE</div>
          <div className="dimension-equation">
            <div>
              <b>{step === 5 ? 'Q · queries' : 'A · attention weights'}</b>
              <p>
                <strong>{tokens}</strong> query tokens <span>×</span>{' '}
                <strong>{step === 5 ? 4 : tokens}</strong>{' '}
                {step === 5 ? 'features' : 'key tokens'}
              </p>
            </div>
            <span className="math-operator">×</span>
            <div>
              <b>
                {step === 5 ? 'Kᵀ · keys, transposed' : 'V · value features'}
              </b>
              <p>
                <strong>{step === 5 ? 4 : tokens}</strong>{' '}
                {step === 5 ? 'features' : 'key tokens'} <span>×</span>{' '}
                <strong>{step === 5 ? tokens : 4}</strong>{' '}
                {step === 5 ? 'key tokens' : 'value features'}
              </p>
            </div>
            <span className="math-operator">→</span>
            <div>
              <b>
                {step === 5 ? 'Token-pair scores' : 'Context · mixed features'}
              </b>
              <p>
                <strong>{tokens}</strong> query tokens <span>×</span>{' '}
                <strong>{step === 5 ? tokens : 4}</strong>{' '}
                {step === 5 ? 'key tokens' : 'value features'}
              </p>
            </div>
          </div>
          <p className="contraction-note">
            {step === 5
              ? `The two 4s both mean features. Multiply matching features and sum over those 4 positions; the two ${tokens}s remain because they mean query tokens and key tokens. Divide the result by √4 = 2.`
              : `The two inner ${tokens}s both mean key tokens. Sum their weighted contributions; keep the ${tokens} query tokens and 4 value features.`}{' '}
            This happens independently in each of the 3 heads.
          </p>
        </div>
      )}
      <details className="symbol-guide" open>
        <summary>
          What the symbols mean <span>−</span>
        </summary>
        <dl>
          {(terms[step] ?? []).map(([name, meaning]) => (
            <div key={name}>
              <dt>{name}</dt>
              <dd>{meaning}</dd>
            </div>
          ))}
          {step >= 3 && step <= 4 && (
            <div>
              <dt>
                {projection.toUpperCase()} ·{' '}
                {projection === 'q'
                  ? 'queries'
                  : projection === 'k'
                    ? 'keys'
                    : 'values'}
              </dt>
              <dd>
                {projection === 'q'
                  ? 'Features used to compare this token with other tokens.'
                  : projection === 'k'
                    ? 'Features against which the queries are compared.'
                    : 'Features that attention blends together.'}{' '}
                The selected tensor is shown above.
              </dd>
            </div>
          )}
        </dl>
      </details>
    </section>
  );
}
