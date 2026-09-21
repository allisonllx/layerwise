export default function PipelineShape({
  shape,
  classes = false,
}: {
  shape: string;
  classes?: boolean;
}) {
  if (!shape.startsWith('[')) return <code>{shape}</code>;
  const values = shape
    .slice(1, -1)
    .split(',')
    .map((x) => x.trim());
  const symbols =
    values.length === 4
      ? ['B', 'C', 'H', 'W']
      : ['B', classes ? 'Classes' : 'F'];
  const names =
    values.length === 4
      ? ['images in batch', 'channels', 'height (rows)', 'width (columns)']
      : ['images in batch', classes ? 'classes' : 'features'];
  return (
    <code className="cnn-shape-pair">
      {[values, symbols].map((tuple, j) => (
        <span key={j}>
          {j > 0 && ' = '}[
          {tuple.map((value, i) => (
            <span key={i}>
              {i > 0 && ', '}
              <span
                className={
                  i === 0
                    ? 'cnn-axis-batch'
                    : i === 1
                      ? 'cnn-axis-channel'
                      : 'cnn-axis-spatial'
                }
                title={names[i]}
              >
                {value}
              </span>
            </span>
          ))}
          ]
        </span>
      ))}
    </code>
  );
}
