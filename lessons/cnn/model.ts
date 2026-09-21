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
