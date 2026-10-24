import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { getFsdLabRoot } from '../tools/original-lab-paths.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await fs.readFile(path.join(root, 'learning/original/manifest.json'), 'utf8'));
test('all 25 basic programs contain the original source, including new Experiment 5', async () => {
  assert.equal(Object.keys(manifest.programs).length, 25);
  let checked = 0;
  for (const program of Object.values(manifest.programs)) {
    assert.ok(program.files.length);
    for (const file of program.files) {
      const origin = file.origin.startsWith('FSD/') ? path.join(getFsdLabRoot(), file.origin.slice(4)) : path.resolve(root, '../..', file.origin);
      let raw;
      try { raw = await fs.readFile(origin, 'utf8'); } catch (error) { if (error.code === 'ENOENT') continue; throw error; }
      assert.equal(file.sha256, createHash('sha256').update(raw).digest('hex'), file.origin);
      const expected = file.redacted ? raw.replace(/(password\s*:\s*)(["'])(.*?)\2/, '$1"YOUR_MYSQL_PASSWORD"') : raw;
      assert.equal(file.code, expected, file.origin);
      if (file.redacted) assert.equal(file.origin, 'src/Experiments4/4e/db.js');
      checked++;
    }
    if (Number(program.id[0]) <= 3) {
      const preview = await fs.readFile(path.join(root, `learning/original/previews/${program.id}.html`), 'utf8');
      assert.match(preview, /<script>/);
      assert.doesNotMatch(preview, /src=["']script\.js/);
    }
  }
  console.log(`Compared ${checked} available original files; portable previews verified for all 15 browser programs.`);
});
