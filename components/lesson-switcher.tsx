// Full page links avoid the current Vinext production client-navigation failure.
/* eslint-disable nextjs/no-html-link-for-pages */
export default function LessonSwitcher({
  current,
}: {
  current: 'transformer' | 'cnn';
}) {
  return (
    <nav className="lesson-switcher" aria-label="Choose a model lesson">
      <a href="/" aria-current={current === 'transformer' ? 'page' : undefined}>
        Transformer
      </a>
      <a href="/cnn" aria-current={current === 'cnn' ? 'page' : undefined}>
        CNN
      </a>
    </nav>
  );
}
