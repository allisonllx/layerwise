import { type Model, vocabulary } from './transformer';

export type Operation = {
  kind:
    | 'add'
    | 'norm'
    | 'project'
    | 'mask'
    | 'exp'
    | 'divide'
    | 'gelu'
    | 'join';
  title: string;
  caption: string;
  inputName: string;
  outputName: string;
  input: number[];
  output: number[];
  other?: number[];
  otherName?: string;
  weights?: number[][];
  labels?: string[];
  mean?: number;
  divisor?: number;
};
export type ProjectionChoice = 'q' | 'k' | 'v';
export type MlpChoice = 'n2' | 'up' | 'activated' | 'down';
export function lessonOperations(
  model: Model,
  step: number,
  token: number,
  head: number,
  projection: ProjectionChoice,
  mlp: MlpChoice,
  words: string[],
): Operation[] {
  const row = (
    key:
      | 'embedding'
      | 'position'
      | 'x'
      | 'n1'
      | 'joined'
      | 'projected'
      | 'residual'
      | 'n2'
      | 'up'
      | 'activated'
      | 'down'
      | 'blockOutput'
      | 'finalNorm'
      | 'logits'
      | 'probabilities',
  ) => model[key][token];
  const add = (
    input: number[],
    other: number[],
    output: number[],
    inputName: string,
    otherName: string,
    outputName: string,
  ): Operation => ({
    kind: 'add',
    title: 'Add matching features',
    caption:
      'Pair the same feature in both rows. Add the pair; the number of features stays the same.',
    input,
    other,
    output,
    inputName,
    otherName,
    outputName,
  });
  const norm = (
    input: number[],
    output: number[],
    inputName: string,
    outputName: string,
  ): Operation => {
    const mean = input.reduce((s, v) => s + v, 0) / input.length;
    const divisor = Math.sqrt(
      input.reduce((s, v) => s + (v - mean) ** 2, 0) / input.length + 1e-5,
    );
    return {
      kind: 'norm',
      title: 'Normalise within this token',
      caption:
        'Use the mean and variance of this token’s features. Subtract the mean, then divide by √(variance + ε). Here ε = 0.00001, scale = 1 and bias = 0.',
      input,
      output,
      inputName,
      outputName,
      mean,
      divisor,
    };
  };
  const project = (
    input: number[],
    output: number[],
    weights: number[][],
    inputName: string,
    outputName: string,
  ): Operation => ({
    kind: 'project',
    title: `Project ${input.length} → ${output.length} features`,
    caption:
      'Each output feature uses every input feature: multiply by one column of weights, then sum. The moving outline follows the output being calculated.',
    input,
    output,
    weights,
    inputName,
    outputName,
  });
  const softmax = (
    input: number[],
    output: number[],
    labels: string[],
  ): Operation[] => {
    const max = Math.max(...input),
      exp = input.map((v) => Math.exp(v - max)),
      divisor = exp.reduce((s, v) => s + v, 0);
    return [
      {
        kind: 'exp',
        title: 'Convert scores for softmax',
        caption:
          'Softmax first converts scores into non-negative values. Subtracting the largest score prevents very large intermediate numbers without changing the final probabilities.',
        input,
        output: exp,
        inputName: 'Scores',
        outputName: 'Exponential contributions',
        mean: max,
        labels,
      },
      {
        kind: 'divide',
        title: 'Make the weights add up to 1',
        caption:
          'Each output tells you what fraction of the total belongs to that token. Divide each input value by the sum of the whole row.',
        input: exp,
        output,
        inputName: 'Exponential contributions',
        outputName: 'Probabilities',
        divisor,
        labels,
      },
    ];
  };
  if (step === 0)
    return [
      add(
        row('embedding'),
        row('position'),
        row('x'),
        'Word embedding',
        'Position embedding',
        'Word + position',
      ),
    ];
  if (step === 1)
    return [norm(row('x'), row('n1'), 'Block input', 'Normalised features')];
  if (step === 2)
    return [
      project(
        row('n1'),
        model[projection][token],
        model.weights[projection],
        'Normalised features',
        `${projection.toUpperCase()} features`,
      ),
    ];
  if (step === 6) {
    const scores = model.scores[head][token],
      masked = scores.map((v, k) => (k > token ? -Infinity : v));
    return [
      {
        kind: 'mask',
        title: 'Hide future tokens',
        caption:
          token < words.length - 1
            ? `Each column represents a key token that “${words[token]}” could attend to. Hide the later tokens ${words
                .slice(token + 1)
                .map((word, i) => `“${word}” (position ${token + 1 + i})`)
                .join(
                  ', ',
                )}. Keep this query’s own position and everything before it.`
            : `Each column represents a key token that “${words[token]}” could attend to. This query is the last token, so there are no later tokens to hide.`,
        input: scores,
        output: masked,
        inputName: 'Scaled scores',
        outputName: 'Masked scores',
        labels: words,
      },
      ...softmax(masked, model.attention[head][token], words),
    ];
  }
  if (step === 8)
    return [
      {
        kind: 'join',
        title: 'Rejoin the three heads',
        caption:
          'Follow this token’s four features from each head. Move the three groups together into one row of twelve; every value stays unchanged.',
        input: row('joined'),
        output: row('joined'),
        inputName: 'Three heads · four features each',
        outputName: 'Joined features',
      },
      project(
        row('joined'),
        row('projected'),
        model.weights.o,
        'Joined features',
        'Attention output',
      ),
    ];
  if (step === 9)
    return [
      add(
        row('x'),
        row('projected'),
        row('residual'),
        'Original block input',
        'Attention output',
        'First residual output',
      ),
    ];
  if (step === 10) {
    const sequence: Operation[] = [
      norm(
        row('residual'),
        row('n2'),
        'First residual output',
        'Normalised features',
      ),
      project(
        row('n2'),
        row('up'),
        model.weights.up,
        'Normalised features',
        'Expanded features',
      ),
      {
        kind: 'gelu',
        title: 'Apply GELU to each feature',
        caption:
          'GELU smoothly changes each feature independently. Negative values are attenuated; the tensor keeps all 48 features.',
        input: row('up'),
        output: row('activated'),
        inputName: 'Expanded features',
        outputName: 'After GELU',
      },
      project(
        row('activated'),
        row('down'),
        model.weights.down,
        'After GELU',
        'MLP output',
      ),
    ];
    return sequence.slice(
      0,
      ['n2', 'up', 'activated', 'down'].indexOf(mlp) + 1,
    );
  }
  if (step === 11)
    return [
      add(
        row('residual'),
        row('down'),
        row('blockOutput'),
        'First residual output',
        'MLP output',
        'Block output',
      ),
      norm(
        row('blockOutput'),
        row('finalNorm'),
        'Block output',
        'Final normalised features',
      ),
      {
        ...project(
          row('finalNorm'),
          row('logits'),
          model.weights.out,
          'Normalised features',
          'Vocabulary scores',
        ),
        labels: vocabulary,
      },
      ...softmax(row('logits'), row('probabilities'), vocabulary),
    ];
  return [];
}

export function operationCalculation(op: Operation, feature: number): string {
  const f = Math.max(0, Math.min(op.output.length - 1, feature));
  const fmt = (v: number) => (Number.isFinite(v) ? v.toFixed(4) : '−∞');
  const x = op.input[f],
    result = fmt(op.output[f]);
  switch (op.kind) {
    case 'add':
      return `${fmt(x)} + ${fmt(op.other![f])} = ${result}`;
    case 'norm':
      return `(${fmt(x)} − ${fmt(op.mean!)}) ÷ ${fmt(op.divisor!)} = ${result}`;
    case 'project':
      return (
        op.input
          .map((v, i) => `(${fmt(v)} × ${fmt(op.weights![i][f])})`)
          .join(' + ') + ` = ${result}`
      );
    case 'mask':
      return Number.isFinite(op.output[f])
        ? `${fmt(x)} → ${result} (visible token)`
        : `${fmt(x)} → −∞ (future token)`;
    case 'exp':
      return `exp(${fmt(x)} − ${fmt(op.mean!)}) = ${result}`;
    case 'divide':
      return `${fmt(x)} ÷ ${fmt(op.divisor!)} = ${result}`;
    case 'gelu':
      return `GELU(${fmt(x)}) = ${result}`;
    case 'join':
      return `Head ${Math.floor(f / 4) + 1}, feature ${f % 4} → joined feature ${f}: ${result} (unchanged)`;
  }
}
