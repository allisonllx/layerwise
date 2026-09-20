/** Shared by the mixing animation and its interactive result. */
export default function HeadLabels({ head }: { head: number }) {
  return (
    <g>
      <text
        x={99 + head * 245}
        y="35"
        fill={['#70d2c4', '#e5ba7c', '#b8a4e7'][head]}
        fontSize="13"
      >
        HEAD {head + 1}
      </text>
      <text x={99 + head * 245} y="55" fill="#aabcc5" fontSize="11">
        Rows (↓) tokens · features (→)
      </text>
    </g>
  );
}
