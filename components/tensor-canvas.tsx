'use client';
import { type Model, type Matrix, vocabulary } from '../lib/transformer';
import { heatmapCell, heatmapScale } from '../lib/heatmap';
export type Selection = { row: number; col: number; head: number };
export type Projection = 'q' | 'k' | 'v';
export type MlpStage = 'n2' | 'up' | 'activated' | 'down';
const colors = ['#70d2c4', '#e5ba7c', '#b8a4e7'];
export function getDisplay(
  model: Model,
  step: number,
  projection: Projection,
  mlp: MlpStage,
): Matrix[] {
  if (step === 0) return [model.x];
  if (step === 1) return [model.n1];
  if (step <= 4)
    return step === 4 ? model[`${projection}h`] : [model[projection]];
  if (step === 5) return model.scores;
  if (step === 6) return model.attention;
  if (step === 7) return model.context;
  return [
    step === 8
      ? model.projected
      : step === 9
        ? model.residual
        : step === 10
          ? model[mlp]
          : model.probabilities,
  ];
}
export default function TensorCanvas({
  model,
  words,
  step,
  token,
  focusToken,
  numbers,
  projection,
  mlp,
  phase,
  selection,
  onSelect,
  equation,
  caption,
}: {
  model: Model;
  words: string[];
  step: number;
  token: number;
  focusToken: boolean;
  numbers: boolean;
  projection: Projection;
  mlp: MlpStage;
  phase: number;
  selection: Selection | null;
  onSelect: (s: Selection) => void;
  equation: string;
  caption: string;
}) {
  const panels = getDisplay(model, step, projection, mlp),
    T = words.length;
  const isHeads = step >= 4 && step <= 7,
    score = step === 5 || step === 6;
  const probabilities = step === 6 || step === 11;
  const scale = heatmapScale(panels, probabilities);
  const rowHeight = 28,
    top = 82,
    cols = panels[0][0].length;
  const cellW = isHeads
    ? score
      ? Math.min(24, 164 / T)
      : 29
    : cols === 48
      ? 10
      : 25;
  const startY = top + (8 - T) * 10;
  function position(row: number, col: number, h: number) {
    if (isHeads) {
      const toX = 99 + h * 245 + col * cellW,
        toY = startY + row * rowHeight;
      if (step === 4) {
        const fromX = 94 + (h * 4 + col) * 25 + h * 24;
        return [fromX + (toX - fromX) * phase, toY];
      }
      return [toX, toY];
    }
    const gap = step === 3 ? Math.floor(col / 4) * 24 * phase : 0;
    return [94 + col * cellW + gap, startY + row * rowHeight];
  }
  if (step === 11 && focusToken) {
    const sorted = model.probabilities[token]
        .map((p, i) => ({ p, word: vocabulary[i], index: i }))
        .sort((a, b) => b.p - a.p)
        .slice(0, 6),
      max = sorted[0].p;
    return (
      <svg
        viewBox="0 0 850 365"
        role="img"
        aria-label={`Untrained next-token probabilities after ${words[token]}`}
      >
        <text x="70" y="35" className="diagram-label">
          After “{words[token]}” · top 6 of {vocabulary.length} toy vocabulary
          entries
        </text>
        {sorted.map((v, i) => (
          <g key={v.word}>
            <text
              x="128"
              y={84 + i * 43}
              textAnchor="end"
              className="selected-label"
            >
              {v.word}
            </text>
            <rect
              x="150"
              y={66 + i * 43}
              height="24"
              width={Math.max(2, (v.p / max) * 430 * phase)}
              rx="4"
              fill={i === 0 ? '#70d2c4' : '#344b52'}
              style={{ transition: 'width .8s ease' }}
            />
            <text
              x={165 + (v.p / max) * 430}
              y={83 + i * 43}
              className="diagram-label"
            >
              {(v.p * 100).toFixed(1)}%
            </text>
          </g>
        ))}
        <text x="150" y="350" className="diagram-label">
          Untrained weights: these predictions have no learned meaning.
        </text>
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 850 365"
      role="img"
      aria-label={`${score ? 'Attention matrices' : isHeads ? 'Three heads' : step === 3 ? 'Features split into three heads' : 'Feature matrix'}; ${T} tokens. Select a cell to inspect its calculation.`}
    >
      {isHeads ? (
        panels.map((_, h) => (
          <g key={h}>
            <text
              x={99 + h * 245}
              y="35"
              fill={colors[h]}
              className="head-label"
            >
              HEAD {h + 1}
            </text>
            <text
              x={99 + h * 245}
              y="53"
              className="diagram-label"
              style={{ fontSize: 11 }}
            >
              {score ? 'Rows (↓) query tokens' : 'Rows (↓) tokens'}
            </text>
            <text
              x={99 + h * 245}
              y="69"
              className="diagram-label"
              style={{ fontSize: 11 }}
            >
              {score ? 'Columns (→) key tokens' : 'Columns (→) features'}
            </text>
          </g>
        ))
      ) : (
        <>
          <text x="94" y="35" className="diagram-label">
            Rows (↓) {T} tokens
          </text>
          <text x="240" y="35" className="diagram-label">
            Columns (→) {cols} {step === 11 ? 'vocabulary entries' : 'features'}
          </text>
        </>
      )}
      {panels.map((panel, h) =>
        panel.map((row, r) => (
          <g key={`${h}-${r}`}>
            <text
              x={isHeads ? 91 + h * 245 : 80}
              y={startY + r * rowHeight + 17}
              textAnchor="end"
              className={r === token ? 'selected-label' : 'row-label'}
              style={{ fontSize: isHeads ? 11 : 13 }}
            >
              {words[r]}
            </text>
            {row.map((value, c) => {
              const [x, y] = position(r, c, h);
              const chosen =
                selection?.row === r &&
                selection.col === c &&
                selection.head === h;
              const masked = step === 6 && c > r;
              const hue = isHeads
                ? colors[h]
                : step === 3
                  ? colors[Math.min(2, Math.floor(c / (cols / 3)))]
                  : colors[0];
              const cell = heatmapCell(
                value,
                scale,
                probabilities,
                focusToken && r !== token,
              );
              return (
                <g
                  key={c}
                  role="button"
                  tabIndex={-1}
                  aria-label={`Token ${r} (${words[r]}), ${score ? `key token ${c} (${words[c]})` : step === 11 ? `vocabulary ${vocabulary[c]}` : `feature ${c}`}, head ${h + 1}: ${value.toFixed(4)}`}
                  onClick={() => onSelect({ row: r, col: c, head: h })}
                  style={{
                    transform: `translate(${x}px,${y}px)`,
                    transition: 'transform 850ms cubic-bezier(.2,.8,.2,1)',
                    cursor: 'pointer',
                  }}
                >
                  <title>{`${words[r]} → ${score ? words[c] : step === 11 ? vocabulary[c] : `feature ${c}`}: ${masked ? 'masked future token · 0' : value.toFixed(5)} · click to inspect`}</title>
                  <rect
                    width={cellW - 4}
                    height="22"
                    rx="3"
                    fill={cell.color}
                    fillOpacity={cell.opacity}
                    stroke={chosen ? '#fff' : r === token ? hue : 'transparent'}
                    strokeWidth={chosen ? 1.5 : 0.5}
                  />
                  {numbers && cols !== 48 && (
                    <text
                      pointerEvents="none"
                      x={(cellW - 4) / 2}
                      y="14"
                      textAnchor="middle"
                      fontSize={cellW > 26 ? 9 : 8}
                      fill={cell.lightText ? '#d4e3eb' : '#071115'}
                    >
                      {masked ? '×' : value.toFixed(1)}
                    </text>
                  )}
                  {masked && (
                    <path
                      d={`M4 7 l${cellW - 12} 8`}
                      stroke="#50616b"
                      strokeWidth=".6"
                    />
                  )}
                </g>
              );
            })}
          </g>
        )),
      )}
      {score &&
        panels.map((_, h) =>
          words.map((word, c) => (
            <text
              key={`${h}-${c}`}
              x={99 + h * 245 + c * cellW + 4}
              y={startY + T * rowHeight + 10}
              transform={`rotate(45 ${99 + h * 245 + c * cellW + 4} ${startY + T * rowHeight + 10})`}
              className="column-label"
            >
              {word}
            </text>
          )),
        )}
      {step === 11 &&
        vocabulary.map((word, c) => (
          <text
            key={word}
            x={98 + c * cellW}
            y={startY + T * rowHeight + 10}
            transform={`rotate(45 ${98 + c * cellW} ${startY + T * rowHeight + 10})`}
            className="column-label"
          >
            {word}
          </text>
        ))}
      {step === 3 &&
        [0, 1, 2].map((h) => (
          <text
            key={h}
            x={94 + h * 124}
            y={startY + T * rowHeight + 25}
            fill={colors[h]}
            className="head-label"
          >
            HEAD {h + 1}
          </text>
        ))}
      {!isHeads && cols !== 48 && (
        <g style={{ opacity: phase, transition: 'opacity .7s' }}>
          <path
            d="M515 165 H550 m-8 -6 8 6 -8 6"
            stroke="#51636e"
            fill="none"
          />
          <text
            x="575"
            y="145"
            className="diagram-equation"
            style={{
              fontSize:
                step === 1
                  ? 22
                  : step === 0 || step === 9 || step === 8
                    ? 24
                    : 32,
            }}
          >
            {equation}
          </text>
          <text
            x="575"
            y="177"
            className="diagram-label"
            style={{ fontSize: 11 }}
          >
            {caption.split(' · ')[0]}
          </text>
          {caption.includes(' · ') && (
            <text
              x="575"
              y="198"
              className="diagram-label"
              style={{ fontSize: 11 }}
            >
              {caption.split(' · ')[1]}
            </text>
          )}
        </g>
      )}
      {isHeads && (
        <text x="425" y="347" textAnchor="middle" className="diagram-label">
          {equation} · {caption}
        </text>
      )}
    </svg>
  );
}
const f = (n: number) => n.toFixed(4);
export function inspect(
  model: Model,
  step: number,
  projection: Projection,
  mlp: MlpStage,
  s: Selection,
) {
  const panels = getDisplay(model, step, projection, mlp),
    h = Math.min(s.head, panels.length - 1),
    r = Math.min(s.row, model.T - 1),
    c = Math.min(s.col, panels[h][r].length - 1),
    value = panels[h][r][c];
  let explanation = '';
  if (step === 0)
    explanation = `word ${f(model.embedding[r][c])} + position ${f(model.position[r][c])}`;
  else if (step === 1) {
    const row = model.x[r],
      mean = row.reduce((a, b) => a + b) / 12,
      v = row.reduce((a, b) => a + (b - mean) ** 2, 0) / 12;
    explanation = `(${f(row[c])} − mean ${f(mean)}) / √(${f(v)} + 0.00001)`;
  } else if (step === 2)
    explanation = `Σ over 12 features: normalised input[${r}, j] × W_${projection}[j, ${c}]`;
  else if (step === 3)
    explanation = `${projection}[0, ${r}, ${c}] → ${projection}[0, ${r}, ${Math.floor(c / 4)}, ${c % 4}] · unchanged`;
  else if (step === 4)
    explanation = `${projection}[0, ${r}, ${h}, ${c}] → ${projection}[0, ${h}, ${r}, ${c}] · unchanged`;
  else if (step === 5)
    explanation =
      model.qh[h][r]
        .map((v, j) => `${f(v)} × ${f(model.kh[h][c][j])}`)
        .join(' + ') +
      '; divide the sum by √4 = 2 (4 query/key features per head)';
  else if (step === 6)
    explanation =
      c > r
        ? 'Future token: score set to −∞, so exp(−∞) = 0.'
        : `exp(score ${f(model.scores[h][r][c])}) / Σ exp(allowed scores in this row). Row sum = ${model.attention[h][r].reduce((a, b) => a + b).toFixed(4)}.`;
  else if (step === 7)
    explanation = model.attention[h][r]
      .map((a, j) => `${f(a)} × ${f(model.vh[h][j][c])}`)
      .join(' + ');
  else if (step === 8)
    explanation = `Σ over 12 joined features: context[${r}, j] × W_o[j, ${c}]`;
  else if (step === 9)
    explanation = `original input ${f(model.x[r][c])} + attention output ${f(model.projected[r][c])}`;
  else if (step === 11)
    explanation = `Probability of vocabulary entry “${vocabulary[c]}” after token ${r}. Softmax converts the vocabulary scores into a row that sums to 1.`;
  else if (step === 10)
    explanation =
      mlp === 'activated'
        ? `Apply the smooth GELU activation to input ${f(model.up[r][c])}. GELU suppresses negative inputs and largely preserves large positive inputs.`
        : mlp === 'up'
          ? `Σ over 12 features: norm2[${r}, j] × W_up[j, ${c}]`
          : mlp === 'down'
            ? `Σ over 48 features: GELU output[${r}, j] × W_down[j, ${c}]`
            : 'Normalise the 12 features of the first residual output, with γ = 1 and β = 0.';
  return {
    value: f(value),
    explanation,
    coords: `${panels.length > 1 ? `head ${h + 1} · ` : ''}token ${r} · ${step === 5 || step === 6 ? 'key token' : step === 11 ? 'vocabulary entry' : 'feature'} ${c}`,
  };
}
