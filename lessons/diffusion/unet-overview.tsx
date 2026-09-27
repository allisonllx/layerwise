import { unetStages } from './model';

const positions = [
  [80, 130],
  [190, 345],
  [380, 345],
  [560, 275],
  [665, 130],
  [845, 130],
];
export default function UnetOverview({
  stage,
  overview,
  trace,
  onSelect,
}: {
  stage: number;
  overview: boolean;
  trace: number[][][];
  onSelect: (stage: number) => void;
}) {
  const previous =
    stage === 0 ? { side: 8, channels: 2 } : unetStages[stage - 1];
  const current = unetStages[stage];
  const spatialChanged = previous.side !== current.side;
  return (
    <div className={'diff-unet-map ' + (overview ? 'is-overview' : '')}>
      <div className="diff-unet-map-heading">
        <span className="section-label">
          {overview
            ? 'ZOOM OUT · THE WHOLE U-NET'
            : 'FOLLOW YOUR PLACE IN THE U-NET'}
        </span>
        <p>
          The face of each stack shows height × width. Its depth represents
          channels: pooling shrinks the face, while concatenation makes the
          stack deeper.
        </p>
      </div>
      <p className="diff-unet-change" aria-live="polite">
        {overview ? (
          'Select a stack to see which dimensions its operation changes.'
        ) : (
          <>
            <b>{current.name}</b>
            {' · '}
            {spatialChanged ? (
              <>
                <strong>
                  Height {previous.side} → {current.side} · width{' '}
                  {previous.side} → {current.side}
                </strong>
                <span>Channels stay at {current.channels}.</span>
              </>
            ) : (
              <>
                <strong>
                  Channels{' '}
                  {stage === 4
                    ? '32 + 16 → 48'
                    : `${previous.channels} → ${current.channels}`}
                </strong>
                <span>
                  Height and width stay at {current.side} × {current.side}.
                </span>
              </>
            )}
          </>
        )}
      </p>
      <div
        className="diff-unet-scroll"
        aria-label="U-Net architecture; scroll horizontally on small screens"
      >
        <svg className="diff-unet-architecture" viewBox="0 0 940 510">
          <title>
            A single-level U-Net: encoder, downsample, bottleneck, upsample,
            join the encoder skip, decoder
          </title>
          <defs>
            <marker
              id="unet-tip"
              markerWidth="6"
              markerHeight="6"
              refX="5"
              refY="3"
              orient="auto"
            >
              <path d="M0 0 L6 3 L0 6" fill="#749a98" />
            </marker>
            <marker
              id="unet-skip-tip"
              markerWidth="6"
              markerHeight="6"
              refX="5"
              refY="3"
              orient="auto"
            >
              <path d="M0 0 L6 3 L0 6" fill="#c5a4e9" />
            </marker>
          </defs>
          <g className="diff-unet-connectors" aria-hidden="true">
            <path d="M44 146 H16 V250 Q16 266 32 280 L166 322" />
            <path d="M216 345 H350" />
            <path d="M410 345 H490 Q510 345 510 325 V298 H520" />
            <path d="M586 249 V170 Q586 155 602 155 H620" />
            <path d="M715 130 H799" />
            <path className="skip" d="M128 123 H610" />
          </g>
          <g className="diff-unet-diagram-copy" aria-hidden="true">
            <text x="80" y="30" textAnchor="middle">
              ENCODER
            </text>
            <text x="750" y="30" textAnchor="middle">
              DECODER
            </text>
            <text className="skip" x="370" y="103" textAnchor="middle">
              copy encoder features · concatenate at 5
            </text>
            <text x="119" y="265">
              ½ spatial size
            </text>
            <text x="460" y="388">
              2× spatial size
            </text>
            <text x="845" y="246" textAnchor="middle">
              1 × 1 convolution
            </text>
            <text x="845" y="268" textAnchor="middle">
              ↓ predicted noise
            </text>
            <text x="845" y="289" textAnchor="middle">
              1 × 8 × 8
            </text>
          </g>
          {unetStages.map((node, i) => {
            const [x, y] = positions[i];
            const active = !overview && stage === i;
            const changeClass = active
              ? spatialChanged
                ? ' changes-spatial'
                : ' changes-channels'
              : '';
            const face = node.side * 8;
            const depth = node.channels / 2;
            const left = 70 - face / 2 - depth / 2,
              top = 55 - face / 2 + depth / 2;
            return (
              <foreignObject
                key={node.name}
                x={x - 70}
                y={y - 55}
                width="140"
                height="160"
              >
                <button
                  className={'diff-unet-stack-button' + changeClass}
                  aria-pressed={!overview && stage === i}
                  onClick={() => onSelect(i)}
                >
                  <svg viewBox="0 0 140 110" aria-hidden="true">
                    <polygon
                      points={`${left},${top} ${left + depth},${top - depth} ${left + face + depth},${top - depth} ${left + face},${top}`}
                      className="stack-top"
                    />
                    <polygon
                      points={`${left + face},${top} ${left + face + depth},${top - depth} ${left + face + depth},${top + face - depth} ${left + face},${top + face}`}
                      className="stack-side"
                    />
                    {[0.25, 0.5, 0.75].map((n) => (
                      <path
                        key={n}
                        d={`M${left + depth * n} ${top - depth * n} H${left + face + depth * n} V${top + face - depth * n}`}
                        className="stack-layer"
                      />
                    ))}
                    <rect
                      x={left}
                      y={top}
                      width={face}
                      height={face}
                      className="stack-face"
                    />
                    <g className="stack-activation">
                      {trace[i][0].map((v, j) => (
                        <rect
                          key={j}
                          x={left + (j % node.side) * 8}
                          y={top + Math.floor(j / node.side) * 8}
                          width="8"
                          height="8"
                          fill={v >= 0 ? '#7cdbcf' : '#b8a7ef'}
                          opacity={0.08 + Math.min(1, Math.abs(v) / 3) * 0.75}
                        />
                      ))}
                    </g>
                    <path
                      className="stack-depth-edges"
                      d={`M${left} ${top} l${depth} ${-depth} M${left + face} ${top} l${depth} ${-depth} M${left + face} ${top + face} l${depth} ${-depth}`}
                    />
                    {i === 4 && (
                      <path
                        d={`M${left + face + (depth * 2) / 3} ${top - (depth * 2) / 3} V${top + face - (depth * 2) / 3}`}
                        className="stack-join"
                      />
                    )}
                  </svg>
                  <span>
                    {i + 1}. {node.name}
                  </span>
                  <code>
                    <span className="stack-spatial-number">
                      {node.side} × {node.side}
                    </span>{' '}
                    ·{' '}
                    <span className="stack-channel-number">
                      {node.channels} ch
                    </span>
                  </code>
                </button>
              </foreignObject>
            );
          })}
        </svg>
      </div>
      <p className="diff-unet-map-legend">
        <span>Face = spatial size</span>
        <span>Depth = channel count</span>
        <span>Lavender line = encoder skip</span>
        <span className="diff-unet-change-key">
          Gold = dimensions changed by this operation
        </span>
      </p>
      <p className="diff-caption">
        Our small U-Net has one downsampling level; larger U-Nets repeat this
        pattern at several resolutions. Stack depth is proportional to channel
        count; drawn sheets are illustrative. Select any stack to inspect its
        channels.
      </p>
    </div>
  );
}
