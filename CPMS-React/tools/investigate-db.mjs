// Read-only incident evidence. Prints only cpms application row events.
import '../backend/env.js';
import mysql from 'mysql2/promise';
import { spawnSync } from 'node:child_process';
import { writeFile, mkdir } from 'node:fs/promises';

const db = await mysql.createConnection({ host: process.env.DB_HOST || 'localhost', user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '', port: Number(process.env.DB_PORT || 3306) });
try {
  const [logs] = await db.query('SHOW BINARY LOGS');
  const evidence = [];
  for (const log of logs.filter((entry) => entry.File_size > 1000).slice(-3)) {
    const result = spawnSync('mysqlbinlog', ['--read-from-remote-server', '--host', process.env.DB_HOST || 'localhost', '--port', process.env.DB_PORT || '3306', '--user', process.env.DB_USER || 'root', '--base64-output=DECODE-ROWS', '--verbose', log.Log_name], { env: { ...process.env, MYSQL_PWD: process.env.DB_PASSWORD || '' }, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024, windowsHide: true });
    if (result.status !== 0) throw new Error('Unable to read binary log: ' + result.stderr);
    const lines = result.stdout.split('\n');
    let context = [];
    for (let i = 0; i < lines.length; i++) {
      if (/^#\d{6}\s/.test(lines[i]) || /^# original_commit_timestamp/.test(lines[i]) || /thread_id=/.test(lines[i])) context = [...context.slice(-5), lines[i]];
      if (/^### (DELETE FROM|INSERT INTO|UPDATE) `cpms`\.`applications`/.test(lines[i])) {
        const row = [];
        for (let cursor = i; cursor < lines.length && lines[cursor].startsWith('###'); cursor++) row.push(lines[cursor]);
        evidence.push({ log: log.Log_name, context, row });
      }
    }
  }
  await mkdir(new URL('../.verification/', import.meta.url), { recursive: true });
  await writeFile(new URL('../.verification/application-binlog-evidence.json', import.meta.url), JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify(evidence.slice(-12), null, 2));
} finally { await db.end(); }
