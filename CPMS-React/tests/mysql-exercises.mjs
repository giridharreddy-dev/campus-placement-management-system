// Explicit integration check after initializing the syllabus databases.
// Uses the SELECT-only teaching account, never the portal database.
import dotenv from 'dotenv';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { syllabusPool } from '../learning/server/database/db.mjs';
import { createTeachingApp } from '../learning/server/app.mjs';

dotenv.config({ path: new URL('../learning/server/.env', import.meta.url), quiet: true });
let checks = 0;
for (const mode of ['basic', 'case']) {
  const db = syllabusPool(mode);
  try {
    const [selected] = await db.query('SELECT DATABASE() AS name');
    assert.equal(selected[0].name, `cpms_syllabus_${mode}`); checks++;
    for (const table of ['students', 'companies', 'applications']) {
      const [rows] = await db.query(`SELECT COUNT(*) AS total FROM ${table}`);
      assert.equal(rows[0].total, table === 'students' ? 3 : 2); checks++;
    }
    for (const [experiment, counts] of [['5c', [2, 2, 2]], ['5d', [2, 2]]]) {
      const sql = (await readFile(new URL(`../learning/${mode}/${experiment}.sql`, import.meta.url), 'utf8')).replace(/^--.*$/gm, '');
      const queries = sql.split(';').map((query) => query.trim()).filter((query) => query && !/^USE\s/i.test(query));
      for (const [index, query] of queries.entries()) { const [rows] = await db.query(query); assert.equal(rows.length, counts[index]); checks++; }
    }
    const [aboveAverage] = await db.query('SELECT id FROM students WHERE cgpa > (SELECT AVG(cgpa) FROM students) ORDER BY id');
    assert.deepEqual(aboveAverage.map((row) => row.id), [1, 2]); checks++;
    const [grants] = await db.query('SHOW GRANTS');
    const grantText = JSON.stringify(grants);
    assert.match(grantText, /GRANT SELECT ON/); assert.doesNotMatch(grantText, /ALL PRIVILEGES|GRANT INSERT|GRANT UPDATE|GRANT DELETE/); checks++;
  } finally { await db.end(); }
}
const app = await createTeachingApp();
const server = app.listen(0, '127.0.0.1');
await new Promise((resolve) => server.once('listening', resolve));
try {
  for (const mode of ['basic', 'case']) {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/${mode}/4e`);
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.database, `cpms_syllabus_${mode}`); assert.equal(data.students.length, 3); checks++;
  }
} finally { await new Promise((resolve) => server.close(resolve)); }
console.log(`MySQL integration: ${checks} checks passed. Both 4e routes and every 5c/5d query succeeded with SELECT-only credentials.`);
