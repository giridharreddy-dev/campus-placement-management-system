// Explicit integration check: creates and removes only its uniquely named DB.
import '../backend/env.js';
import mysql from 'mysql2/promise';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const originals = JSON.parse(await fs.readFile(path.join(root, 'learning/original/manifest.json'), 'utf8'));
const database = 'fsd_lab5_verify_' + randomBytes(8).toString('hex');
const db = await mysql.createConnection({ host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USER, password: process.env.DB_PASSWORD, multipleStatements: true });
let created = false;
let child;
try {
  await db.query(`CREATE DATABASE \`${database}\``);
  created = true;
  for (const id of ['5a', '5b', '5c', '5d']) {
    const source = originals.programs[id].files.find((file) => file.name.endsWith('.sql')).code;
    const [results] = await db.query(source.replaceAll('fsd_lab5', database));
    if (id === '5c') {
      const tables = results.filter(Array.isArray);
      assert.deepEqual(tables.map((rows) => rows.map((row) => row.name)), [['Giri', 'Priya'], ['Giri', 'Priya'], ['Giri']]);
    }
    if (id === '5d') {
      const tables = results.filter(Array.isArray);
      assert.equal(tables[0].length, 3);
      assert.equal(Number(tables[1][0].average_cgpa), 8.8);
    }
  }
  const files = originals.programs['5e'].files;
  const sql = files.find((file) => file.name === 'database/database.sql').code;
  await db.query(sql.replaceAll('fsd_lab5', database));
  const directory = path.join(root, '.verification', database);
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, 'db.js'), files.find((file) => file.name === 'db.js').code.replace("database: 'fsd_lab5'", `database: '${database}'`));
  const server = files.find((file) => file.name === 'server.js').code.replace('const PORT = 3001;', 'const PORT = 0;').replace("app.listen(PORT, '127.0.0.1'", "const server = app.listen(PORT, '127.0.0.1'").replace('${PORT}', '${server.address().port}');
  await fs.writeFile(path.join(directory, 'server.js'), server);
  child = spawn(process.execPath, [path.join(directory, 'server.js')], { windowsHide: true, env: { ...process.env, FSD_DB_HOST: process.env.DB_HOST || 'localhost', FSD_DB_PORT: process.env.DB_PORT || '3306', FSD_DB_USER: process.env.DB_USER, FSD_DB_PASSWORD: process.env.DB_PASSWORD || '' }, stdio: ['ignore', 'pipe', 'pipe'] });
  const port = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('5e test server startup timed out')), 10000);
    child.stdout.on('data', (chunk) => { const match = String(chunk).match(/127\.0\.0\.1:(\d+)/); if (match) { clearTimeout(timer); resolve(Number(match[1])); } });
    child.once('error', reject);
    child.once('exit', (code) => { if (code) { clearTimeout(timer); reject(new Error('5e test server failed')); } });
  });
  const home = await (await fetch(`http://127.0.0.1:${port}/`)).json();
  assert.equal(home.database, database);
  const students = await (await fetch(`http://127.0.0.1:${port}/students`)).json();
  assert.deepEqual(students.map((student) => student.name), ['Giri', 'Priya', 'Arun']);
  assert.equal(Number(students[1].cgpa), 8.5);
  console.log('Basic MySQL: 5a–5e SQL and both original 5e API routes passed in a temporary database.');
} finally {
  if (child && child.exitCode === null) { const stopped = new Promise((resolve) => child.once('exit', resolve)); child.kill(); await stopped; }
  if (created) await db.query(`DROP DATABASE \`${database}\``);
  await db.end();
}
