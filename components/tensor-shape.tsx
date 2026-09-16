/** Name axes explicitly; colour is a secondary cue, never the only label. */
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
      {text.split(/(\[[^\]]+\])/g).map((part, index) => {
        if (!part.startsWith('[')) return part;
        const dims = part
          .slice(1, -1)
          .split(',')
          .map((s) => s.trim());
        let axes =
          dims.length === 2
            ? ['batch', 'tokens']
            : ['batch', 'tokens', 'features'];
        if (dims.length === 4)
          axes =
            (step === 3 && output) || (step === 4 && !output)
              ? ['batch', 'tokens', 'heads', 'features per head']
              : ['batch', 'heads', 'tokens', 'features per head'];
        if (
          dims.length === 4 &&
          ((step === 5 && output) ||
            step === 6 ||
            (step === 7 && !output && index === 1))
        )
          axes = ['batch', 'heads', 'query tokens', 'key tokens'];
        if (step === 5 && !output && index === 3)
          axes = ['batch', 'heads', 'features per head', 'key tokens'];
        if (step === 5 && !output && index === 1)
          axes = ['batch', 'heads', 'query tokens', 'features per head'];
        if (step === 7 && !output && index === 3)
          axes = ['batch', 'heads', 'key tokens', 'value features'];
        if (step === 7 && output)
          axes = ['batch', 'heads', 'query tokens', 'value features'];
        if (step === 11 && output) axes = ['batch', 'tokens', 'vocabulary'];
        return (
          <span key={index}>
            [
            {dims.map((v, i) => (
              <span key={i}>
                {i > 0 ? ', ' : ''}
                <span
                  className={
                    'dim dimension-with-label ' +
                    (axes[i].includes('token')
                      ? 'dim-token'
                      : axes[i] === 'heads'
                        ? 'dim-head'
                        : axes[i] === 'batch'
                          ? 'dim-batch'
                          : 'dim-feature')
                  }
                  title={`${axes[i]}: ${v}`}
                  aria-label={`${axes[i]} ${v}`}
                >
                  <b>{v}</b>
                  <small>{axes[i]}</small>
                </span>
              </span>
            ))}
            ]
          </span>
        );
      })}
    </code>
  );
}
