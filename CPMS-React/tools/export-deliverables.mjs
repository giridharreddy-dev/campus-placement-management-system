import fs from 'node:fs';
import path from 'node:path';
import { combinedExperiments } from '../case-study/catalog.js';
import { lessons } from '../learning/catalog.js';

// Regenerate copies from the canonical sources; never move or edit originals.
export function exportDeliverables(root, originals, projectRecords) {
  const entries = [];
  function add(relative, content) {
    entries.push({
      relative,
      content: Buffer.isBuffer(content) ? content : Buffer.from(content),
    });
  }
  add(
    'README.md',
    `# Three FSD–II submission sets\n\nOpen [the folder explorer](http://127.0.0.1:5173/project-files) while CPMS is running. Each set below has its own folders and setup guide.\n\n1. **[Basic programs](01-basic-programs/README.md): 25 separate programs.** Experiment-1 through Experiment-5, each with a, b, c, d and e subfolders. These are copies of your original basic files; the 4e password is masked.\n2. **[Combined case studies](02-combined-case-studies/README.md): five programs.** Each Experiment-N combines its own a–e in one placement feature. Use the observation guide and source record for your notebook.\n3. **[Complete CPMS](03-complete-project/CPMS/README.md): one working project.** Experiments 1–5, their subparts, the portal and the supporting syllabus material are together in this codebase. The source map is [SYLLABUS.md](03-complete-project/CPMS/SYLLABUS.md).\n\nThe 25 separate placement examples under the complete project's learning/case folder are supplementary references. Your second submission is the five combined programs.\n\nFor basic/combined Node servers copied into sets 1 and 2, open PowerShell here and run npm install once. This root package enables ES module import syntax and supplies Express, mysql2 and dotenv. React components run through the complete project's website. The complete project has its own package-lock.json: follow its README and use npm ci inside 03-complete-project/CPMS.\n\nGenerated with npm run submission from src/CPMS-React. Edit the canonical CPMS files or your original basic files, then regenerate these copies.\n`,
  );
  const pkg = JSON.parse(
    fs.readFileSync(path.join(root, 'package.json'), 'utf8'),
  );
  add(
    'package.json',
    JSON.stringify(
      {
        name: 'cpms-three-submission-sets',
        private: true,
        version: '1.0.0',
        type: 'module',
        dependencies: Object.fromEntries(
          ['express', 'mysql2', 'dotenv'].map((name) => [
            name,
            pkg.dependencies[name],
          ]),
        ),
      },
      null,
      2,
    ) + '\n',
  );
  let basicIndex =
    '# Set 1: basic programs\n\n25 individual questions, grouped into five experiments. Copies preserve original source, apart from the masked 4e password. Website source display and the observation source record use formatted copies.\n\n';
  for (let unit = 1; unit <= 5; unit++) {
    basicIndex += `- [Experiment ${unit}](Experiment-${unit}/README.md): a–e\n`;
    let index = `# Basic Experiment ${unit}\n\n`;
    for (const lesson of lessons.filter((item) => item.unit === unit)) {
      const folder = `01-basic-programs/Experiment-${unit}/${lesson.id[1]}`;
      const program = originals.programs[lesson.id];
      index += `- [${lesson.id}: ${lesson.title}](${lesson.id[1]}/README.md)\n`;
      for (const file of program.files)
        add(`${folder}/${file.name}`, file.code);
      const run =
        unit === 1
          ? 'Open index.html in your browser; press F12 to inspect console output.'
          : unit <= 3
            ? 'Use the Basic program tab in the complete project at /syllabus?mode=basic. The JSX and CSS here are your source components; Vite in the complete project supplies the React preview.'
            : unit === 4
              ? `From the deliverables root, run npm install once, then node 01-basic-programs/Experiment-4/${lesson.id[1]}/server.js. Only one original server can use port 3000 at a time. For 4e configure the masked database credentials in this copy and initialize its cpms_db database.`
              : lesson.id === '5e'
                ? 'From the deliverables root, run npm install once. Copy this folder’s .env.example to .env and configure MySQL. Execute database/database.sql in Workbench, then run node 01-basic-programs/Experiment-5/e/server.js (port 3001).'
                : 'Execute the SQL file in MySQL CLI or Workbench. Run 5a then 5b before 5c/5d. Use the separate fsd_lab5 database. For 5d also demonstrate opening, saving and executing the script in Workbench.';
      add(
        `${folder}/README.md`,
        `# Basic ${lesson.id}: ${lesson.title}\n\n${run}\n\n## Source files\n\n${program.files.map((file) => `- [${file.name}](${file.name}) — copied from ${file.origin}`).join('\n')}\n\n${lesson.id === '1e' ? 'The corrected expression uses a+b and returns 25.\n' : ''}`,
      );
    }
    add(`01-basic-programs/Experiment-${unit}/README.md`, index);
  }
  basicIndex +=
    '\n[Formatted source record](BASIC_PROGRAMS.md) · [Experiment 5 observation guide](OBSERVATION-5.md)\n';
  add('01-basic-programs/README.md', basicIndex);
  add(
    '01-basic-programs/BASIC_PROGRAMS.md',
    fs.readFileSync(path.join(root, 'submission/BASIC_PROGRAMS.md')),
  );
  add(
    '01-basic-programs/OBSERVATION-5.md',
    fs.readFileSync(path.join(root, 'learning/original/observation-5.md')),
  );

  add(
    '02-combined-case-studies/README.md',
    `# Set 2: five combined CPMS case-study programs\n\nEach folder is **one experiment combining a–e**, rather than five separate case-study exercises. Experiments 3, 4 and 5 share a React → Express → MySQL registration workflow.\n\n${combinedExperiments.map((item) => `- [Experiment ${item.id}: ${item.title}](Experiment-${item.id}/README.md)`).join('\n')}\n\n[Observation guide](OBSERVATION.md) · [Complete combined source record](COMBINED_CASE_STUDIES.md)\n\nOpen the complete project at /case-study for the five working previews. Experiment 1 also opens directly from its index.html. Experiments 2 and 3 are JSX components; their runnable Vite host is the complete project.\n\nTo run the copied Express service from the deliverables root: npm install; execute Experiment-5/database/database.sql in Workbench; copy this folder's .env.example to .env and configure the case-study MySQL account; then run node 02-combined-case-studies/Experiment-4/server.js. It listens on port 5020 and uses cpms_case_study. If that service/database is already running in your workspace, use it without rerunning initialization.\n\nThe observation record refers to canonical case-study/experimentN paths in the complete project. The equivalent copies here are Experiment-N. Workbench opening/saving/executing the Experiment 5 SQL file is a required demonstration step.\n`,
  );
  add(
    '02-combined-case-studies/.env.example',
    fs.readFileSync(path.join(root, 'case-study/.env.example')),
  );
  for (const item of combinedExperiments) {
    const prefix = `case-study/experiment${item.id}/`;
    const files = projectRecords.filter((file) =>
      file.relative.startsWith(prefix),
    );
    for (const file of files)
      add(
        `02-combined-case-studies/Experiment-${item.id}/${file.relative.slice(prefix.length)}`,
        file.content,
      );
    add(
      `02-combined-case-studies/Experiment-${item.id}/README.md`,
      `# Combined Experiment ${item.id}: ${item.title}\n\n**Aim:** ${item.aim}\n\n${item.scenario}\n\n## All five subparts\n\n${item.coverage.map((concept) => '- ' + concept).join('\n')}\n\n## Program files\n\n${files
        .map((file) => {
          const name = file.relative.slice(prefix.length);
          return `- [${name}](${name})`;
        })
        .join(
          '\n',
        )}\n\n## Algorithm\n\n${item.steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}\n\n## Expected output\n\n${item.outputs.map((line) => '- ' + line).join('\n')}\n\n**Result:** ${item.result}\n\nWrite your actual observation after running it. See the [shared setup](../README.md) and [observation guide](../OBSERVATION.md).\n`,
    );
  }
  for (const [target, origin] of [
    ['OBSERVATION.md', 'case-study/OBSERVATION.md'],
    ['COMBINED_CASE_STUDIES.md', 'submission/COMBINED_CASE_STUDIES.md'],
  ])
    add(
      `02-combined-case-studies/${target}`,
      fs.readFileSync(path.join(root, origin)),
    );
  for (const file of projectRecords)
    add('03-complete-project/CPMS/' + file.relative, file.content);
  for (const entry of entries) {
    const target = path.join(root, 'submission/deliverables', entry.relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, entry.content);
  }
  return entries;
}
