type Axis = { symbol: string; value: number; name: string; tone: string };
export default function CnnShape({
  kind,
  size,
}: {
  kind: 'input' | 'weights' | 'output';
  size: number;
}) {
  const batch = {
    symbol: 'B',
    value: 1,
    name: 'images in the batch',
    tone: 'batch',
  };
  const input = {
    symbol: 'Cᵢₙ',
    value: 1,
    name: 'input channels',
    tone: 'channel',
  };
  const output = {
    symbol: 'Cₒᵤₜ',
    value: 1,
    name: 'output channels',
    tone: 'channel',
  };
  const axes: Axis[] =
    kind === 'weights'
      ? [
          output,
          input,
          { symbol: 'Kₕ', value: 3, name: 'kernel height', tone: 'kernel' },
          { symbol: 'K𝓌', value: 3, name: 'kernel width', tone: 'kernel' },
        ]
      : [
          batch,
          kind === 'input' ? input : output,
          {
            symbol: kind === 'input' ? 'H' : 'Hₒᵤₜ',
            value: kind === 'input' ? 6 : size,
            name: 'height (rows)',
            tone: 'spatial',
          },
          {
            symbol: kind === 'input' ? 'W' : 'Wₒᵤₜ',
            value: kind === 'input' ? 6 : size,
            name: 'width (columns)',
            tone: 'spatial',
          },
        ];
  return (
    <code className="cnn-shape-pair">
      {(['value', 'symbol'] as const).map((field, i) => (
        <span key={field}>
          {i > 0 && <span className="cnn-shape-equals"> = </span>}[
          {axes.map((axis, index) => (
            <span key={axis.symbol}>
              {index > 0 && ', '}
              <span
                className={'cnn-axis-' + axis.tone}
                title={`${axis.symbol}: ${axis.value} ${axis.name}`}
              >
                {axis[field]}
              </span>
            </span>
          ))}
          ]
        </span>
      ))}
    </code>
  );
}
