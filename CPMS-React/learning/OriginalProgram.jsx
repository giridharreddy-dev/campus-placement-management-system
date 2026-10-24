import originals from './original/manifest.json';
import SourceCode from './SourceCode';

const previews = import.meta.glob('./original/previews/*.html', {
  eager: true,
  query: '?url',
  import: 'default',
});

export default function OriginalProgram({ lesson }) {
  const program = originals.programs[lesson.id];
  const preview = previews[`./original/previews/${lesson.id}.html`];
  const server = lesson.unit === 4 || lesson.id === '5e';
  const port = lesson.id === '5e' ? 3001 : 3000;
  const directory = `src/Experiments${lesson.unit}/${lesson.id}`;
  return (
    <>
      <section className="lab-panel" aria-label="Program output">
        <div className="lab-panel-heading">
          <h3>Your basic program</h3>
          <span>
            {lesson.unit === 5
              ? 'New observation program'
              : 'From your original lab files'}
          </span>
        </div>
        <p>
          {lesson.unit === 1
            ? 'Source: Desktop/FSD/Experiment-1.'
            : `Source: src/Experiments${lesson.unit}.`}{' '}
          The code below matches those files
          {lesson.id === '4e' ? ', with the database password hidden' : ''}.
        </p>
        {preview && (
          <iframe
            className="lab-original-output"
            title={`${lesson.id} basic output`}
            sandbox="allow-scripts allow-forms"
            src={preview}
          />
        )}
        {lesson.unit === 1 && (
          <p>
            Console messages and alerts are easiest to observe by opening your
            original index.html in a browser and pressing F12. The embedded
            preview blocks alert dialogs.
          </p>
        )}
        {lesson.id === '1e' && (
          <p>
            The corrected addition expression uses <code>a+b</code> and returns
            25. Assignment (<code>a=b</code>) would replace a with b instead.
          </p>
        )}
        {lesson.id === '3b' && (
          <p>
            Your original fetch uses JSONPlaceholder and requires internet
            access. Its own loading and error messages are preserved.
          </p>
        )}
        {server && (
          <>
            <p>
              From the placement-dashboard root, start this individual program:
            </p>
            <pre>node {directory}/server.js</pre>
            <p>Run one Experiment 4 server at a time: they share port 3000.</p>
            <a
              href={`http://127.0.0.1:${port}/${lesson.id === '4d' || lesson.id === '4e' ? 'applications' : lesson.id === '5e' ? 'students' : ''}`}
              target="_blank"
              rel="noreferrer"
            >
              Open original experiment {lesson.id} ↗
            </a>
            {lesson.id === '4e' && (
              <p>
                This original program uses your local cpms_db. Set up that
                database separately before running it; the website does not
                start this server.
              </p>
            )}
          </>
        )}
        {lesson.unit === 5 && (
          <>
            <p>
              Use the separate practice database <code>fsd_lab5</code>. Run 5a,
              then 5b, before 5c or 5d. In MySQL Command Line Client, from the
              repository root:
            </p>
            <pre>
              SOURCE src/Experiments5/
              {lesson.id === '5e'
                ? '5e/database/database.sql'
                : lesson.id + '.sql'}
              ;
            </pre>
            {lesson.id === '5d' && (
              <p>
                In Workbench, create a new query tab, save it as 5d.sql, reopen
                it with File → Open SQL Script, then execute using the lightning
                button.
              </p>
            )}
            {lesson.id === '5e' && (
              <p>
                Copy 5e/.env.example to 5e/.env and enter your local MySQL
                credentials before starting the server. See
                src/Experiments5/README.md for all observation outputs.
              </p>
            )}
          </>
        )}
      </section>
      <section className="lab-panel">
        <h3>Source code</h3>
        <p>
          Current basic-program file paths are shown below, with readable
          formatting. React previews keep each program’s CSS
          inside its own frame.
        </p>
        {program.files.map((file) => (
          <details key={file.origin} open={program.files.length === 1}>
            <summary>{file.origin}</summary>
            {file.redacted && (
              <p>
                Database password hidden in this copy. Your original file is
                unchanged.
              </p>
            )}
            <SourceCode
              code={file.formattedCode || file.code}
              fileName={file.origin}
            />
          </details>
        ))}
      </section>
    </>
  );
}
