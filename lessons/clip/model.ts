/** A small CLIP-style objective, not a pretrained CLIP checkpoint.
 * Inputs are supplied features; icons and caption strings are labels only.
 * Both 3×3 linear encoders are trained with symmetric cross-entropy and SGD.
 */
export const examples = [
  {
    name: 'Cat',
    caption: 'a photo of a cat',
    image: [0.9, 0.2, 0.1],
    text: [0.8, 0.3, 0.1],
  },
  {
    name: 'Bicycle',
    caption: 'a photo of a bicycle',
    image: [0.1, 0.9, 0.2],
    text: [0.2, 0.8, 0.3],
  },
  {
    name: 'Tree',
    caption: 'a photo of a tree',
    image: [0.2, 0.1, 0.9],
    text: [0.1, 0.2, 0.8],
  },
];
export type Matrix = number[][];
export type Weights = { image: Matrix; text: Matrix };
export const scale = 5;
export const learningRate = 0.1;
export const initialWeights: Weights = {
  image: [
    [1, 0.1, 0],
    [0, 1, 0.1],
    [0.1, 0, 1],
  ],
  text: [
    [0.3, 0.8, 0.1],
    [0.1, 0.3, 0.8],
    [0.8, 0.1, 0.3],
  ],
};
export const dot = (a: number[], b: number[]) =>
  a.reduce((s, x, k) => s + x * b[k], 0);
export function normalize(v: number[]) {
  const n = Math.hypot(...v);
  return v.map((x) => x / n);
}
export function encode(input: number[], weights: Matrix) {
  return weights.map((row) => dot(row, input));
}
export function softmax(scores: number[]) {
  const max = Math.max(...scores),
    exp = scores.map((x) => Math.exp(x - max));
  const sum = exp.reduce((a, b) => a + b, 0);
  return exp.map((x) => x / sum);
}
export function forward(weights: Weights) {
  const rawImage = examples.map((x) => encode(x.image, weights.image));
  const rawText = examples.map((x) => encode(x.text, weights.text));
  const images = rawImage.map(normalize),
    texts = rawText.map(normalize);
  const scores = images.map((a) => texts.map((b) => dot(a, b)));
  const logits = scores.map((row) => row.map((x) => x * scale));
  const rows = logits.map(softmax);
  const cols = examples.map((_, j) => softmax(logits.map((row) => row[j])));
  const rowLoss = rows.map((row, i) => -Math.log(row[i]));
  const colLoss = cols.map((col, j) => -Math.log(col[j]));
  const loss = [...rowLoss, ...colLoss].reduce((a, b) => a + b, 0) / 6;
  return {
    rawImage,
    rawText,
    images,
    texts,
    scores,
    logits,
    rows,
    cols,
    rowLoss,
    colLoss,
    loss,
  };
}
export function gradients(weights: Weights) {
  const f = forward(weights),
    n = examples.length;
  // Derivative with respect to the scaled logits, averaged over both directions.
  const logits = f.rows.map((row, i) =>
    row.map((p, j) => (p + f.cols[j][i] - 2 * Number(i === j)) / (2 * n)),
  );
  const image: Matrix = Array.from({ length: 3 }, () => [0, 0, 0]);
  const text: Matrix = Array.from({ length: 3 }, () => [0, 0, 0]);
  for (let i = 0; i < n; i++) {
    const gi = [0, 0, 0],
      gt = [0, 0, 0];
    for (let j = 0; j < n; j++)
      for (let k = 0; k < 3; k++) {
        gi[k] += scale * logits[i][j] * f.texts[j][k];
        gt[k] += scale * logits[j][i] * f.images[j][k];
      }
    const pi = dot(gi, f.images[i]),
      pt = dot(gt, f.texts[i]);
    for (let k = 0; k < 3; k++)
      for (let d = 0; d < 3; d++) {
        image[k][d] +=
          ((gi[k] - f.images[i][k] * pi) / Math.hypot(...f.rawImage[i])) *
          examples[i].image[d];
        text[k][d] +=
          ((gt[k] - f.texts[i][k] * pt) / Math.hypot(...f.rawText[i])) *
          examples[i].text[d];
      }
  }
  return { image, text, logits };
}
export function update(weights: Weights): Weights {
  const g = gradients(weights);
  return {
    image: weights.image.map((row, k) =>
      row.map((w, d) => w - learningRate * g.image[k][d]),
    ),
    text: weights.text.map((row, k) =>
      row.map((w, d) => w - learningRate * g.text[k][d]),
    ),
  };
}
export const training: Weights[] = [initialWeights];
for (let i = 0; i < 40; i++) training.push(update(training[i]));
export const newImage = [0.75, 0.28, 0.14];
export function infer(candidates: number[]) {
  const weights = training[40];
  const image = normalize(encode(newImage, weights.image));
  const scores = candidates.map((i) =>
    dot(image, normalize(encode(examples[i].text, weights.text))),
  );
  return {
    image,
    scores,
    probabilities: softmax(scores.map((x) => scale * x)),
  };
}
