import Link from 'next/link';
export default function LessonSwitcher({
  current,
}: {
  current: 'transformer' | 'cnn';
}) {
  return (
    <nav className="lesson-switcher" aria-label="Choose a model lesson">
      <Link
        href="/"
        aria-current={current === 'transformer' ? 'page' : undefined}
      >
        Transformer
      </Link>
      <Link href="/cnn" aria-current={current === 'cnn' ? 'page' : undefined}>
        CNN
      </Link>
    </nav>
  );
}
