/** Shared by the mixing animation and its interactive result. */
export default function HeadLabels({ head }: { head: number }) {
  return (
    <g>
      <text
        x={99 + head * 245}
        y="35"
        fill={['#70d2c4', '#e5ba7c', '#b8a4e7'][head]}
        className="head-label"
      >
        HEAD {head + 1}
      </text>
      <text
        x={99 + head * 245}
        y="53"
        className="diagram-label"
        style={{ fontSize: 11 }}
      >
        Rows (↓) tokens
      </text>
      <text
        x={99 + head * 245}
        y="69"
        className="diagram-label"
        style={{ fontSize: 11 }}
      >
        Columns (→) features
      </text>
    </g>
  );
}
