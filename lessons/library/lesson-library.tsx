'use client';
/* eslint-disable nextjs/no-html-link-for-pages */
import { useState } from 'react';
import { ArrowRight, Layers3, Search } from 'lucide-react';
import { lessons } from '../../lib/lesson-catalog';
function Preview({ id }: { id: string }) {
  return (
    <div className={'library-preview ' + id} aria-hidden="true">
      {id === 'transformer' ? (
        <>
          <span className="preview-token">a</span>
          <span className="preview-token">small</span>
          <span className="preview-token selected">idea</span>
          <span className="preview-arrow">→</span>
          <div className="preview-attention">
            {Array.from({ length: 9 }, (_, i) => (
              <i key={i} style={{ opacity: 0.15 + (i % 4) * 0.22 }} />
            ))}
          </div>
        </>
      ) : id === 'cnn' ? (
        <>
          <div className="preview-pixels">
            {Array.from({ length: 25 }, (_, i) => (
              <i
                key={i}
                style={{
                  opacity: i % 5 === 2 || Math.floor(i / 5) === 2 ? 0.9 : 0.15,
                }}
              />
            ))}
          </div>
          <span className="preview-arrow">→</span>
          <div className="preview-feature">
            {Array.from({ length: 9 }, (_, i) => (
              <i key={i} style={{ opacity: i % 3 === 1 ? 0.85 : 0.2 }} />
            ))}
          </div>
        </>
      ) : id === 'diffusion' ? (
        <>
          <div className="preview-pixels">
            {Array.from({ length: 25 }, (_, i) => (
              <i key={i} style={{ opacity: 0.1 + ((i * 17 + 3) % 23) / 26 }} />
            ))}
          </div>
          <span className="preview-arrow">→</span>
          <div className="preview-pixels">
            {Array.from({ length: 25 }, (_, i) => (
              <i
                key={i}
                style={{
                  opacity: [1, 2, 3, 8, 11, 12, 13, 16, 21, 22, 23].includes(i)
                    ? 0.9
                    : 0.1,
                }}
              />
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="preview-modalities">
            <span>image</span>
            <span>caption</span>
          </div>
          <span className="preview-arrow">→</span>
          <div className="preview-matches">
            {Array.from({ length: 9 }, (_, i) => (
              <i className={i % 4 === 0 ? 'match' : ''} key={i} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
export default function LessonLibrary() {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const visible = lessons.filter((l) =>
    [l.title, l.question, l.kind, ...l.concepts.map((c) => c.name)]
      .join(' ')
      .toLowerCase()
      .includes(q),
  );
  return (
    <main className="lesson-library">
      <header className="topbar">
        <a className="brand" href="/">
          <Layers3 size={23} />
          layerwise<span className="prototype-label">EXPLORER</span>
        </a>
        <span className="library-header-note">
          Understand it, one step at a time.
        </span>
      </header>
      <div className="library-wrap">
        <section className="library-intro">
          <span className="section-label">AN INTERACTIVE LEARNING LIBRARY</span>
          <h1>
            See how the
            <br />
            <em>pieces work together.</em>
          </h1>
          <p>
            Explore the models and ideas behind machine learning. Follow a
            concrete example, watch the calculations unfold, and pause wherever
            you need.
          </p>
          <div className="library-rhythm">
            <span>
              <b>01</b>Follow an example
            </span>
            <span>
              <b>02</b>Play, pause or inspect
            </span>
            <span>
              <b>03</b>Go deeper when ready
            </span>
          </div>
        </section>
        <section aria-labelledby="library-heading">
          <div className="library-heading">
            <div>
              <span className="section-label">CHOOSE A QUESTION</span>
              <h2 id="library-heading">Explore the lessons</h2>
            </div>
            <label className="library-search">
              <Search size={17} />
              <span className="sr-only">Search lessons or concepts</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Find a model or concept…"
              />
            </label>
          </div>
          <p className="library-hint">
            Start with a whole lesson, or choose a concept to jump to the step
            that teaches it.
          </p>
          <div className="library-grid">
            {visible.map((lesson) => (
              <article className="library-card" key={lesson.id}>
                <Preview id={lesson.id} />
                <div className="library-card-body">
                  <div className="library-meta">
                    <span>{lesson.kind}</span>
                    <span>{lesson.steps} steps · self-paced</span>
                  </div>
                  <h3>
                    <a href={lesson.href}>{lesson.title}</a>
                  </h3>
                  <p className="library-question">{lesson.question}</p>
                  <p className="library-description">{lesson.description}</p>
                  <div className="library-follow">
                    <span>FOLLOW</span>
                    {lesson.unit}
                  </div>
                  <div className="library-concepts">
                    <h4>You’ll explore</h4>
                    <div>
                      {lesson.concepts.map((c) => (
                        <a
                          key={c.step}
                          href={`${lesson.href}#${c.step}`}
                          aria-label={`${c.name} in ${lesson.title}`}
                        >
                          {c.name}
                          <ArrowRight size={12} />
                        </a>
                      ))}
                    </div>
                  </div>
                  <p className="library-prerequisites">
                    <b>Helpful first</b> {lesson.prerequisites.join(' · ')}
                  </p>
                  <div className="library-card-footer">
                    <span>{lesson.scope}</span>
                    <a href={lesson.href} className="library-start">
                      Start lesson
                      <ArrowRight size={16} />
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {visible.length === 0 && (
            <div className="library-empty">
              <h3>No lesson matches “{query}” yet.</h3>
              <p>
                Try “attention”, “convolution” or “loss”. The library currently
                has {lessons.length} lessons.
              </p>
              <button className="secondary" onClick={() => setQuery('')}>
                Show all lessons
              </button>
            </div>
          )}
          <p className="library-count" aria-live="polite">
            {visible.length} of {lessons.length} lessons
          </p>
        </section>
        <footer className="library-footer">
          <h2>Learn an idea in context.</h2>
          <p>
            Models, reusable concepts and training mechanisms can all be
            starting points. For now, concept links take you into a worked
            example within a model or method lesson.
          </p>
          <p>
            Each lesson uses small teaching models and states its
            simplifications. You can explore without a quiz or a required
            learning order.
          </p>
        </footer>
      </div>
    </main>
  );
}
