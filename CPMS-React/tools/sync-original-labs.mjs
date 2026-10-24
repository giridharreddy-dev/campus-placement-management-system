// Read the student's lab files without modifying them. Bundle isolated previews
// so the CPMS submission also works when the original folders are unavailable.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import react from '@vitejs/plugin-react';
import { format } from 'prettier';
import { getFsdLabRoot } from './original-lab-paths.mjs';

const cpms = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repository = path.resolve(cpms, '../..');
const fsd = getFsdLabRoot();
const destination = path.join(cpms, 'learning/original');
await fs.mkdir(path.join(destination, 'previews'), { recursive: true });
const manifestPath = path.join(destination, 'manifest.json');
let previous = {};
try { previous = JSON.parse(await fs.readFile(manifestPath, 'utf8')); } catch { /* First synchronization. */ }
const hash = (content) => createHash('sha256').update(content).digest('hex');
const programs = {};
const labels = ['a', 'b', 'c', 'd', 'e'];
async function walk(directory, prefix = '') {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const result = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name.startsWith('.') && entry.name !== '.env.example') continue;
    const relative = prefix + entry.name;
    if (entry.isDirectory()) result.push(...await walk(path.join(directory, entry.name), relative + '/'));
    else if (/\.(jsx|css|js|html|sql)$/.test(entry.name) || entry.name === '.env.example') result.push(relative);
  }
  return result;
}
for (let unit = 1; unit <= 5; unit++) {
  for (const letter of labels) {
    const id = `${unit}${letter}`;
    const directory = unit === 1 ? path.join(fsd, `Experiment-1/${id}`) : path.join(repository, `src/Experiments${unit}`, unit >= 4 ? (unit === 5 && letter !== 'e' ? '' : id) : '');
    let names;
    try {
      names = unit === 2 ? [`${id}.jsx`, `${id}.module.css`] : unit === 3 ? [`${id}.jsx`, `${id}.css`] : unit === 5 && letter !== 'e' ? [`${id}.sql`] : await walk(directory);
      const files = [];
      for (const name of names) {
        const raw = await fs.readFile(path.join(directory, name), 'utf8');
        const code = id === '4e' && name === 'db.js' ? raw.replace(/(password\s*:\s*)(["'])(.*?)\2/, '$1"YOUR_MYSQL_PASSWORD"') : raw;
        const origin = unit === 1 ? `FSD/Experiment-1/${id}/${name}` : `src/Experiments${unit}/${unit >= 4 && !(unit === 5 && letter !== 'e') ? id + '/' : ''}${name}`;
        const parser = { '.html': 'html', '.jsx': 'babel', '.js': 'babel', '.css': 'css' }[path.extname(name)];
        const formattedCode = parser ? await format(code, { parser, tabWidth: 2, printWidth: 80, singleQuote: true, htmlWhitespaceSensitivity: 'ignore' }) : code;
        files.push({ name, origin, code, formattedCode, sha256: hash(raw), redacted: code !== raw });
      }
      const fingerprint = hash('production-preview-v3:' + JSON.stringify(files.map(({ name, code }) => ({ name, code }))));
      programs[id] = { id, files, fingerprint };
      if (unit <= 3) {
        const previewPath = path.join(destination, `previews/${id}.html`);
        const cached = previous.programs?.[id]?.fingerprint === fingerprint;
        if (cached && await fs.access(previewPath).then(() => true, () => false)) continue;
        let html;
        if (unit === 1) {
          html = files.find((file) => file.name === 'index.html').code.replace(/<script\s+src=["']script\.js["']\s*><\/script>/i, () => `<script>${files.find((file) => file.name === 'script.js').code.replace(/<\/script/gi, '<\\/script')}</script>`);
        } else {
          const temporary = path.join(cpms, `.verification/original-${id}.jsx`);
          await fs.mkdir(path.dirname(temporary), { recursive: true });
          const entry = path.join(directory, names[0]).replaceAll('\\', '/');
          await fs.writeFile(temporary, `import React from 'react';\nimport {createRoot} from 'react-dom/client';\nimport Program from ${JSON.stringify(entry)};\ncreateRoot(document.getElementById('root')).render(<Program />);\n`);
          const result = await build({ configFile: false, root: cpms, resolve: { dedupe: ['react', 'react-dom'] }, plugins: [react()], define: { 'process.env.NODE_ENV': '"production"' }, logLevel: 'error', build: { write: false, minify: true, lib: { entry: temporary, name: 'OriginalLabPreview', formats: ['iife'] } } });
          const output = (Array.isArray(result) ? result[0] : result).output;
          const js = output.filter((item) => item.type === 'chunk').map((item) => item.code).join('\n').replace(/<\/script/gi, '<\\/script');
          const css = output.filter((item) => item.type === 'asset' && item.fileName.endsWith('.css')).map((item) => item.source).join('\n');
          html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Original experiment ${id}</title><style>${css}</style></head><body><div id="root"></div><script>${js}</script></body></html>`;
        }
        await fs.writeFile(previewPath, html);
      }
    } catch (error) {
      if (error.code === 'ENOENT' && previous.programs?.[id]) {
        programs[id] = previous.programs[id];
        console.log(`${id}: original folder unavailable; keeping the packaged snapshot.`);
      } else throw error;
    }
  }
}
await fs.writeFile(manifestPath, JSON.stringify({ description: 'Student original lab sources; only the 4e database password is hidden.', programs }, null, 2) + '\n');
try { await fs.copyFile(path.join(repository, 'src/Experiments5/README.md'), path.join(destination, 'observation-5.md')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
console.log(`Synchronized ${Object.keys(programs).length} original programs. Experiments 1–4 were read only.`);
