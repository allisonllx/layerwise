const assert = require('node:assert/strict');
const d = require('../lessons/diffusion/recording.json');
let checks = 0;
function near(a, b, eps = 1e-4) {
  assert.ok(Number.isFinite(a) && Math.abs(a - b) < eps, `${a} != ${b}`);
  checks++;
}
assert.equal(d.alphaBar[0], 1);
for (let t = 1; t <= 100; t++)
  assert.ok(
    d.alphaBar[t] < d.alphaBar[t - 1] && d.beta[t] > 0 && d.beta[t] < 1,
  );
for (const s of d.samples) {
  assert.equal(s.frames.length, 101);
  for (let t = 100; t >= 1; t--) {
    const k = 100 - t,
      a = d.alphaBar[t],
      prev = d.alphaBar[t - 1],
      b = d.beta[t];
    for (let p = 0; p < 64; p++) {
      const x = s.frames[k][p],
        eps = s.predictions[k][p];
      const clean = Math.max(
        -1,
        Math.min(1, (x - Math.sqrt(1 - a) * eps) / Math.sqrt(a)),
      );
      const mean =
        ((Math.sqrt(prev) * b) / (1 - a)) * clean +
        ((Math.sqrt(1 - b) * (1 - prev)) / (1 - a)) * x;
      near(mean, s.means[k][p]);
      near(
        mean + Math.sqrt((b * (1 - prev)) / (1 - a)) * s.innovations[k][p],
        s.frames[k + 1][p],
      );
      if (t === 1) near(s.innovations[k][p], 0);
    }
  }
}
for (const e of d.examples)
  for (const trace of Object.values(e.traces)) {
    const [enc, down, mid, up, join, dec] = trace;
    assert.deepEqual(
      trace.map((x) => x.length),
      [16, 16, 32, 32, 48, 16],
    );
    assert.deepEqual(
      trace.map((x) => x[0].length),
      [64, 16, 16, 64, 64, 64],
    );
    for (let c = 0; c < 16; c++)
      for (let r = 0; r < 4; r++)
        for (let k = 0; k < 4; k++) {
          const i = r * 16 + k * 2;
          near(
            down[c][r * 4 + k],
            (enc[c][i] + enc[c][i + 1] + enc[c][i + 8] + enc[c][i + 9]) / 4,
            1e-6,
          );
        }
    for (let c = 0; c < 32; c++)
      for (let i = 0; i < 64; i++)
        near(
          up[c][i],
          mid[c][Math.floor(i / 16) * 4 + Math.floor((i % 8) / 2)],
          1e-7,
        );
    assert.deepEqual(join, [...up, ...enc]);
  }
assert.ok(d.history.at(-1).loss < d.history[0].loss);
console.log(
  `Diffusion: ${checks} numerical checks passed (all reverse steps, average pooling, upsampling and skip concatenation).`,
);
