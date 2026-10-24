import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { combinedExperiments } from '../case-study/catalog.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const programs = {
  1: ['experiment1/index.html', 'experiment1/script.js'],
  2: ['experiment2/PreparationPlanner.jsx'],
  3: ['experiment3/ApplicationDesk.jsx'],
  4: ['experiment4/app.js', 'experiment4/server.js', 'experiment4/index.html'],
  5: ['experiment5/database/database.sql'],
};
let guide =
  '# CPMS combined case studies: observation record\n\nFive programs, each combining parts a–e of one experiment. They describe a single campus placement workflow. Use these five combined programs for your case-study observation; your original basic programs and the 25 individual concept examples remain available separately.\n\n';
guide +=
  '## Shared Windows setup\n\nFrom the placement-dashboard repository root, run:\n\n```powershell\nnode src/CPMS-React/tools/initialize-case-study.mjs --initialize-case-study\nnode src/CPMS-React/case-study/experiment4/server.js\n```\n\nThe initializer creates only a new cpms_case_study database and a scoped local account. It refuses an existing database/account/configuration. Its password stays in the excluded case-study/.env. From an extracted CPMS ZIP, use npm ci, npm run db:case-study and npm run case:server instead. Configure the administrator connection in the CPMS .env first, as explained in README.md.\n\nOpen http://127.0.0.1:5173/case-study. Experiments 1 and 2 need no database. Experiments 3–5 share the separate MySQL database and port-5020 service. The signed-in student portal also uses the exact Experiment 2 preparation component.\n\nFor the manual SQL exercise, open MySQL Command Line Client from the repository root and use SOURCE src/CPMS-React/case-study/experiment5/database/database.sql; or open, save and execute that same file in Workbench. From the standalone CPMS folder use SOURCE case-study/experiment5/database/database.sql;. Re-running the script can restore its named sample records; it does not reset the full CPMS portal. Initial expected reports below assume only the supplied sample rows.\n\n';
let record = guide;
const sizes = [];
for (const experiment of combinedExperiments) {
  const section = `## Experiment ${experiment.id}: ${experiment.title}\n\n**Case study:** ${experiment.scenario}\n\n**Aim:** ${experiment.aim}\n\n**Coverage:**\n\n${experiment.coverage.map((item) => '- ' + item).join('\n')}\n\n**Algorithm:**\n\n${experiment.steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}\n\n**Run:** ${experiment.run}\n\n**Expected output:**\n\n${experiment.outputs.map((output) => '- ' + output).join('\n')}\n\n**Actual observation:** Write your own output and attach screenshots after running this program.\n\n**Result:** ${experiment.result}\n\n**Project connection:** ${experiment.connection}\n\n`;
  guide +=
    section +
    '**Program files to write:** ' +
    programs[experiment.id].map((name) => `case-study/${name}`).join(', ') +
    '.\n\n';
  record += section;
  let lines = 0;
  for (const name of programs[experiment.id]) {
    const source = await fs.readFile(path.join(root, 'case-study', name), 'utf8');
    lines += source.trim().split('\n').length;
    const extension = path.extname(name).slice(1);
    record += `### case-study/${name}\n\n\`\`\`${extension}\n${source.trim()}\n\`\`\`\n\n`;
  }
  sizes.push(
    `Experiment ${experiment.id}: ${lines} formatted lines across ${programs[experiment.id].length} file(s)`,
  );
}
const topics =
  '\n## Other mandatory topics and portfolio features\n\n- Experiment 1: spread/rest for role labels, array/object destructuring, Number conversion/type coercion, template literals and a function declaration referenced before its definition (hoisting).\n- Experiments 2–3: JSX, component composition and state updates. React reconciles render output and updates the real DOM; Experiment 1 changes native DOM nodes directly.\n- Node.js is the server runtime; Express supplies HTTP routing; mysql2 connects the backend to MySQL. Import/export follows ES modules with type: module.\n- MVC: learning/server/controllers and models demonstrate separation; do not describe the short combined Express app as a full MVC refactor.\n- Microservices: learning/server/advice-service.mjs is a separate process called by the teaching API. Start both services and use http://127.0.0.1:5010/case/architecture.\n- MySQL configuration: Windows service, port, CLI/Workbench and environment setup are explained in README.md and case-study/.env.example.\n- The complete portal goes further: three roles, hashed passwords, cookie sessions, backend ownership checks, company CRUD, application progression, dashboard totals and transactions.\n\nThe observation contains the case-study programs above. Automated verification files under tests/ are separate and do not belong in your observation.\n';
guide += topics;
record += topics;
await fs.writeFile(path.join(root, 'case-study/OBSERVATION.md'), guide);
await fs.mkdir(path.join(root, 'submission'), { recursive: true });
await fs.writeFile(path.join(root, 'submission/COMBINED_CASE_STUDIES.md'), record);
console.log(
  'Exported five combined case-study programs and their short observation guide.\n' +
    sizes.join('\n'),
);
