import { useState } from 'react';
import { lessons, units } from './catalog';
import ModernJavaScript from './ModernJavaScript';
import CrudPractice from './CrudPractice';
import OriginalProgram from './OriginalProgram';
import SourceCode from './SourceCode';
import './learning.css';

const programs = import.meta.glob('./case/*.jsx', {
  eager: true,
  import: 'default',
});
const sources = import.meta.glob(
  ['./case/**/*.{jsx,html,js,mjs,sql}', './server/**/*.{mjs,sql}'],
  { eager: true, query: '?raw', import: 'default' },
);

function Example({ lesson, mode }) {
  const Component = programs[`./${mode}/${lesson.id}.jsx`];
  const prefix = `./${mode}/${lesson.id}`;
  const files = Object.entries(sources).filter(
    ([name]) =>
      name === `${prefix}.jsx` ||
      name === `${prefix}.mjs` ||
      name === `${prefix}.sql` ||
      name.startsWith(`${prefix}/`),
  );
  const serverFiles =
    lesson.unit === 4
      ? Object.entries(sources).filter(([name]) => name.startsWith('./server/'))
      : [];
  const url = `http://127.0.0.1:5010/${mode}/${lesson.id}`;
  const html = sources[`${prefix}/index.html`];
  const document = html?.replace(
    '<script src="script.js"></script>',
    `<script>${sources[`${prefix}/script.js`]}</script>`,
  );
  return (
    <>
      <section className="lab-panel" aria-label="Program output">
        <div className="lab-panel-heading">
          <h3>Try the program</h3>
          <span>{mode === 'case' ? 'Placement sandbox' : 'Basic program'}</span>
        </div>
        {Component ? (
          <Component />
        ) : lesson.unit === 1 ? (
          <iframe
            title={`${lesson.id} ${mode} output`}
            sandbox="allow-scripts"
            srcDoc={document}
          />
        ) : lesson.unit === 4 ? (
          <>
            <p>Start the teaching server from the repository root:</p>
            <pre>node src/CPMS-React/learning/server/start.mjs</pre>
            <p>
              Inside the standalone CPMS folder, use{' '}
              <code>npm run lab:server</code> instead.
            </p>
            <a href={url} target="_blank" rel="noreferrer">
              Open experiment {lesson.id} ↗
            </a>
            <p>
              It runs on port 5010. The CRUD records are practice data held in
              memory. Experiment 4e requires the separate syllabus MySQL
              database.
            </p>
            {lesson.id === '4d' && <CrudPractice mode={mode} />}
          </>
        ) : (
          <>
            <p>
              Run the SQL below in MySQL Command Line Client or MySQL Workbench.
              Follow the setup order in the README.
            </p>
            <p>
              These scripts use <code>cpms_syllabus_{mode}</code>, separate from
              the placement database.
            </p>
          </>
        )}
      </section>
      <section className="lab-panel">
        <h3>Source code</h3>
        <p>
          Each React file exports a component you can also use as App in a Vite
          React project. HTML examples have their own linked script.
        </p>
        {[...files, ...serverFiles].map(([name, code]) => (
          <details
            key={name}
            open={files.length === 1 && name === files[0]?.[0]}
          >
            <summary>{name.replace('./', '')}</summary>
            <SourceCode code={code} fileName={name} />
          </details>
        ))}
      </section>
    </>
  );
}

export default function LearningLab() {
  const [selected, setSelected] = useState('1a');
  const [mode, setMode] = useState(() =>
    new URLSearchParams(window.location.search).get('mode') === 'basic' ? 'basic' : 'case',
  );
  const [query, setQuery] = useState('');
  const lesson = lessons.find((item) => item.id === selected);
  return (
    <div className="learning-lab">
      <header className="lab-header">
        <a href="/">CPMS / Placement portal</a>
        <a href="/project-files">All three sets / folders</a>
      </header>
      <div className="lab-hero">
        <p className="lab-eyebrow">LEARN IT. APPLY IT. EXPLAIN IT.</p>
        <h1>One syllabus. A real placement story.</h1>
        <p>
          Explore all 25 experiments, compare a basic program with its campus
          placement use, then open the complete portal.
        </p>
        <div className="lab-metrics">
          <span>
            <strong>05</strong> syllabus units
          </span>
          <span>
            <strong>25</strong> experiment pairs
          </span>
          <span>
            <strong>03</strong> portal roles
          </span>
        </div>
      </div>
      <div className="lab-layout">
        <aside className="lab-sidebar">
          <label htmlFor="lesson-search">Find an experiment</label>
          <input
            id="lesson-search"
            placeholder="Try props, SQL or 3b"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {units.map((unit, index) => (
            <section key={unit}>
              <h2>
                {index + 1}. {unit}
              </h2>
              {lessons
                .filter(
                  (item) =>
                    item.unit === index + 1 &&
                    `${item.id} ${item.title}`
                      .toLowerCase()
                      .includes(query.toLowerCase()),
                )
                .map((item) => (
                  <button
                    key={item.id}
                    aria-current={selected === item.id ? 'page' : undefined}
                    onClick={() => setSelected(item.id)}
                  >
                    <b>{item.id}</b> {item.title}
                  </button>
                ))}
            </section>
          ))}
          {!lessons.some((item) =>
            `${item.id} ${item.title}`
              .toLowerCase()
              .includes(query.toLowerCase()),
          ) && <p>No matching experiments.</p>}
        </aside>
        <main className="lab-content">
          <p className="lab-eyebrow">EXPERIMENT {lesson.id.toUpperCase()}</p>
          <h2>{lesson.title}</h2>
          <p>{lesson.usage}</p>
          <div className="lab-switch" role="group" aria-label="Example type">
            <button
              aria-pressed={mode === 'basic'}
              onClick={() => setMode('basic')}
            >
              Basic program
            </button>
            <button
              aria-pressed={mode === 'case'}
              onClick={() => setMode('case')}
            >
              Individual CPMS example
            </button>
          </div>
          {mode === 'basic' ? (
            <OriginalProgram key={selected} lesson={lesson} />
          ) : (
            <Example key={selected} lesson={lesson} mode="case" />
          )}
          <section className="lab-panel lab-connection">
            <h3>Connect it to the complete project</h3>
            <p>
              Inspect <code>src/CPMS-React/{lesson.project}</code>.
            </p>
            <p>
              The portal uses authenticated MySQL data. The examples here are
              deliberately small, isolated teaching programs; their practice
              counters and records do not change real applications.
            </p>
            <a href="/">Open the student, recruiter and admin portal →</a>
          </section>
          <ModernJavaScript />
          <section className="lab-panel">
            <h3>Architecture viva</h3>
            <p>
              <strong>Node.js</strong> runs JavaScript on the server.{' '}
              <strong>Express</strong> handles routes and middleware. In the
              teaching server, routes delegate to controllers, and models hold
              data; the browser renders the view. This demonstrates MVC.
            </p>
            <p>
              The existing portal is one Express application. To demonstrate
              microservices, the teaching server calls a separately running
              placement advice service over HTTP. Start{' '}
              <code>node src/CPMS-React/learning/server/advice-service.mjs</code>,
              then open{' '}
              <a
                href="http://127.0.0.1:5010/case/architecture"
                target="_blank"
                rel="noreferrer"
              >
                the service communication example
              </a>
              . The portal is not described as a microservice deployment.
            </p>
            <p>
              <strong>Real DOM vs Virtual DOM:</strong> experiment 1 changes
              browser nodes directly. React components describe UI in JSX;
              reconciliation compares render output and commits necessary
              changes to the real DOM. The virtual DOM is an in-memory
              description, not a second browser document.
            </p>
          </section>
        </main>
      </div>
      <footer className="lab-footer">
        Campus Placement Management System · Syllabus lab and portfolio case
        study
      </footer>
    </div>
  );
}
