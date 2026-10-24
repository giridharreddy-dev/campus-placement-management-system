import { useState } from 'react';
import { combinedExperiments } from './catalog';
import PreparationPlanner from './experiment2/PreparationPlanner';
import ApplicationDesk from './experiment3/ApplicationDesk';
import ApplicationManager from './ApplicationManager';
import EligibilityDesk from './EligibilityDesk';
import SourceCode from '../learning/SourceCode';
import '../learning/learning.css';
import './case-study.css';

const sources = import.meta.glob('./experiment*/**/*.{html,js,jsx,sql}', {
  eager: true,
  query: '?raw',
  import: 'default',
});
const guide = import.meta.glob('./OBSERVATION.md', {
  eager: true,
  query: '?url',
  import: 'default',
});
export default function CaseStudyPage() {
  const [selected, setSelected] = useState(1);
  const experiment = combinedExperiments.find((item) => item.id === selected);
  const files = Object.entries(sources).filter(([name]) =>
    name.startsWith(`./experiment${selected}/`),
  );
  return (
    <div className="learning-lab case-study-page">
      <header className="lab-header">
        <a href="/">CPMS placement portal</a>
        <a href="/syllabus">Individual syllabus programs</a>
        <a href="/project-files">All three sets / folders</a>
      </header>
      <main className="case-main">
        <div className="case-hero">
          <p className="lab-eyebrow">CAMPUS PLACEMENT MANAGEMENT SYSTEM</p>
          <h1>One placement story. Five combined programs.</h1>
          <p>
            Each experiment combines a–e into one case study you can write and demonstrate.
            Experiments 3–5 share a working React, Express and MySQL registration workflow.
          </p>
          <a href={guide['./OBSERVATION.md']} download="CPMS_COMBINED_OBSERVATION.md">
            Download the observation guide ↓
          </a>
          <p>
            <a href="/">Open the complete portfolio project →</a>
          </p>
        </div>
        <nav className="case-navigation" aria-label="Combined experiments">
          {combinedExperiments.map((item) => (
            <button
              key={item.id}
              aria-current={selected === item.id ? 'page' : undefined}
              onClick={() => setSelected(item.id)}
            >
              Experiment {item.id}
              <span>{item.title}</span>
            </button>
          ))}
        </nav>
        <article key={selected}>
          <p className="lab-eyebrow">EXPERIMENT {selected} · PARTS A–E COMBINED</p>
          <h2>{experiment.title}</h2>
          <p>{experiment.scenario}</p>
          <section className="lab-panel">
            <h3>Concepts used in this case study</h3>
            <ul>
              {experiment.coverage.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p>{experiment.connection}</p>
          </section>
        {selected === 1 && <EligibilityDesk />}
          {selected === 2 && <PreparationPlanner name="Giri" />}
          {selected === 3 && <ApplicationDesk />}
          {selected === 4 && (
            <>
              <section className="lab-panel">
                <h3>Open the placement service</h3>
                <a href="http://127.0.0.1:5020/" target="_blank" rel="noreferrer">
                  Server home, routes and browser console ↗
                </a>
              </section>
              <ApplicationManager />
            </>
          )}
          <section className="lab-panel">
            <h3>Observation record</h3>
            <p>
              <strong>Aim:</strong> {experiment.aim}
            </p>
            <h4>Algorithm</h4>
            <ol>
              {experiment.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <h4>Expected output</h4>
            <ul>
              {experiment.outputs.map((output) => (
                <li key={output}>{output}</li>
              ))}
            </ul>
            <p>
              <strong>Result:</strong> {experiment.result}
            </p>
            <p>Write your actual observed output after running the program.</p>
          </section>
          <section className="lab-panel">
            <h3>Run this program</h3>
            <p>{experiment.run}</p>
            {selected >= 3 && (
              <p>
                One-time setup: from the repository root, run{' '}
                <code>node src/CPMS-React/tools/initialize-case-study.mjs --initialize-case-study</code>,
                then <code>node src/CPMS-React/case-study/experiment4/server.js</code>. The setup creates
                only the separate cpms_case_study database and its local account.
              </p>
            )}
          </section>
          <section className="lab-panel">
            <h3>The combined program</h3>
            <p>
              These files are the program for this observation. Page navigation and styling are
              supporting project files.
            </p>
            {files.map(([name, code]) => (
              <details key={name} open>
                <summary>case-study/{name.slice(2)}</summary>
                <SourceCode fileName={name} code={code} />
              </details>
            ))}
          </section>
          <section className="lab-panel">
            <h3>Beyond the five programs</h3>
            <p>
              The complete CPMS portal adds student/recruiter/admin accounts, password hashing,
              cookie-based login, role and ownership checks, company management, application stages,
              reporting and transactions. The preparation planner above is also part of the student
              dashboard.
            </p>
            <p>
              Spread/rest, destructuring, coercion and hoisting appear in Experiment 1. JSX and
              conditional rendering appear in React. The existing syllabus lab retains the
              DOM/Virtual DOM explanation, MVC implementation and independent advice-service
              demonstration.
            </p>
          </section>
        </article>
      </main>
    </div>
  );
}
