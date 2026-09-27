/* eslint-disable typescript/no-require-imports -- Matches the repository numerical fixture runner. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const path = require('node:path');
const filename = path.join(__dirname, '../lessons/clip/model.ts');
const loaded = new Module(filename);
loaded._compile(
  ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
  filename,
);
const m = loaded.exports;
const close = (a, b, tol = 1e-7) =>
  assert.ok(Math.abs(a - b) < tol, `${a} != ${b}`);
// Independent central differences catch the transpose, symmetric averaging,
// normalization derivative and encoder chain-rule errors in all 18 weights.
for (const weights of [m.training[0], m.training[8]]) {
  const grad = m.gradients(weights);
  for (const side of ['image', 'text'])
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 3; c++) {
        const plus = structuredClone(weights),
          minus = structuredClone(weights),
          h = 1e-5;
        plus[side][r][c] += h;
        minus[side][r][c] -= h;
        close(
          grad[side][r][c],
          (m.forward(plus).loss - m.forward(minus).loss) / (2 * h),
        );
      }
}
for (let i = 0; i < m.training.length; i++) {
  const f = m.forward(m.training[i]);
  for (const p of [...f.rows, ...f.cols])
    close(
      p.reduce((a, b) => a + b),
      1,
    );
  for (const v of [...f.images, ...f.texts]) close(Math.hypot(...v), 1);
  for (const row of f.scores) for (const s of row) assert.ok(s >= -1 && s <= 1);
  if (i) assert.ok(f.loss < m.forward(m.training[i - 1]).loss);
}
const zero = {
  image: Array.from({ length: 3 }, () => [1, 1, 1]),
  text: Array.from({ length: 3 }, () => [1, 1, 1]),
};
close(m.forward(zero).loss, Math.log(3)); // equal scores → uniform probabilities
for (const candidates of [[0, 1, 2], [2, 0, 1], [0, 2], [0]]) {
  const inference = m.infer(candidates);
  close(
    inference.probabilities.reduce((a, b) => a + b),
    1,
  );
  assert.equal(
    candidates[
      inference.probabilities.indexOf(Math.max(...inference.probabilities))
    ],
    0,
  );
}
console.log(
  `CLIP checks passed: gradients, normalization, loss, 40 SGD updates, candidate subsets. Loss ${m.forward(m.training[0]).loss.toFixed(4)} → ${m.forward(m.training[40]).loss.toFixed(4)}`,
);
