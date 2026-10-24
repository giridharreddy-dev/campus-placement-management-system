import { useEffect, useState } from 'react';
import originals from '../learning/original/manifest.json';
import SourceCode from '../learning/SourceCode';
import '../learning/learning.css';
import './project-files.css';

// Only publish source/document formats. Environment files, dependencies and
// generated copies are deliberately excluded from this browser source index.
const source = import.meta.glob(
  [
    '../**/*.{html,css,js,jsx,mjs,sql,json,md}',
    '!../node_modules/**',
    '!../dist/**',
    '!../submission/**',
    '!../.verification/**',
    '!../.private/**',
    '!../original-programs/**',
    '!../cpms_source_code.md',
    '!../learning/original/manifest.json',
    '!../learning/original/previews/**',
  ],
  { query: '?raw', import: 'default' },
);
const complete = Object.entries(source).map(([name, load]) => ({
  path: name.slice(3),
  load,
}));
const basic = Object.values(originals.programs).flatMap((program) =>
  program.files.map((file) => ({
    path: `Experiment-${program.id[0]}/${program.id[1]}/${file.name}`,
    code: file.formattedCode || file.code,
    origin: file.origin,
  })),
);
const combined = complete
  .filter((file) => /^case-study\/experiment[1-5]\//.test(file.path))
  .map((file) => ({
    ...file,
    path: file.path.replace(/^case-study\/experiment(\d)/, 'Experiment-$1'),
  }));
const sets = [
  {
    id: 'basic',
    title: '1. Basic programs',
    count: '25 programs · 1a–5e',
    description:
      'Your individual basic programs, organised by experiment and question.',
    folder: '01-basic-programs',
    href: '/syllabus?mode=basic',
    action: 'Run the basic programs',
    files: basic,
  },
  {
    id: 'combined',
    title: '2. Combined case studies',
    count: '5 programs · a–e combined in each',
    description:
      'One manageable CPMS program for each experiment, with its observation record.',
    folder: '02-combined-case-studies',
    href: '/case-study',
    action: 'Run the five case studies',
    files: combined,
  },
  {
    id: 'complete',
    title: '3. Complete CPMS project',
    count: '1 project · Experiments 1–5 together',
    description:
      'The full portal, combined features and syllabus material, including the backend and database.',
    folder: '03-complete-project/CPMS',
    href: '/',
    action: 'Open the complete portal',
    files: complete,
  },
];

function tree(files) {
  const root = { folders: {}, files: [] };
  for (const file of files) {
    const parts = file.path.split('/');
    let node = root;
    for (const part of parts.slice(0, -1)) {
      node.folders[part] ??= { folders: {}, files: [] };
      node = node.folders[part];
    }
    node.files.push(file);
  }
  return root;
}

function FolderTree({ node, selected, choose, expanded = false }) {
  return (
    <ul className="files-tree">
      {Object.entries(node.folders)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, folder]) => (
          <li key={name}>
            <details open={expanded || undefined}>
              <summary>{name}/</summary>
              <FolderTree
                node={folder}
                selected={selected}
                choose={choose}
                expanded={expanded}
              />
            </details>
          </li>
        ))}
      {node.files
        .sort((a, b) => a.path.localeCompare(b.path))
        .map((file) => (
          <li key={file.path}>
            <button
              type="button"
              aria-current={selected === file.path ? 'true' : undefined}
              onClick={() => choose(file.path)}
              title={file.path}
            >
              {file.path.split('/').pop()}
            </button>
          </li>
        ))}
    </ul>
  );
}

function FilePreview({ file }) {
  const [code, setCode] = useState(file.code ?? null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (file.code !== undefined) return;
    let active = true;
    file.load().then(
      (text) => {
        if (active) setCode(text);
      },
      () => {
        if (active)
          setError('Could not load this file. Refresh the page to retry.');
      },
    );
    return () => {
      active = false;
    };
  }, [file]);
  if (error) return <p role="alert">{error}</p>;
  if (code === null) return <p role="status">Loading source...</p>;
  return <SourceCode fileName={file.path} code={code} />;
}

function SourceBrowser({ set }) {
  const [query, setQuery] = useState('');
  const [selected, choose] = useState(set.files[0].path);
  const visible = set.files.filter((file) =>
    file.path.toLowerCase().includes(query.toLowerCase()),
  );
  const file = set.files.find((item) => item.path === selected);
  return (
    <section className="files-layout" aria-label={`${set.title} folders`}>
      <aside className="files-sidebar">
        <label htmlFor="file-search">Find a folder or file</label>
        <input
          id="file-search"
          value={query}
          placeholder="Try Experiment-3 or server.js"
          onChange={(event) => setQuery(event.target.value)}
        />
        <p>{visible.length} source files</p>
        <FolderTree
          key={query}
          node={tree(visible)}
          selected={selected}
          choose={choose}
          expanded={Boolean(query)}
        />
        {!visible.length && <p>No matching files.</p>}
      </aside>
      <article className="files-preview">
        <h2>
          {set.folder}/{file.path}
        </h2>
        {file.origin && (
          <p>
            Original source: {file.origin}. Displayed with consistent
            indentation.
          </p>
        )}
        <FilePreview key={file.path} file={file} />
      </article>
    </section>
  );
}

export default function ProjectFiles() {
  const [selected, select] = useState('basic');
  const set = sets.find((item) => item.id === selected);
  return (
    <div className="learning-lab files-page">
      <header className="lab-header">
        <a href="/">CPMS placement portal</a>
        <a href="/case-study">Five combined case studies</a>
      </header>
      <main className="files-main">
        <p className="lab-eyebrow">YOUR THREE SUBMISSION SETS</p>
        <h1>Basic programs. Combined case studies. Complete project.</h1>
        <p>
          Choose a set, expand its folders, then select a file to read or copy
          its code.
        </p>
        <nav className="files-sets" aria-label="Submission sets">
          {sets.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={selected === item.id}
              onClick={() => select(item.id)}
            >
              <strong>{item.title}</strong>
              <span>{item.count}</span>
              <span>{item.description}</span>
            </button>
          ))}
        </nav>
        <p>
          <a href={set.href}>{set.action} →</a>
        </p>
        <p>
          Generate the matching folders in{' '}
          <code>src/CPMS-React/submission/deliverables/</code> with{' '}
          <code>npm run submission</code> inside CPMS. Open that folder’s README for
          setup and observation guides. The 25 individual placement examples in
          the syllabus lab are supplementary references.
        </p>
        <SourceBrowser key={set.id} set={set} />
      </main>
    </div>
  );
}
