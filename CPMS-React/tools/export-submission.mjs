import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lessons } from '../learning/catalog.js';
import { exportDeliverables } from './export-deliverables.mjs';

await import('./sync-original-labs.mjs');
await import('./export-combined-case-study.mjs');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'submission');
fs.mkdirSync(output, { recursive: true });
const excluded = new Set([
  'node_modules',
  'dist',
  '.verification',
  'submission',
  '.git',
  '.private',
  '__pycache__',
  'original-programs',
]);
function collect(dir, prefix = '') {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) => {
      const relative = prefix + entry.name;
      if (
        excluded.has(entry.name) ||
        (entry.name.startsWith('.env') && entry.name !== '.env.example') ||
        /\.(log|zip|pyc|pem|key|dump|bak)$/i.test(entry.name) ||
        entry.name === 'cpms_source_code.md'
      )
        return [];
      const full = path.join(dir, entry.name);
      return entry.isDirectory()
        ? collect(full, relative + '/')
        : entry.isFile()
          ? [{ relative, content: fs.readFileSync(full) }]
          : [];
    });
}
const files = collect(root);
const originals = JSON.parse(
  fs.readFileSync(path.join(root, 'learning/original/manifest.json'), 'utf8'),
);
const language = (name) =>
  ({
    '.jsx': 'jsx',
    '.js': 'javascript',
    '.mjs': 'javascript',
    '.sql': 'sql',
    '.html': 'html',
    '.css': 'css',
    '.json': 'json',
    '.py': 'python',
    '.md': 'markdown',
  })[path.extname(name)] || 'text';
function code(file) {
  const content = file.content.toString('utf8');
  const longest = Math.max(
    3,
    ...[...content.matchAll(/`+/g)].map((match) => match[0].length),
  );
  const fence = '`'.repeat(longest + 1);
  return `\n### ${file.relative}\n\n${fence}${language(file.relative)}\n${content}\n${fence}\n`;
}
const expected = {
  '1a': 'The linked script replaces the loading heading with a welcome message.',
  '1b': 'The output reports two selected items and one button, plus the first item text.',
  '1c': 'Typing a name updates the greeting immediately.',
  '1d': 'Clicking the button replaces the status text.',
  '1e': 'The three buttons show a declaration result, expression result and arrow result.',
  '2a': 'Increase, decrease and reset update class state; the count stays nonnegative.',
  '2b': 'Buttons update functional component state without reloading the page.',
  '2c': 'The selected action updates the status message.',
  '2d': 'The button alternates between the two UI branches.',
  '2e': 'The heading and interpolated welcome text appear.',
  '3a': 'useState updates the visible count; reset returns it to zero.',
  '3b': 'The Express API returns two rows; loading/error states cover unavailable responses.',
  '3c': 'The child displays the name and branch received through props.',
  '3d': 'Valid name, email and CGPA produce a preview; native form validation rejects invalid inputs.',
  '3e': 'Two records are rendered as keyed list items.',
  '4a': 'The browser route returns Hello World.',
  '4b': 'Home, Students and Companies links open distinct Express routes.',
  '4c': 'F12 → Console shows Hello World logged by the served page script.',
  '4d': 'POST returns 201; GET reads records; PUT changes a record; DELETE removes it. Invalid input returns 400 and missing records return 404.',
  '4e': 'After separate database setup, JSON contains the syllabus database name and three student rows.',
  '5a': 'SHOW TABLES includes students in the separate syllabus database.',
  '5b': 'The two practice application records are returned; application 1 is Shortlisted.',
  '5c': 'With the supplied 5b seed, the above-average and IN queries return students 1 and 2; EXISTS returns companies 1 and 2.',
  '5d': 'Workbench displays two joined application rows and totals grouped by status.',
  '5e': 'Initialization selects the syllabus database and counts three students.',
};
let basicRecord =
  '# Basic FSD–II programs: original student files\n\nExperiments 1–4 are your existing files. Experiment 5 was added in src/Experiments5 for your observation record. These copies reflect the current basic-program folders, including the requested short Experiment 2 filenames and verified corrections. The database password is hidden only in exported copies of 4e/db.js. The printed Word record is unchanged.\n\nRun HTML and React previews with the Basic program tab at /syllabus. React previews bundle the original component and its CSS without changing their behavior. For console logs and alerts, open the original HTML directly and press F12. Experiment 3b uses JSONPlaceholder and needs internet access.\n\nIn the repository, run Express with node src/Experiments4/4a/server.js (substitute the question); run one server at a time on port 3000. For 5e use node src/Experiments5/5e/server.js on port 3001. See the Experiment 5 observation guide below for SQL order and expected outputs.\n\nThe ZIP contains portable copies in original-programs/<question>/. From the extracted CPMS directory run node original-programs/4a/server.js, or node original-programs/5e/server.js after configuring its .env and database. Run the SQL copies in Workbench: 5a, 5b, then 5c/5d; 5e/database/database.sql initializes the API sample.\n\n';
for (const lesson of lessons) {
  const program = originals.programs[lesson.id];
  if (!program?.files.length) throw new Error(`Missing original ${lesson.id}`);
  basicRecord += `## Experiment ${lesson.id}: ${lesson.title}\n\n`;
  if (lesson.id === '1e')
    basicRecord +=
      'Observation: the corrected addition expression uses a+b and returns 25.\n\n';
  for (const file of program.files)
    basicRecord += code({
      relative: file.origin,
      content: Buffer.from(file.formattedCode || file.code),
    });
}
basicRecord +=
  '\n## Experiment 5 observation guide\n\n' +
  fs.readFileSync(
    path.join(root, 'learning/original/observation-5.md'),
    'utf8',
  );
fs.writeFileSync(path.join(output, 'BASIC_PROGRAMS.md'), basicRecord);
for (const mode of ['case']) {
  let text = `# ${mode === 'basic' ? 'Basic FSD–II programs' : 'CPMS individual case-study programs'}\n\nAll 25 syllabus questions. These are executable teaching programs, separate from the original Word record. See README.md for Windows setup and SYLLABUS.md for additional mandatory topics.\n\n`;
  text +=
    'React: use the component as App in Vite, or choose it in the /syllabus website. HTML: open index.html from its folder. Express: start learning/server/start.mjs; the small routers below are mounted by that server. SQL: run 5a before 5b, then 5c/5d; 5e documents SOURCE initialization. All sample data is practice data.\n\n';
  for (const lesson of lessons) {
    const prefix = `learning/${mode}/${lesson.id}`;
    const programFiles = files.filter(
      (file) =>
        file.relative.startsWith(prefix + '/') ||
        file.relative === prefix + '.jsx' ||
        file.relative === prefix + '.mjs' ||
        file.relative === prefix + '.sql',
    );
    if (!programFiles.length)
      throw new Error(`Missing source for ${mode}/${lesson.id}`);
    const run =
      lesson.unit === 1
        ? `Open ${prefix}/index.html or choose ${lesson.id} in /syllabus.`
        : lesson.unit < 4
          ? `Choose ${lesson.id} in /syllabus (${mode === 'case' ? 'CPMS case study' : 'Basic program'}).`
          : lesson.unit === 4
            ? `node src/CPMS-React/learning/server/start.mjs; open http://127.0.0.1:5010/${mode}/${lesson.id}. For 4d, use the website playground or PowerShell Invoke-RestMethod; see shared server source below.`
            : `Open ${prefix}.sql in MySQL Workbench, or use SOURCE from the MySQL CLI. Follow README setup order.`;
    text += `## Experiment ${lesson.id}: ${lesson.title}\n\n**Aim:** ${lesson.title}.\n\n${mode === 'case' ? `**Placement use:** ${lesson.usage}\n\n` : ''}**Run:** ${run}\n\n**Expected output:** ${expected[lesson.id]}\n\n**Complete-project connection:** src/CPMS-React/${lesson.project}.\n`;
    text += programFiles.map(code).join('');
  }
  text +=
    '\n## Shared runnable Express/MVC server and MySQL driver\n\nCopy these files with the experiment routers; preserve the folder layout. The main website is the view, routers map requests, controllers validate, and the model stores practice records.\n';
  text += files
    .filter(
      (file) =>
        file.relative.startsWith('learning/server/') &&
        !file.relative.endsWith('.env.example'),
    )
    .map(code)
    .join('');
  text +=
    '\n## Additional syllabus topics: ES6, DOM reconciliation and architecture\n\nSee SYLLABUS.md for explanations of DOM vs Virtual DOM, JSX, Node runtime, MVC and microservices. Start the advice service separately to demonstrate communication and failure handling.\n';
  text += files
    .filter((file) => file.relative === 'learning/ModernJavaScript.jsx')
    .map(code)
    .join('');
  fs.writeFileSync(
    path.join(
      output,
      mode === 'basic' ? 'BASIC_PROGRAMS.md' : 'CASE_STUDY_PROGRAMS.md',
    ),
    text,
  );
}
fs.writeFileSync(
  path.join(output, 'COMPLETE_PROJECT_CODE.md'),
  '# Complete CPMS Stage 1 source\n\nGenerated from current source files. Environment secrets, dependencies, build outputs and previous dumps are excluded. README.md explains both the existing-repository and standalone setup.\n\n## File index\n\n' +
    files.map((file) => `- ${file.relative}`).join('\n') +
    '\n' +
    files.map(code).join(''),
);

// Standard, uncompressed ZIP format keeps export portable without a ZIP library.
function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++)
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
const originalFiles = Object.values(originals.programs).flatMap((program) =>
  program.files.map((file) => ({
    relative: `original-programs/${program.id}/${file.name}`,
    content: Buffer.from(file.code),
  })),
);
const records = [
  ...files,
  ...originalFiles,
  ...[
    'BASIC_PROGRAMS.md',
    'CASE_STUDY_PROGRAMS.md',
    'COMBINED_CASE_STUDIES.md',
    'COMPLETE_PROJECT_CODE.md',
  ].map((name) => ({
    relative: 'submission/' + name,
    content: fs.readFileSync(path.join(output, name)),
  })),
];
function writeZip(records, filename, prefix) {
  const chunks = [];
  const directory = [];
  let offset = 0;
  for (const file of records) {
    const name = Buffer.from(prefix + '/' + file.relative);
    const crc = crc32(file.content);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x800, 6);
    local.writeUInt16LE(33, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(file.content.length, 18);
    local.writeUInt32LE(file.content.length, 22);
    local.writeUInt16LE(name.length, 26);
    chunks.push(local, name, file.content);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x800, 8);
    central.writeUInt16LE(33, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(file.content.length, 20);
    central.writeUInt32LE(file.content.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    directory.push(central, name);
    offset += local.length + name.length + file.content.length;
  }
  const central = Buffer.concat(directory);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50);
  end.writeUInt16LE(records.length, 8);
  end.writeUInt16LE(records.length, 10);
  end.writeUInt32LE(central.length, 12);
  end.writeUInt32LE(offset, 16);
  fs.writeFileSync(
    path.join(output, filename),
    Buffer.concat([...chunks, central, end]),
  );
}
writeZip(records, 'CPMS_STAGE1.zip', 'CPMS');
const deliverables = exportDeliverables(root, originals, records);
writeZip(deliverables, 'CPMS_THREE_SETS.zip', 'CPMS_DELIVERABLES');
console.log(
  `Exported three organised sets: 25 basic programs, 5 combined case studies and 1 complete CPMS project. Standalone ZIP: ${records.length} files; three-set ZIP: ${deliverables.length} files. No .env secrets included.`,
);
