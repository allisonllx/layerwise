type Axis = { symbol: string; name: string; value: string };

export function shapeAxes(text: string, step: number, output = false) {
  return text.split(/(\[[^\]]+\])/g).map((part, index) => {
    if (!part.startsWith('[')) return { text: part, axes: [] as Axis[] };
    const dims = part
      .slice(1, -1)
      .split(',')
      .map((s) => s.trim());
    let names =
      dims.length === 2 ? ['batch', 'tokens'] : ['batch', 'tokens', 'features'];
    if (dims.length === 4)
      names =
        (step === 3 && output) || (step === 4 && !output)
          ? ['batch', 'tokens', 'heads', 'features per head']
          : ['batch', 'heads', 'tokens', 'features per head'];
    if (
      dims.length === 4 &&
      ((step === 5 && output) ||
        step === 6 ||
        (step === 7 && !output && index === 1))
    )
      names = ['batch', 'heads', 'query tokens', 'key tokens'];
    if (step === 5 && !output && index === 1)
      names = ['batch', 'heads', 'query tokens', 'features per head'];
    if (step === 5 && !output && index === 3)
      names = ['batch', 'heads', 'features per head', 'key tokens'];
    if (step === 7 && !output && index === 3)
      names = ['batch', 'heads', 'key tokens', 'features per head'];
    if (step === 7 && output)
      names = ['batch', 'heads', 'query tokens', 'features per head'];
    if (step === 11 && output)
      names = ['batch', 'tokens', 'vocabulary entries'];
    const symbols: Record<string, string> = {
      batch: 'B',
      tokens: 'T',
      heads: 'H',
      'query tokens': 'Tq',
      'key tokens': 'Tk',
      'features per head': 'F',
      'vocabulary entries': 'C',
    };
    return {
      text: part,
      axes: dims.map((value, i) => ({
        value,
        name: names[i],
        symbol: symbols[names[i]] ?? (value === '48' ? 'M' : 'D'),
      })),
    };
  });
}
const tone = (name: string) =>
  name.includes('token')
    ? 'dim-token'
    : name === 'heads'
      ? 'dim-head'
      : name === 'batch'
        ? 'dim-batch'
        : 'dim-feature';

export default function TensorShape({
  text,
  step,
  output = false,
}: {
  text: string;
  step: number;
  output?: boolean;
}) {
  return (
    <code className="tensor-shape">
      {shapeAxes(text, step, output).map((part, index) =>
        part.axes.length === 0 ? (
          part.text
        ) : (
          <span className="shape-pair" key={index}>
            {(['value', 'symbol'] as const).map((kind) => (
              <span
                className={
                  'shape-tuple ' +
                  (kind === 'value' ? 'numeric-shape' : 'symbolic-shape')
                }
                key={kind}
                aria-label={
                  kind === 'value' ? 'Current dimensions' : 'Axis symbols'
                }
              >
                [
                {part.axes.map((axis, i) => (
                  <span key={i}>
                    {i > 0 ? ', ' : ''}
                    <span
                      className={'dim ' + tone(axis.name)}
                      title={`${axis.symbol}: ${axis.value} ${axis.name}`}
                    >
                      {axis[kind]}
                    </span>
                  </span>
                ))}
                ]
              </span>
            ))}
          </span>
        ),
      )}
    </code>
  );
}

export function ShapeLegend({
  input,
  output,
  step,
}: {
  input: string;
  output: string;
  step: number;
}) {
  const axes = [
    ...shapeAxes(input, step),
    ...shapeAxes(output, step, true),
  ].flatMap((part) => part.axes);
  const unique = [...new Map(axes.map((axis) => [axis.symbol, axis])).values()];
  return (
    <dl className="shape-key" aria-label="What the shape symbols mean">
      {unique.map((axis) => (
        <div key={axis.symbol}>
          <dt className={tone(axis.name)}>{axis.symbol}</dt>
          <dd>
            {axis.name === 'batch' ? 'sequences in the batch' : axis.name}
          </dd>
        </div>
      ))}
    </dl>
  );
}
