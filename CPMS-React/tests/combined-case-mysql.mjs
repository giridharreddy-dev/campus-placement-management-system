// Explicit MySQL check. Only its uniquely named database is created/dropped.
import '../backend/env.js';
import mysql from 'mysql2/promise';
import fs from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { once } from 'node:events';
import assert from 'node:assert/strict';
import createPlacementApp from '../case-study/experiment4/app.js';

const database = 'cpms_case_verify_' + randomBytes(8).toString('hex');
const db = await mysql.createConnection({ host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USER, password: process.env.DB_PASSWORD, multipleStatements: true });
let created = false;
let server;
let checks = 0;
try {
  await db.query(`CREATE DATABASE \`${database}\``);
  created = true;
  const sql = await fs.readFile(new URL('../case-study/experiment5/database/database.sql', import.meta.url), 'utf8');
  const [results] = await db.query(sql.replaceAll('cpms_case_study', database));
  const tables = results.filter(Array.isArray);
  assert.deepEqual(tables[1].map((row) => row.name), ['Giri', 'Priya']); checks++;
  assert.deepEqual(tables[2].map((row) => row.name), ['Giri']); checks++;
  assert.deepEqual(tables[3].map((row) => row.name), ['Giri', 'Priya']); checks++;
  server = createPlacementApp(db).listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = (route, method = 'GET', body) => fetch(base + route, { method, ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}) });
  assert.match(await (await request('/')).text(), /console\.log.*Hello World/); checks++;
  const students = await (await request('/students')).json();
  assert.equal(students.length, 3); checks++;
  assert.equal((await (await request('/applications')).json()).length, 2); checks++;
  assert.equal((await request('/applications', 'POST', { studentId: 1, company: ' ' })).status, 400); checks++;
  assert.equal((await request('/applications', 'POST', { studentId: 999, company: 'Unknown student' })).status, 400); checks++;
  const added = await request('/applications', 'POST', { studentId: 1, company: "ACME'); DROP TABLE students; --" });
  assert.equal(added.status, 201); checks++;
  const row = await added.json();
  assert.equal(row.name, 'Giri'); checks++;
  assert.equal((await request(`/applications/${row.id}`, 'PUT', { status: 'Shortlisted' })).status, 200); checks++;
  const [persisted] = await db.execute('SELECT status FROM applications WHERE id = ?', [row.id]);
  assert.equal(persisted[0].status, 'Shortlisted'); checks++;
  assert.equal((await request(`/applications/${row.id}`, 'PUT', { status: 'Unknown' })).status, 400); checks++;
  assert.equal((await request('/applications/not-an-id', 'DELETE')).status, 400); checks++;
  assert.equal((await request('/applications/999999', 'DELETE')).status, 404); checks++;
  assert.equal((await request(`/applications/${row.id}`, 'DELETE')).status, 200); checks++;
  assert.equal((await (await request('/students')).json()).length, 3); checks++;
  assert.equal((await (await request('/applications')).json()).length, 2); checks++;
  console.log(`Combined case study: ${checks} MySQL/API checks passed; subqueries, CRUD persistence, validation and SQL parameterization verified.`);
} finally {
  if (server) { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); }
  if (created) await db.query(`DROP DATABASE \`${database}\``);
  await db.end();
}
