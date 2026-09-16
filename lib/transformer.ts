/** Tiny deterministic pre-norm decoder. Illustrative weights, no training. */
export type Matrix = number[][];
export const D = 12,
  H = 3,
  F = 4;
export const examples = [
  ['The', 'little', 'cat', 'sat', 'on', 'the'],
  ['A', 'bird', 'flies', 'home'],
  ['We', 'learn', 'by', 'seeing', 'how', 'the', 'values', 'move'],
];
export const vocabulary = [
  'the',
  'cat',
  'mat',
  'moon',
  'home',
  'bird',
  'a',
  'sat',
  'on',
  'learn',
  'moves',
  '.',
];
const sum = (a: number[]) => a.reduce((s, x) => s + x, 0);
const weight = (i: number, j: number, seed: number) =>
  Math.sin((i + 1) * 1.31 + (j + 1) * 2.17 + seed) * 0.24;
export const matrix = (
  r: number,
  c: number,
  fn: (i: number, j: number) => number,
): Matrix =>
  Array.from({ length: r }, (_, i) =>
    Array.from({ length: c }, (_, j) => fn(i, j)),
  );
export const matmul = (a: Matrix, b: Matrix): Matrix =>
  matrix(a.length, b[0].length, (i, j) => sum(a[i].map((v, k) => v * b[k][j])));
export const transpose = (a: Matrix) =>
  matrix(a[0].length, a.length, (i, j) => a[j][i]);
export const add = (a: Matrix, b: Matrix) =>
  matrix(a.length, a[0].length, (i, j) => a[i][j] + b[i][j]);
export function norm(a: Matrix) {
  return a.map((row) => {
    const mean = sum(row) / row.length,
      variance = sum(row.map((x) => (x - mean) ** 2)) / row.length;
    return row.map((x) => (x - mean) / Math.sqrt(variance + 1e-5));
  });
}
export function softmax(row: number[]) {
  const max = Math.max(...row),
    exp = row.map((x) => Math.exp(x - max)),
    total = sum(exp);
  return exp.map((x) => x / total);
}
export const gelu = (x: number) =>
  0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x ** 3)));
export function runModel(words: string[]) {
  const T = words.length;
  const embedding = matrix(T, D, (i, j) => {
    const id = sum([...words[i].toLowerCase()].map((c) => c.charCodeAt(0)));
    return Math.sin(id * 0.17 + j * 0.71) * 0.7;
  });
  const position = matrix(T, D, (i, j) =>
    j % 2 === 0
      ? Math.sin(i / 10000 ** (j / D))
      : Math.cos(i / 10000 ** ((j - 1) / D)),
  );
  const x = add(embedding, position),
    n1 = norm(x);
  const weights = {
    q: matrix(D, D, (i, j) => weight(i, j, 1)),
    k: matrix(D, D, (i, j) => weight(i, j, 2)),
    v: matrix(D, D, (i, j) => weight(i, j, 3)),
    o: matrix(D, D, (i, j) => weight(i, j, 4)),
    up: matrix(D, 48, (i, j) => weight(i, j, 5)),
    down: matrix(48, D, (i, j) => weight(i, j, 6)),
    out: matrix(D, vocabulary.length, (i, j) => weight(i, j, 7)),
  };
  const q = matmul(n1, weights.q),
    k = matmul(n1, weights.k),
    v = matmul(n1, weights.v);
  const split = (a: Matrix) =>
    Array.from({ length: H }, (_, h) =>
      a.map((row) => row.slice(h * F, (h + 1) * F)),
    );
  const qh = split(q),
    kh = split(k),
    vh = split(v);
  const scores = qh.map((head, h) =>
    matmul(head, transpose(kh[h])).map((row) =>
      row.map((x) => x / Math.sqrt(F)),
    ),
  );
  const attention = scores.map((m) =>
    m.map((row, i) => softmax(row.map((x, j) => (j > i ? -Infinity : x)))),
  );
  const context = attention.map((m, h) => matmul(m, vh[h]));
  const joined = matrix(T, D, (i, j) => context[Math.floor(j / F)][i][j % F]);
  const projected = matmul(joined, weights.o),
    residual = add(x, projected),
    n2 = norm(residual);
  const up = matmul(n2, weights.up),
    activated = up.map((row) => row.map(gelu)),
    down = matmul(activated, weights.down);
  const blockOutput = add(residual, down),
    finalNorm = norm(blockOutput),
    logits = matmul(finalNorm, weights.out),
    probabilities = logits.map(softmax);
  return {
    T,
    embedding,
    position,
    x,
    n1,
    weights,
    q,
    k,
    v,
    qh,
    kh,
    vh,
    scores,
    attention,
    context,
    joined,
    projected,
    residual,
    n2,
    up,
    activated,
    down,
    blockOutput,
    finalNorm,
    logits,
    probabilities,
  };
}
export type Model = ReturnType<typeof runModel>;
export type Step = {
  title: string;
  short: string;
  section: string;
  intro: string;
  intuition: string;
  detail: string;
  input: string;
  output: string;
  axes: string;
  code: string;
  equation: string;
  caption: string;
  matrixName: string;
};
export function getSteps(t: number): Step[] {
  const base = `[1, ${t}, 12]`,
    heads = `[1, 3, ${t}, 4]`;
  return [
    {
      title: 'Give words a representation',
      short: 'Token + position embedding',
      section: 'Embedding',
      intro:
        'Each word becomes a row of twelve numbers. Add its position so the model can distinguish the order of the words.',
      intuition: 'A word, plus where it is.',
      detail:
        'This lesson uses one word per token and sinusoidal positions. Real language models typically use subword tokens; their positional methods vary. Select a word to follow its row.',
      input: `[1, ${t}]`,
      output: base,
      axes: 'batch · tokens · features',
      code: 'x = token_embedding(ids) + position_embedding\n# x: [batch, tokens, features]',
      equation: 'word + position',
      caption: 'one vector for each token',
      matrixName: 'Embedding + position',
    },
    {
      title: 'Bring features onto one scale',
      short: 'Layer normalisation',
      section: 'Transformer block',
      intro:
        'Normalise the twelve features within each token. The tensor keeps its shape, while its values change.',
      intuition: 'Each token is normalised separately.',
      detail:
        'Subtract the row mean, then divide by its standard deviation (with a small epsilon). This toy model uses scale γ = 1 and bias β = 0. Batch and token axes are not mixed.',
      input: base,
      output: base,
      axes: 'batch · tokens · features',
      code: 'n = layer_norm(x, normalized_shape=12)\n# normalise across features, not tokens',
      equation: '(x − μ) / √(σ² + ε)',
      caption: 'same shape · new values',
      matrixName: 'Normalised features',
    },
    {
      title: 'Ask, match, and carry',
      short: 'Create Q, K & V',
      section: 'Multi-head attention',
      intro:
        'Three learned projections turn the same input into queries, keys and values. Each has twelve features per token.',
      intuition: 'Three different roles for the same input.',
      detail:
        'Queries and keys calculate attention scores. Values contain the information that gets mixed. These are three separate matrix multiplications, not copies of the same tensor.',
      input: base,
      output: '3 tensors · ' + base,
      axes: 'batch · tokens · features',
      code: 'q = n @ W_q  # [12, 12] weights\nk = n @ W_k\nv = n @ W_v',
      equation: 'Q = XWq',
      caption: 'choose Q, K or V above',
      matrixName: 'Projected features',
    },
    {
      title: 'Split into heads',
      short: 'Split into heads',
      section: 'Multi-head attention',
      intro:
        'Twelve features become three groups of four. The values stay the same; only their organisation changes.',
      intuition: 'Give each head its own slice.',
      detail:
        'Each head gets four features for every token. Splitting does not calculate new values. Q, K and V all undergo the same reshape; the diagram follows the tensor you select.',
      input: base,
      output: `[1, ${t}, 3, 4]`,
      axes: 'batch · tokens · heads · features per head',
      code: `q = q.reshape(1, ${t}, 3, 4)\n# 12 features = 3 heads × 4 features\n# do the same for k and v`,
      equation: '12 = 3 × 4',
      caption: 'same values · new grouping',
      matrixName: 'Split features',
    },
    {
      title: 'Let each head work separately',
      short: 'Permute axes',
      section: 'Multi-head attention',
      intro:
        'Move the head axis before the token axis. Each head now holds a small matrix of tokens × features.',
      intuition: 'Change the axes, keep the values.',
      detail:
        'The coordinates change from [batch, token, head, feature] to [batch, head, token, feature]. Permute rearranges how values are indexed; in PyTorch this can be a view without copying memory.',
      input: `[1, ${t}, 3, 4]`,
      output: heads,
      axes: 'batch · heads · tokens · features per head',
      code: 'q = q.permute(0, 2, 1, 3)\nk = k.permute(0, 2, 1, 3)\nv = v.permute(0, 2, 1, 3)',
      equation: '[B, T, H, F] → [B, H, T, F]',
      caption: 'follow the highlighted row',
      matrixName: 'Head-major features',
    },
    {
      title: 'Compare every query with every key',
      short: 'Attention scores',
      section: 'Multi-head attention',
      intro:
        'Within each head, compare each query with every key using a dot product. Divide by √4 to scale the scores.',
      intuition: 'The feature axis becomes a token axis.',
      detail:
        'A tokens × 4 query matrix multiplies a 4 × tokens key matrix. The four features are summed away, leaving a tokens × tokens score matrix. Click a cell to inspect one dot product.',
      input: `Q ${heads} × Kᵀ [1, 3, 4, ${t}]`,
      output: `[1, 3, ${t}, ${t}]`,
      axes: 'batch · heads · query tokens · key tokens',
      code: 'scores = q @ k.transpose(-2, -1)\nscores = scores / math.sqrt(4)',
      equation: 'queries · transposed keys',
      caption: '→ query-token × key-token scores',
      matrixName: 'Scaled attention scores',
    },
    {
      title: 'Look back, then choose a mixture',
      short: 'Causal mask + softmax',
      section: 'Multi-head attention',
      intro:
        'Hide future tokens, then turn each row of scores into non-negative weights that sum to one.',
      intuition: 'A token can only see its past and itself.',
      detail:
        'Set future positions to −∞ before softmax, so they receive exactly zero weight. Attention dropout would follow softmax during training; it is disabled in this inference lesson.',
      input: `[1, 3, ${t}, ${t}]`,
      output: `[1, 3, ${t}, ${t}]`,
      axes: 'batch · heads · query tokens · key tokens',
      code: 'scores = scores.masked_fill(future_mask, -float("inf"))\nattention = softmax(scores, dim=-1)\nattention = dropout(attention)  # off in eval()',
      equation: 'Σ row = 1',
      caption: 'future tokens receive zero',
      matrixName: 'Attention weights',
    },
    {
      title: 'Gather information from the values',
      short: 'Weighted value mixture',
      section: 'Multi-head attention',
      intro:
        'Use each row of attention weights to blend the value vectors. Each token receives four new features per head.',
      intuition: 'Attention tells us how much to take.',
      detail:
        'Multiply a tokens × tokens attention matrix by a tokens × 4 value matrix. The key-token dimension is summed away. The result has the original four features per head.',
      input: `[1, 3, ${t}, ${t}] × ${heads}`,
      output: heads,
      axes: 'batch · heads · tokens · features per head',
      code: 'context = attention @ v\n# [B, H, T, T] @ [B, H, T, F]\n# → [B, H, T, F]',
      equation: 'context = attention weights · value features',
      caption: 'a weighted mixture for each token',
      matrixName: 'Context features',
    },
    {
      title: 'Bring the heads back together',
      short: 'Concatenate + project',
      section: 'Multi-head attention',
      intro:
        'Return to token-first order, join the three heads, then apply an output projection that mixes their features.',
      intuition: 'Separate perspectives, one representation.',
      detail:
        'The transpose and reshape only reorganise existing values. The final multiplication by Wₒ computes new values. Output dropout follows this projection during training and is off here.',
      input: heads,
      output: base,
      axes: 'batch · tokens · features',
      code: `joined = context.transpose(1, 2).contiguous()\njoined = joined.reshape(1, ${t}, 12)\nprojected = dropout(joined @ W_o)  # off`,
      equation: 'concat(heads) · Wo',
      caption: '12 features per token again',
      matrixName: 'Attention output',
    },
    {
      title: 'Keep a path for the original input',
      short: 'Residual addition',
      section: 'Transformer block',
      intro:
        'Add the attention output to the original block input, element by element. Both tensors must have the same shape.',
      intuition: 'Refine the representation without replacing it.',
      detail:
        'This shortcut carries the earlier representation forward and provides a direct gradient path during training. This is addition, not concatenation: twelve features remain twelve.',
      input: base + ' + ' + base,
      output: base,
      axes: 'batch · tokens · features',
      code: 'residual = x + projected\n# element-wise addition; shapes must match',
      equation: 'x + attention(x)',
      caption: 'same shape · combined information',
      matrixName: 'First residual output',
    },
    {
      title: 'Expand, activate, then compress',
      short: 'Norm + feed-forward MLP',
      section: 'Feed-forward network',
      intro:
        'Normalise each token, expand twelve features to forty-eight, apply GELU, then project back to twelve.',
      intuition: 'Process each token independently.',
      detail:
        'The same two weight matrices are applied to every token. GELU introduces a nonlinear transformation. Select a stage to inspect its dimensions. Dropout follows the down-projection and is off here.',
      input: base,
      output: `[1, ${t}, 48] → ${base}`,
      axes: 'batch · tokens · features',
      code: 'n = layer_norm(residual, 12)\nexpanded = n @ W_up  # [12, 48]\nactivated = gelu(expanded)\nmlp = dropout(activated @ W_down)  # [48, 12]',
      equation: '12 → 48 → 12',
      caption: 'GELU between the two projections',
      matrixName: 'Feed-forward features',
    },
    {
      title: 'Turn features into next-token scores',
      short: 'Residual + final norm + output',
      section: 'Output',
      intro:
        'Add the MLP residual, normalise, and project into the vocabulary. Softmax converts the scores to probabilities.',
      intuition: 'A probability for each possible next token.',
      detail:
        'The chart uses the selected position to predict its next token. The final position is used to continue the sentence. This untrained toy model demonstrates the calculation, not meaningful language prediction.',
      input: base,
      output: `[1, ${t}, ${vocabulary.length}]`,
      axes: 'batch · tokens · vocabulary',
      code: 'x = residual + mlp\nlogits = layer_norm(x, 12) @ W_vocab\nprobabilities = softmax(logits, dim=-1)\nnext_token_probs = probabilities[:, -1, :]',
      equation: 'softmax(logits)',
      caption: 'illustrative, untrained probabilities',
      matrixName: 'Next-token probabilities',
    },
  ];
}
