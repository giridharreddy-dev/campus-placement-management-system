import '../backend/env.js';
import mysql from 'mysql2/promise';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

if (!process.argv.includes('--initialize-workspace'))
  throw Error(
    'Use npm run db:workspace to explicitly install the additive workspace tables.',
  );
const db = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cpms',
});
const snapshot = async () => {
  const [tables] = await db.query('SHOW TABLES');
  const data = {};
  for (const row of tables) {
    const table = Object.values(row)[0];
    const [schema] = await db.query('SHOW CREATE TABLE ??', [table]);
    const [records] = await db.query('SELECT * FROM ?? ORDER BY 1', [table]);
    data[table] = { schema: Object.values(schema[0])[1], records };
  }
  return data;
};
try {
  const before = await snapshot();
  for (const table of ['students', 'companies', 'applications', 'users'])
    if (!before[table])
      throw Error('Initialize the core CPMS database first. Missing: ' + table);
  const folder = new URL('../.verification/database-backups/', import.meta.url);
  await fs.mkdir(folder, { recursive: true });
  const backup = new URL(`workspace-before-${Date.now()}.json`, folder);
  await fs.writeFile(
    backup,
    JSON.stringify(
      {
        database: process.env.DB_NAME || 'cpms',
        createdAt: new Date().toISOString(),
        tables: before,
      },
      null,
      2,
    ),
    { flag: 'wx' },
  );
  const sql = await fs.readFile(
    new URL('../database/workspace.sql', import.meta.url),
    'utf8',
  );
  for (const statement of sql
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean))
    await db.query(statement);
  const after = await snapshot();
  const hash = (value) =>
    createHash('sha256').update(JSON.stringify(value)).digest('hex');
  for (const [table, data] of Object.entries(before))
    if (hash(after[table]) !== hash(data))
      throw Error(
        'Existing table changed unexpectedly: ' +
          table +
          '. Backup: ' +
          backup.pathname,
      );
  console.log(
    'Workspace tables installed. Every pre-existing table and record is unchanged.',
  );
  console.log('Private database backup: ' + fileURLToPath(backup));
} finally {
  await db.end();
}
