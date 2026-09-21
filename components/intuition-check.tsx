'use client';
import { useState } from 'react';
const checks: Record<
  number,
  { question: string; options: string[]; answer: number; explanation: string }
> = {
  3: {
    question: 'When twelve features split into three heads, what changes?',
    options: ['The values', 'Only their arrangement'],
    answer: 1,
    explanation:
      'Every value stays the same. Reshaping groups the twelve features into three slices of four.',
  },
  6: {
    question:
      'Can this token take information from a token later in the sentence?',
    options: ['Yes', 'No'],
    answer: 1,
    explanation:
      'The causal mask gives future positions zero attention weight. The token can use itself and earlier positions.',
  },
  7: {
    question:
      'If a key token has zero attention weight, how much does its value vector contribute?',
    options: ['Nothing', 'Its full value vector'],
    answer: 0,
    explanation:
      'The attention weight multiplies every feature in that value vector. A zero weight makes the entire contribution zero.',
  },
};
export default function IntuitionCheck({ step }: { step: number }) {
  const [choice, setChoice] = useState<number | null>(null);
  const check = checks[step];
  if (!check) return null;
  return (
    <details className="journey-detail intuition-check">
      <summary>
        Check your intuition <span>Optional</span>
      </summary>
      <div className="intuition-body">
        <p>{check.question}</p>
        <fieldset className="intuition-options" aria-label={check.question}>
          {check.options.map((option, i) => (
            <button
              className="secondary"
              key={option}
              aria-pressed={choice === i}
              onClick={() => setChoice(i)}
            >
              {option}
            </button>
          ))}
        </fieldset>
        <p aria-live="polite">
          {choice !== null
            ? `${choice === check.answer ? 'That’s right.' : 'Take another look.'} ${check.explanation}`
            : 'Make a prediction, then use the animation to check it.'}
        </p>
      </div>
    </details>
  );
}
