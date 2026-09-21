export default function Orientation({
  token,
  onFinish,
}: {
  token: string;
  onFinish: () => void;
}) {
  return (
    <section
      className="orientation journey-welcome"
      aria-label="How to follow along"
    >
      <span className="section-label">ONE TOKEN · TWELVE SMALL STEPS</span>
      <h2>Follow “{token}” through a transformer.</h2>
      <p>
        Watch its numbers take shape, gather information from earlier words, and
        become scores for the next token. The word stays the same; its
        representation changes.
      </p>
      <div className="welcome-rhythm" aria-label="How each step works">
        <span>
          <b>1</b> Read the question
        </span>
        <span>
          <b>2</b> Play or scrub the animation
        </span>
        <span>
          <b>3</b> Take one idea with you
        </span>
      </div>
      <p className="orientation-hint">
        The detail is there when you want it. Open a question below each step to
        explore inputs, dimensions, arithmetic or code.
      </p>
      <div className="orientation-actions">
        <button className="primary" onClick={onFinish}>
          Follow this token →
        </button>
        <span>You can choose another token at any time.</span>
      </div>
    </section>
  );
}
