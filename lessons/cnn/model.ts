/** A single-channel teaching convolution (cross-correlation, as in CNN libraries).
 * Hand-chosen weights, zero bias, no padding. This is not a trained classifier.
 */
export const image = [
  [0.1, 0.1, 0.2, 0.8, 0.9, 0.9],
  [0.1, 0.2, 0.2, 0.9, 0.9, 0.8],
  [0.2, 0.1, 0.1, 0.8, 0.9, 0.9],
  [0.1, 0.1, 0.2, 0.9, 0.8, 0.9],
  [0.2, 0.2, 0.1, 0.8, 0.9, 0.8],
  [0.1, 0.2, 0.2, 0.9, 0.8, 0.9],
];
export const kernels = [
  {
    name: 'Left → right contrast',
    values: [
      [-1, 0, 1],
      [-1, 0, 1],
      [-1, 0, 1],
    ],
  },
  {
    name: 'Top → bottom contrast',
    values: [
      [-1, -1, -1],
      [0, 0, 0],
      [1, 1, 1],
    ],
  },
];
export function outputSize(size: number, stride: number) {
  return Math.floor((size - 3) / stride) + 1;
}
export function contributions(
  input: number[][],
  kernel: number[][],
  row: number,
  col: number,
  stride: number,
) {
  return kernel.flatMap((values, kr) =>
    values.map((weight, kc) => {
      const r = row * stride + kr,
        c = col * stride + kc;
      const value = input[r][c];
      return { row: r, col: c, value, weight, product: value * weight };
    }),
  );
}
export function convolve(input: number[][], kernel: number[][], stride = 1) {
  return Array.from({ length: outputSize(input.length, stride) }, (_, row) =>
    Array.from({ length: outputSize(input[0].length, stride) }, (_, col) =>
      contributions(input, kernel, row, col, stride).reduce(
        (sum, term) => sum + term.product,
        0,
      ),
    ),
  );
}
export const format = (value: number) =>
  (Math.abs(value) < 0.00001 ? 0 : value).toFixed(2);

export const examples = [
  { name: 'Bright on the right', values: image },
  {
    name: 'Bright at the bottom',
    values: image[0].map((_, c) => image.map((row) => row[c])),
  },
  {
    name: 'Dark on the right',
    values: image.map((row) => row.map((v) => 1 - v)),
  },
];
export function maxPool(input: number[][]) {
  return Array.from({ length: Math.floor(input.length / 2) }, (_, r) =>
    Array.from({ length: Math.floor(input[0].length / 2) }, (_, c) =>
      Math.max(
        input[r * 2][c * 2],
        input[r * 2][c * 2 + 1],
        input[r * 2 + 1][c * 2],
        input[r * 2 + 1][c * 2 + 1],
      ),
    ),
  );
}
export function runCnn(input: number[][], stride = 1) {
  const convolution = kernels.map((k) => convolve(input, k.values, stride));
  const activated = convolution.map((channel) =>
    channel.map((row) => row.map((v) => Math.max(0, v))),
  );
  const pooled = activated.map(maxPool);
  const flattened = pooled.flat(2);
  // Fixed illustrative parameters: channel-major, then row-major feature order.
  const perChannel = pooled[0].length ** 2;
  const weights = flattened.map((_, i) =>
    i < perChannel ? [0.3, -0.2] : [-0.2, 0.3],
  );
  const bias = [0.1, -0.1];
  const logits = bias.map(
    (b, c) => b + flattened.reduce((sum, v, i) => sum + v * weights[i][c], 0),
  );
  const max = Math.max(...logits);
  const exponentials = logits.map((v) => Math.exp(v - max));
  const denominator = exponentials.reduce((a, b) => a + b, 0);
  const probabilities = exponentials.map((v) => v / denominator);
  return {
    input,
    convolution,
    activated,
    pooled,
    flattened,
    weights,
    bias,
    logits,
    exponentials,
    denominator,
    probabilities,
  };
}
export type CnnModel = ReturnType<typeof runCnn>;
