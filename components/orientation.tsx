export const tourSteps = [0, 4, 5, 6];
const cards = [
  {
    title: 'Start with the whole journey',
    body: 'Read the architecture on the left from top to bottom: words become features, attention mixes information between tokens, the feed-forward network transforms features, and the output gives next-token probabilities. Click a step whenever you want to jump.',
    hint: 'We’re at the first step: each word becomes a row of numbers.',
  },
  {
    title: 'Read the picture before the numbers',
    body: 'Each grid belongs to one attention head. A row follows one token; a column holds one feature. The batch contains one sentence, so it is not drawn as another grid. Click a word or cell to outline it and inspect a value.',
    hint: 'All tokens remain visible on the same colour scale. Negative and positive values have different colours.',
  },
  {
    title: 'Give every dimension a meaning',
    body: 'A shape is an ordered list of axis sizes. Here, queries have token rows and feature columns; transposed keys have feature rows and token columns. The worked example under the grid labels what each number means.',
    hint: 'The matching feature axis is summed away. The output keeps query tokens × key tokens.',
  },
  {
    title: 'Compare the whole heatmap, then focus',
    body: '“All tokens” keeps every row on the same scale, even after you click a token. “Focus token” deliberately dims other rows. The crossed-out upper triangle marks future tokens, whose attention weight is zero.',
    hint: 'Use Values for numbers, Inspect a calculation for arithmetic, and Pseudocode for an outline of the operation. Next step or the arrow keys advance the lesson.',
  },
];
export default function Orientation({
  index,
  onMove,
  onFinish,
}: {
  index: number;
  onMove: (index: number) => void;
  onFinish: () => void;
}) {
  const card = cards[index];
  return (
    <section className="orientation" aria-label="Quick orientation">
      <div className="orientation-top">
        <span className="section-label">
          QUICK ORIENTATION · {index + 1} / {cards.length}
        </span>
        <button onClick={onFinish}>Skip orientation</button>
      </div>
      <div aria-live="polite">
        <h2>{card.title}</h2>
        <p>{card.body}</p>
        <p className="orientation-hint">{card.hint}</p>
      </div>
      <div className="orientation-actions">
        <button
          className="secondary"
          disabled={index === 0}
          onClick={() => onMove(index - 1)}
        >
          Back
        </button>
        <span>You can reopen this guide anytime.</span>
        <button
          className="primary"
          onClick={() =>
            index === cards.length - 1 ? onFinish() : onMove(index + 1)
          }
        >
          {index === cards.length - 1 ? 'Start the lesson' : 'Show me next →'}
        </button>
      </div>
    </section>
  );
}
