import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createTeachingApp } from '../learning/server/app.mjs';
import { syllabusPool } from '../learning/server/database/db.mjs';
import { createServer } from 'node:http';

let server;
let base;
before(async () => {
  const app = await createTeachingApp();
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise((resolve) => server.close(resolve)));
async function request(path, method = 'GET', body) {
  return fetch(base + path, { method, headers: { 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
}

for (const mode of ['basic', 'case']) {
  test(`${mode}: browser routes and fetched data are usable`, async () => {
    assert.match(await (await request(`/${mode}/4a`)).text(), /Hello World/);
    for (const suffix of ['', '/students', '/companies']) {
      const result = await request(`/${mode}/4b${suffix}`);
      assert.equal(result.status, 200);
      assert.match(result.headers.get('content-type'), /text\/html/);
      assert.match(await result.text(), /<nav>/);
    }
    assert.match(await (await request(`/${mode}/4c`)).text(), /<script>console.log\(/);
    const rows = await (await request(`/${mode}/3b`)).json();
    assert.equal(rows.length, 2);
    assert.equal(new Set(rows.map((row) => row.id)).size, rows.length);
  });
  test(`${mode}: CRUD persists within the sandbox and uses non-reused IDs`, async () => {
    const path = `/${mode}/4d`;
    assert.deepEqual(await (await request(path)).json(), []);
    const create = await request(path, 'POST', { studentName: ' Giri ', company: ' Practice Ltd ' });
    assert.equal(create.status, 201);
    const row = await create.json();
    assert.equal(row.studentName, 'Giri');
    assert.equal(row.status, 'Applied');
    assert.equal((await (await request(`${path}/${row.id}`)).json()).company, 'Practice Ltd');
    const update = await request(`${path}/${row.id}`, 'PUT', { studentName: 'Giri', company: 'Practice Ltd', status: 'Shortlisted' });
    assert.equal(update.status, 200);
    assert.equal((await update.json()).status, 'Shortlisted');
    assert.equal((await request(`${path}/${row.id}`, 'DELETE')).status, 200);
    assert.equal((await request(`${path}/${row.id}`)).status, 404);
    const next = await (await request(path, 'POST', { studentName: 'Priya', company: 'Practice Ltd' })).json();
    assert.ok(next.id > row.id);
    await request(`${path}/${next.id}`, 'DELETE');
  });
  test(`${mode}: invalid payloads and missing records are rejected`, async () => {
    const path = `/${mode}/4d`;
    for (const body of [null, [], {}, { studentName: ' ', company: 'Test' }, { studentName: 4, company: 'Test' }, { studentName: 'A'.repeat(101), company: 'Test' }, { studentName: 'Test', company: 'Test', status: 'invented' }]) {
      assert.equal((await request(path, 'POST', body)).status, 400);
    }
    for (const id of ['0', '-1', '1abc', '999']) {
      assert.equal((await request(`${path}/${id}`)).status, 404);
      assert.equal((await request(`${path}/${id}`, 'DELETE')).status, 404);
    }
    assert.equal((await request(`${path}/999`, 'PUT', { studentName: 'A', company: 'B' })).status, 404);
  });
}
test('basic and case models are separate', async () => {
  const row = await (await request('/basic/4d', 'POST', { studentName: 'A', company: 'B' })).json();
  assert.deepEqual(await (await request('/case/4d')).json(), []);
  await request(`/basic/4d/${row.id}`, 'DELETE');
});
test('malformed JSON, unknown routes and CORS boundaries are handled', async () => {
  const malformed = await fetch(base + '/case/4d', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad' });
  assert.equal(malformed.status, 400);
  assert.equal((await request('/unknown')).status, 404);
  const allowed = await fetch(base + '/case/3b', { headers: { Origin: 'http://localhost:5173' } });
  assert.equal(allowed.headers.get('access-control-allow-origin'), 'http://localhost:5173');
  const denied = await fetch(base + '/case/3b', { headers: { Origin: 'https://unrelated.example' } });
  assert.equal(denied.headers.get('access-control-allow-origin'), null);
});
test('driver rejects other database modes before creating a pool', () => {
  for (const mode of ['cpms', 'cpms_test', '../cpms', undefined]) assert.throws(() => syllabusPool(mode), /Invalid syllabus/);
});
test('unconfigured MySQL routes return an actionable 503 without revealing credentials', async () => {
  const previous = process.env.SYLLABUS_DB_USER;
  delete process.env.SYLLABUS_DB_USER;
  try {
    const result = await request('/case/4e');
    assert.equal(result.status, 503);
    assert.match((await result.json()).error, /Teaching database unavailable/);
  } finally {
    if (previous === undefined) delete process.env.SYLLABUS_DB_USER;
    else process.env.SYLLABUS_DB_USER = previous;
  }
});
test('service communication handles a live independent service and its failure', async () => {
  const advice = createServer((req, res) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ nextStep: 'Practice SQL' })); });
  advice.listen(0, '127.0.0.1');
  await new Promise((resolve) => advice.once('listening', resolve));
  const app = await createTeachingApp({ adviceUrl: `http://127.0.0.1:${advice.address().port}/advice` });
  const api = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => api.once('listening', resolve));
  try {
    const url = `http://127.0.0.1:${api.address().port}/case/architecture`;
    const live = await fetch(url);
    assert.equal(live.status, 200);
    assert.equal((await live.json()).advice.nextStep, 'Practice SQL');
    await new Promise((resolve) => advice.close(resolve));
    const unavailable = await fetch(url);
    assert.equal(unavailable.status, 503);
    assert.match((await unavailable.json()).error, /Advice service unavailable/);
  } finally {
    if (advice.listening) await new Promise((resolve) => advice.close(resolve));
    await new Promise((resolve) => api.close(resolve));
  }
});
