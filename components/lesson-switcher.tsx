/* eslint-disable nextjs/no-html-link-for-pages */
import { ArrowLeft } from 'lucide-react';
export default function LessonSwitcher() {
  return (
    <nav className="lesson-switcher" aria-label="Lesson library">
      <a href="/">
        <ArrowLeft size={14} aria-hidden="true" /> All lessons
      </a>
    </nav>
  );
}
