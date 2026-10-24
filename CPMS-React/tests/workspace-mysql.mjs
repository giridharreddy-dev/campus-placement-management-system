// All mutations occur in one randomly named, disposable database.
import '../backend/env.js';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import assert from 'node:assert/strict';
import { randomBytes, createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createServer as portAllocator } from 'node:net';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const database = 'cpms_workspace_verify_' + randomBytes(8).toString('hex');
const db = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true,
});
const liveDatabase = process.env.DB_NAME || 'cpms';
const digestLive = async () => {
  const result = {};
  for (const table of ['students', 'companies', 'applications', 'users']) {
    const [rows] = await db.query('SELECT * FROM ?? ORDER BY id', [
      liveDatabase + '.' + table,
    ]);
    result[table] = createHash('sha256')
      .update(JSON.stringify(rows))
      .digest('hex');
  }
  return result;
};
const baseline = await digestLive();
let child;
let frontend;
let created = false;
let checks = 0;
const env = { ...process.env, DB_NAME: database, PORT: '0' };
const tokens = {};
const stop = async (process) => {
  if (process && process.exitCode === null) {
    const closed = new Promise((resolve) => process.once('exit', resolve));
    process.kill();
    await closed;
  }
};
async function runProcess(file, environment) {
  const process = spawn(processExec, [file], {
    cwd: path.resolve(root, '../..'),
    windowsHide: true,
    env: environment,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  process.stdout.on('data', (data) => {
    output += data;
  });
  process.stderr.on('data', (data) => {
    output += data;
  });
  const code = await new Promise((resolve, reject) => {
    process.once('exit', resolve);
    process.once('error', reject);
  });
  if (code !== 0)
    throw Error('Verification process failed:\n' + output.slice(-10000));
  return output;
}
const processExec = process.execPath;
try {
  await db.query(`CREATE DATABASE \`${database}\``);
  created = true;
  await db.query(`USE \`${database}\``);
  const schema = (
    await fs.readFile(path.join(root, 'database/schema.sql'), 'utf8')
  )
    .replace('CREATE DATABASE IF NOT EXISTS cpms;', '')
    .replace('USE cpms;', '');
  await db.query(schema);
  await db.query(
    await fs.readFile(path.join(root, 'database/workspace.sql'), 'utf8'),
  );
  await db.query(
    "INSERT INTO students (id,name,email,cgpa,branch,skills) VALUES ('STU002','Priya Patel','priya.patel@university.edu',9.1,'Information Technology','React, SQL')",
  );
  const accounts = [
    ['student', 'rahul.sharma@university.edu', 'STUDENT', 'STU001', null],
    ['recruiter', 'recruiter.techcorp@placement.edu', 'RECRUITER', null, 1],
    ['admin', 'admin@placement.edu', 'ADMIN', null, null],
    ['otherStudent', 'priya.patel@university.edu', 'STUDENT', 'STU002', null],
    [
      'otherRecruiter',
      'recruiter.datasystems@placement.edu',
      'RECRUITER',
      null,
      2,
    ],
    ['unlinked', 'unlinked@example.com', 'RECRUITER', null, null],
  ];
  for (const [key, email, role, studentId, companyId] of accounts) {
    const [saved] = await db.execute(
      'INSERT INTO users (email,password_hash,role,student_id,company_id) VALUES (?,?,?,?,?)',
      [email, 'test-only-unused', role, studentId, companyId],
    );
    tokens[key] = jwt.sign(
      {
        id: saved.insertId,
        email,
        role,
        student_id: studentId,
        company_id: companyId,
      },
      env.JWT_SECRET,
      { expiresIn: '15m' },
    );
  }
  await db.query(
    "INSERT INTO applications (id,student_id,company_id,status) VALUES (1,'STU001',1,'Applied'),(2,'STU002',2,'Applied')",
  );
  child = spawn(processExec, [path.join(root, 'backend/server.js')], {
    windowsHide: true,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const port = await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(Error('Test API startup timed out')),
      15000,
    );
    child.stdout.on('data', (data) => {
      const match = String(data).match(/http:\/\/localhost:(\d+)/);
      if (match) {
        clearTimeout(timer);
        resolve(Number(match[1]));
      }
    });
    child.stderr.on('data', (data) => {
      if (String(data).includes('Error'))
        console.error(String(data).slice(0, 500));
    });
    child.once('error', reject);
  });
  const base = `http://127.0.0.1:${port}`;
  const api = async (role, route, method = 'GET', body, expected = 200) => {
    const response = await fetch(base + route, {
      method,
      headers: {
        ...(role ? { Authorization: 'Bearer ' + tokens[role] } : {}),
        'Content-Type': 'application/json',
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const data = await response.json();
    assert.equal(
      response.status,
      expected,
      `${role || 'anonymous'} ${method} ${route}: ${JSON.stringify(data)}`,
    );
    checks++;
    return data;
  };
  const workspace = (role) => api(role, '/api/workspace');
  await api(null, '/api/workspace', 'GET', undefined, 401);
  await api('unlinked', '/api/workspace', 'GET', undefined, 403);
  assert.equal((await workspace('student')).profiles.length, 1);
  assert.equal((await workspace('recruiter')).profiles.length, 1);
  assert.equal((await workspace('otherRecruiter')).profiles[0].id, 'STU002');
  const profile = {
    name: 'Rahul Portfolio',
    phone: '9876543210',
    skills: 'React, MySQL',
    headline: 'Full stack developer',
    github: 'https://github.com/example',
    linkedin: 'https://linkedin.com/in/example',
  };
  await api('student', '/api/workspace/profile', 'PUT', {
    ...profile,
    studentId: 'STU002',
    cgpa: 1,
    email: 'changed@example.com',
  });
  const person = (await workspace('student')).profiles[0];
  assert.equal(person.name, profile.name);
  assert.equal(Number(person.cgpa), 8.5);
  assert.equal(person.email, 'rahul.sharma@university.edu');
  checks += 3;
  assert.equal(
    (await workspace('recruiter')).profiles[0].headline,
    profile.headline,
  );
  assert.equal(
    (await workspace('otherStudent')).profiles[0].name,
    'Priya Patel',
  );
  await api('recruiter', '/api/workspace/profile', 'PUT', profile, 403);
  await api(
    'student',
    '/api/workspace/profile',
    'PUT',
    { ...profile, name: ' ' },
    400,
  );
  await api(
    'student',
    '/api/workspace/profile',
    'PUT',
    { ...profile, github: 'javascript:alert(1)' },
    400,
  );
  await api(
    'student',
    '/api/workspace/profile',
    'PUT',
    { ...profile, phone: '1'.repeat(21) },
    400,
  );
  assert.equal((await workspace('student')).profiles[0].name, profile.name);

  const company = {
    name: 'IntegrationWorks',
    position: 'React Developer',
    location: 'Hyderabad',
    salary: '8 LPA',
    ctc: '10 LPA',
    openings: 3,
    workMode: 'Remote',
    deadline: '2028-01-01',
    skills: 'React, SQL',
    description: 'A complete server-saved opportunity.',
  };
  await api('student', '/api/companies', 'POST', company, 403);
  await api('recruiter', '/api/companies', 'POST', company, 403);
  await api(
    'admin',
    '/api/companies',
    'POST',
    { ...company, openings: -1 },
    400,
  );
  await api(
    'admin',
    '/api/companies',
    'POST',
    { ...company, deadline: '2027-02-30' },
    400,
  );
  await api('admin', '/api/companies', 'POST', { ...company, name: ' ' }, 400);
  const saved = await api('admin', '/api/companies', 'POST', company, 201);
  assert.equal(
    (await workspace('student')).driveDetails[saved.id].description,
    company.description,
  );
  await api('admin', `/api/companies/${saved.id}`, 'PUT', {
    ...company,
    position: 'Senior React Developer',
    skills: 'React, Node.js',
    description: 'Updated shared description.',
  });
  assert.deepEqual(
    (await workspace('otherStudent')).driveDetails[saved.id].tags,
    ['React', 'Node.js'],
  );
  // Legacy management fields must not erase newer detail fields.
  await api('admin', `/api/companies/${saved.id}`, 'PUT', {
    name: company.name,
    position: company.position,
    openings: 5,
  });
  assert.equal(
    (await workspace('student')).driveDetails[saved.id].description,
    'Updated shared description.',
  );
  await api('admin', `/api/companies/${saved.id}`, 'DELETE');
  assert.equal((await workspace('student')).driveDetails[saved.id], undefined);
  await api('admin', '/api/companies/1', 'DELETE', undefined, 409);

  const interview = {
    applicationId: 1,
    title: 'Portfolio interview',
    at: new Date(Date.now() + 86400000).toISOString(),
    venue: 'Placement cell, Room 204',
    duration: '45 minutes',
  };
  await api(
    'otherRecruiter',
    '/api/workspace/interviews',
    'POST',
    interview,
    403,
  );
  await api(
    'otherStudent',
    '/api/workspace/interviews',
    'POST',
    interview,
    403,
  );
  await api(
    'recruiter',
    '/api/workspace/interviews',
    'POST',
    { ...interview, at: 'not a date' },
    400,
  );
  await api(
    'recruiter',
    '/api/workspace/interviews',
    'POST',
    { ...interview, at: new Date(0).toISOString() },
    400,
  );
  await api(
    'recruiter',
    '/api/workspace/interviews',
    'POST',
    { ...interview, venue: ' ' },
    400,
  );
  await api(
    'recruiter',
    '/api/workspace/interviews',
    'POST',
    { ...interview, duration: 'invalid' },
    400,
  );
  const booking = await api(
    'recruiter',
    '/api/workspace/interviews',
    'POST',
    interview,
    201,
  );
  const studentView = await workspace('student');
  assert.equal(
    studentView.interviews[0].at,
    interview.at.replace(/\.\d{3}Z$/, '.000Z'),
  );
  assert.equal(studentView.interviews[0].canCancel, false);
  assert.equal(studentView.notices[0].read, false);
  checks += 3;
  assert.equal((await workspace('otherStudent')).interviews.length, 0);
  assert.equal((await workspace('otherRecruiter')).notices.length, 0);
  assert.equal((await workspace('admin')).interviews.length, 1);
  await api(
    'student',
    `/api/workspace/interviews/${booking.id}`,
    'DELETE',
    undefined,
    403,
  );
  await api(
    'otherRecruiter',
    `/api/workspace/interviews/${booking.id}`,
    'DELETE',
    undefined,
    403,
  );
  const personal = await api(
    'student',
    '/api/workspace/interviews',
    'POST',
    { ...interview, title: 'Private practice' },
    201,
  );
  assert.equal((await workspace('student')).interviews.length, 2);
  assert.equal((await workspace('recruiter')).interviews.length, 1);
  assert.equal((await workspace('admin')).interviews.length, 1);
  await api(
    'admin',
    `/api/workspace/interviews/${personal.id}`,
    'DELETE',
    undefined,
    403,
  );
  await api('student', `/api/workspace/interviews/${personal.id}`, 'DELETE');
  await api(
    'recruiter',
    '/api/workspace/notifications/read',
    'PATCH',
    { id: studentView.notices[0].id },
    404,
  );
  await api('student', '/api/workspace/notifications/read', 'PATCH', {
    id: studentView.notices[0].id,
  });
  assert.equal(
    (await workspace('student')).notices.find(
      (item) => item.id === studentView.notices[0].id,
    ).read,
    true,
  );
  await api('student', '/api/workspace/notifications/read', 'PATCH', {});
  assert.ok((await workspace('student')).notices.every((item) => item.read));
  await api('admin', `/api/workspace/interviews/${booking.id}`, 'DELETE');
  assert.equal((await workspace('student')).interviews.length, 0);
  assert.match((await workspace('student')).notices[0].title, /cancelled/);

  await api(
    'recruiter',
    '/api/applications/1/status',
    'PATCH',
    { status: 'Interview' },
    400,
  );
  await api(
    'otherRecruiter',
    '/api/applications/1/status',
    'PATCH',
    { status: 'Shortlisted' },
    403,
  );
  await api('recruiter', '/api/applications/1/status', 'PATCH', {
    status: 'Shortlisted',
  });
  assert.match((await workspace('student')).notices[0].title, /Shortlisted/);
  const linked = await api(
    'recruiter',
    '/api/workspace/interviews',
    'POST',
    interview,
    201,
  );
  await api('otherStudent', '/api/applications/1', 'DELETE', undefined, 403);
  await api('student', '/api/applications/1', 'DELETE');
  assert.ok(
    !(await workspace('recruiter')).interviews.some(
      (item) => item.id === linked.id,
    ),
  );
  assert.match((await workspace('student')).notices[0].title, /withdrawn/);
  const applied = await api(
    'student',
    '/api/applications',
    'POST',
    { companyId: 1 },
    201,
  );
  await api('student', '/api/applications', 'POST', { companyId: 1 }, 409);
  assert.equal(
    (await workspace('recruiter')).notices[0].applicationId,
    applied.id,
  );

  // If writing the notification fails, the application INSERT must roll back.
  await db.query('RENAME TABLE workspace_notifications TO notifications_held');
  try {
    await api('student', '/api/applications', 'POST', { companyId: 3 }, 500);
    const [rows] = await db.query(
      "SELECT id FROM applications WHERE student_id='STU001' AND company_id=3",
    );
    assert.equal(rows.length, 0);
    checks++;
    await api('student', '/api/workspace', 'GET', undefined, 503);
  } finally {
    await db.query(
      'RENAME TABLE notifications_held TO workspace_notifications',
    );
  }
  console.log(
    `Shared workspace API: ${checks} checks passed in a disposable database, including role boundaries, persistence, validation and rollback.`,
  );

  // Use a separate Vite instance whose /api proxy targets only this test API.
  const { createServer } = await import('vite');
  frontend = await createServer({
    root,
    configFile: path.join(root, 'vite.config.js'),
    logLevel: 'error',
    server: { host: '127.0.0.1', port: 0, proxy: { '/api': base } },
  });
  await frontend.listen();
  const browserOutput = await runProcess(
    path.join(root, 'tools/browser-check.mjs'),
    {
      ...env,
      BROWSER_SHARED_ONLY: '1',
      BROWSER_BASE_URL: `http://127.0.0.1:${frontend.httpServer.address().port}`,
    },
  );
  console.log(browserOutput.trim());
  await frontend.close();
  frontend = null;
  await stop(child);
  child = null;
  const legacy = path.resolve(root, '../../test_cpms_api.mjs');
  if (
    await fs.access(legacy).then(
      () => true,
      () => false,
    )
  ) {
    // The previous browser check intentionally renamed this fixture student.
    // Restore the legacy suite's expected fixture, within this temporary DB only.
    await db.execute(
      "UPDATE students SET name='Rahul Sharma' WHERE id='STU001'",
    );
    const socket = portAllocator();
    await new Promise((resolve) => socket.listen(0, '127.0.0.1', resolve));
    const legacyPort = socket.address().port;
    await new Promise((resolve) => socket.close(resolve));
    const output = await runProcess(legacy, {
      ...env,
      TEST_DB_NAME: database,
      TEST_DB_USER: env.DB_USER,
      TEST_DB_PASSWORD: env.DB_PASSWORD,
      TEST_DB_HOST: env.DB_HOST || 'localhost',
      TEST_DB_PORT: env.DB_PORT || '3306',
      TEST_PORT: String(legacyPort),
      ALLOW_ROOT_TEST: '1',
    });
    const result = output.match(/MILESTONE 3 TEST RESULTS:[^\r\n]+/);
    assert.ok(result, 'Existing API regression suite reported a result');
    console.log(result[0] + ' (disposable database)');
  }
} finally {
  if (frontend) await frontend.close();
  await stop(child);
  if (created && /^cpms_workspace_verify_[a-f0-9]{16}$/.test(database))
    await db.query(`DROP DATABASE \`${database}\``);
  assert.deepEqual(
    await digestLive(),
    baseline,
    'The four existing live CPMS tables must remain unchanged',
  );
  await db.end();
  console.log(
    'Disposable test database removed. All live CPMS core table digests unchanged.',
  );
}
